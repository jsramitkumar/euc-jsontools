import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/auth/register
  app.post("/register", {
    schema: {
      tags: ["Auth"],
      summary: "Register a new user",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string" },
        },
      },
    },
    handler: async (request, reply) => {
      const body = registerSchema.parse(request.body);

      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: { code: "EMAIL_EXISTS", message: "Email already registered" },
        });
      }

      const passwordHash = await argon2.hash(body.password);

      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name ?? null,
          role: "free",
          credits: 10, // Free signup credits
        },
      });

      const token = app.jwt.sign(
        { sub: user.id, role: user.role },
        { expiresIn: "15m" }
      );

      return reply.status(201).send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            credits: user.credits,
          },
        },
      });
    },
  });

  // POST /api/v1/auth/login
  app.post("/login", {
    schema: {
      tags: ["Auth"],
      summary: "Login",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
    },
    handler: async (request, reply) => {
      const body = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user || !user.passwordHash) {
        return reply.status(401).send({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        });
      }

      const valid = await argon2.verify(user.passwordHash, body.password);
      if (!valid) {
        return reply.status(401).send({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        });
      }

      const token = app.jwt.sign(
        { sub: user.id, role: user.role },
        { expiresIn: "15m" }
      );

      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            credits: user.credits,
          },
        },
      });
    },
  });

  // GET /api/v1/auth/me
  app.get("/me", {
    preHandler: [requireAuth],
    schema: { tags: ["Auth"], summary: "Get current user", security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { id: true, email: true, name: true, role: true, credits: true, createdAt: true },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        });
      }

      return reply.send({ success: true, data: user });
    },
  });
};
