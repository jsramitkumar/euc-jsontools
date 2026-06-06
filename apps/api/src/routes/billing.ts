import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

// Credit packages
const PACKAGES = [
  { id: "starter", name: "Starter", credits: 10, priceInr: 5 },
  { id: "basic", name: "Basic", credits: 100, priceInr: 50 },
  { id: "pro", name: "Pro", credits: 1000, priceInr: 500, isPopular: true },
];

export const billingRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/billing/packages
  app.get("/packages", {
    schema: { tags: ["Billing"], summary: "List available credit packages" },
    handler: async (_request, reply) => {
      return reply.send({ success: true, data: PACKAGES });
    },
  });

  // POST /api/v1/billing/order
  app.post("/order", {
    preHandler: [requireAuth],
    schema: {
      tags: ["Billing"],
      summary: "Create a Razorpay order for credit purchase",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["packageId"],
        properties: { packageId: { type: "string" } },
      },
    },
    handler: async (request, reply) => {
      const { packageId } = request.body as { packageId: string };
      const pkg = PACKAGES.find((p) => p.id === packageId);

      if (!pkg) {
        return reply.status(400).send({
          success: false,
          error: { code: "INVALID_PACKAGE", message: "Package not found" },
        });
      }

      if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        return reply.status(503).send({
          success: false,
          error: { code: "PAYMENT_NOT_CONFIGURED", message: "Payment gateway not configured" },
        });
      }

      const { default: Razorpay } = await import("razorpay");
      const razorpay = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: pkg.priceInr * 100, // paise
        currency: "INR",
        receipt: `rcpt_${request.userId}_${Date.now()}`,
        notes: { userId: request.userId!, packageId, credits: String(pkg.credits) },
      });

      // Persist pending purchase
      await prisma.purchase.create({
        data: {
          userId: request.userId!,
          packageId,
          credits: pkg.credits,
          amountInr: pkg.priceInr,
          razorpayOrderId: order.id,
          status: "pending",
        },
      });

      return reply.send({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: env.RAZORPAY_KEY_ID,
        },
      });
    },
  });

  // POST /api/v1/billing/verify — Razorpay webhook / payment verify
  app.post("/verify", {
    preHandler: [requireAuth],
    schema: {
      tags: ["Billing"],
      summary: "Verify payment and credit account",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["razorpayOrderId", "razorpayPaymentId", "razorpaySignature"],
        properties: {
          razorpayOrderId: { type: "string" },
          razorpayPaymentId: { type: "string" },
          razorpaySignature: { type: "string" },
        },
      },
    },
    handler: async (request, reply) => {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
        request.body as {
          razorpayOrderId: string;
          razorpayPaymentId: string;
          razorpaySignature: string;
        };

      if (!env.RAZORPAY_KEY_SECRET) {
        return reply.status(503).send({
          success: false,
          error: { code: "PAYMENT_NOT_CONFIGURED", message: "Payment gateway not configured" },
        });
      }

      // Verify signature
      const { createHmac } = await import("crypto");
      const expectedSignature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return reply.status(400).send({
          success: false,
          error: { code: "INVALID_SIGNATURE", message: "Payment verification failed" },
        });
      }

      // Update purchase and credit user (in a transaction)
      const purchase = await prisma.purchase.findFirst({
        where: { razorpayOrderId, userId: request.userId },
      });

      if (!purchase || purchase.status !== "pending") {
        return reply.status(400).send({
          success: false,
          error: { code: "INVALID_ORDER", message: "Order not found or already processed" },
        });
      }

      await prisma.$transaction([
        prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: "paid", razorpayPaymentId },
        }),
        prisma.user.update({
          where: { id: request.userId },
          data: { credits: { increment: purchase.credits } },
        }),
      ]);

      return reply.send({
        success: true,
        data: { creditsAdded: purchase.credits },
      });
    },
  });
};
