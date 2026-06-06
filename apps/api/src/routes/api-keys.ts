import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";

export const apiKeyRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/api-keys
  app.get("/", {
    preHandler: [requireAuth],
    schema: { tags: ["API Keys"], summary: "List API keys", security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const keys = await prisma.apiKey.findMany({
        where: { userId: request.userId },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          createdAt: true,
          lastUsedAt: true,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({ success: true, data: keys });
    },
  });

  // POST /api/v1/api-keys
  app.post("/", {
    preHandler: [requireAuth],
    schema: {
      tags: ["API Keys"],
      summary: "Create a new API key",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string", minLength: 1, maxLength: 50 } },
      },
    },
    handler: async (request, reply) => {
      const { name } = request.body as { name: string };

      const secret = randomBytes(32).toString("hex");
      const keyId = nanoid(8);
      const rawKey = `jt_live_${keyId}_${secret}`;
      const keyHash = createHash("sha256").update(rawKey).digest("hex");
      const keyPrefix = `jt_live_${keyId}_...`;

      const apiKey = await prisma.apiKey.create({
        data: {
          name,
          keyHash,
          keyPrefix,
          userId: request.userId!,
        },
      });

      // Return raw key ONCE — never stored in plaintext
      return reply.status(201).send({
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: rawKey, // Only returned at creation
          keyPrefix,
          createdAt: apiKey.createdAt,
        },
      });
    },
  });

  // DELETE /api/v1/api-keys/:id
  app.delete("/:id", {
    preHandler: [requireAuth],
    schema: {
      tags: ["API Keys"],
      summary: "Revoke an API key",
      security: [{ bearerAuth: [] }],
      params: { type: "object", properties: { id: { type: "string" } } },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.apiKey.updateMany({
        where: { id, userId: request.userId },
        data: { isActive: false },
      });

      return reply.send({ success: true, data: { revoked: true } });
    },
  });
};
