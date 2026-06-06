import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { requireAuth, requireCredits } from "../middleware/auth.js";
import { runComparison } from "../services/comparison.service.js";
import { prisma } from "../lib/prisma.js";

const compareBodySchema = z.object({
  json1: z.unknown(),
  json2: z.unknown(),
  options: z
    .object({
      ignoreOrder: z.boolean().optional(),
      ignoreCasing: z.boolean().optional(),
      ignoreWhitespace: z.boolean().optional(),
      ignorePaths: z.array(z.string()).optional(),
      ttlHours: z.number().min(1).max(168).optional(),
      accessPassword: z.string().min(4).max(72).optional(),
    })
    .optional(),
});

/** Reusable check: is this comparison expired? */
function isExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

export const compareRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/compare
  app.post("/compare", {
    preHandler: [requireAuth, requireCredits],
    schema: {
      tags: ["Compare"],
      summary: "Compare two JSON payloads",
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      body: {
        type: "object",
        required: ["json1", "json2"],
        properties: {
          json1: {},
          json2: {},
          options: {
            type: "object",
            properties: {
              ignoreOrder: { type: "boolean" },
              ignoreCasing: { type: "boolean" },
              ignoreWhitespace: { type: "boolean" },
              ignorePaths: { type: "array", items: { type: "string" } },
              ttlHours: { type: "number", minimum: 1, maximum: 168,
                description: "Hours until this comparison is auto-deleted (default: 12, max: 168)" },
              accessPassword: { type: "string", minLength: 4, maxLength: 72,
                description: "Optional password to protect the share link" },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const body = compareBodySchema.parse(request.body);

      const result = await runComparison(
        { json1: body.json1, json2: body.json2, options: body.options },
        request.userId!
      );

      // Deduct 1 credit
      await prisma.user.update({
        where: { id: request.userId },
        data: { credits: { decrement: 1 } },
      });

      await prisma.usageLog.create({
        data: {
          userId: request.userId!,
          endpoint: "/api/v1/compare",
          creditsUsed: 1,
          statusCode: 200,
          processingTimeMs: result.processingTimeMs,
        },
      });

      return reply.send({ success: true, data: result });
    },
  });

  // GET /api/v1/comparison/:id  (owner only)
  app.get("/comparison/:id", {
    preHandler: [requireAuth],
    schema: {
      tags: ["Compare"],
      summary: "Get a comparison result by ID (owner only)",
      security: [{ bearerAuth: [] }],
      params: { type: "object", properties: { id: { type: "string" } } },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const comparison = await prisma.comparison.findFirst({
        where: { id, userId: request.userId },
      });

      if (!comparison) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Comparison not found" },
        });
      }

      if (isExpired(comparison.expiresAt)) {
        return reply.status(410).send({
          success: false,
          error: { code: "EXPIRED", message: "This comparison has expired and been discarded" },
        });
      }

      return reply.send({ success: true, data: comparison });
    },
  });

  // GET /api/v1/comparison/share/:token  (public — metadata only for protected)
  app.get("/comparison/share/:token", {
    schema: {
      tags: ["Compare"],
      summary: "Get a shared comparison (public). Returns 423 if password-protected.",
      params: { type: "object", properties: { token: { type: "string" } } },
    },
    handler: async (request, reply) => {
      const { token } = request.params as { token: string };

      const comparison = await prisma.comparison.findFirst({
        where: { shareToken: token },
        select: {
          id: true,
          result: true,
          createdAt: true,
          expiresAt: true,
          isProtected: true,
          json1: true,
          json2: true,
        },
      });

      if (!comparison) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Shared comparison not found" },
        });
      }

      if (isExpired(comparison.expiresAt)) {
        return reply.status(410).send({
          success: false,
          error: { code: "EXPIRED", message: "This comparison has expired and been discarded" },
        });
      }

      // Protected — return metadata only, caller must POST /unlock
      if (comparison.isProtected) {
        return reply.status(423).send({
          success: false,
          error: {
            code: "PASSWORD_REQUIRED",
            message: "This comparison is password-protected",
          },
          data: {
            id: comparison.id,
            isProtected: true,
            expiresAt: comparison.expiresAt.toISOString(),
            createdAt: comparison.createdAt.toISOString(),
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          id: comparison.id,
          result: comparison.result,
          json1: comparison.json1,
          json2: comparison.json2,
          isProtected: false,
          expiresAt: comparison.expiresAt.toISOString(),
          createdAt: comparison.createdAt.toISOString(),
        },
      });
    },
  });

  // POST /api/v1/comparison/share/:token/unlock  (verify password → return data)
  app.post("/comparison/share/:token/unlock", {
    schema: {
      tags: ["Compare"],
      summary: "Unlock a password-protected shared comparison",
      params: { type: "object", properties: { token: { type: "string" } } },
      body: {
        type: "object",
        required: ["password"],
        properties: { password: { type: "string" } },
      },
    },
    handler: async (request, reply) => {
      const { token } = request.params as { token: string };
      const { password } = request.body as { password: string };

      const comparison = await prisma.comparison.findFirst({
        where: { shareToken: token },
        select: {
          id: true,
          result: true,
          createdAt: true,
          expiresAt: true,
          isProtected: true,
          accessPasswordHash: true,
          json1: true,
          json2: true,
        },
      });

      if (!comparison) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Shared comparison not found" },
        });
      }

      if (isExpired(comparison.expiresAt)) {
        return reply.status(410).send({
          success: false,
          error: { code: "EXPIRED", message: "This comparison has expired and been discarded" },
        });
      }

      if (!comparison.isProtected || !comparison.accessPasswordHash) {
        return reply.status(400).send({
          success: false,
          error: { code: "NOT_PROTECTED", message: "This comparison is not password-protected" },
        });
      }

      const valid = await argon2.verify(comparison.accessPasswordHash, password);
      if (!valid) {
        return reply.status(401).send({
          success: false,
          error: { code: "WRONG_PASSWORD", message: "Incorrect password" },
        });
      }

      return reply.send({
        success: true,
        data: {
          id: comparison.id,
          result: comparison.result,
          json1: comparison.json1,
          json2: comparison.json2,
          isProtected: true,
          expiresAt: comparison.expiresAt.toISOString(),
          createdAt: comparison.createdAt.toISOString(),
        },
      });
    },
  });
};

