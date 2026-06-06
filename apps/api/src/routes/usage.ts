import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const usageRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/usage
  app.get("/", {
    preHandler: [requireAuth],
    schema: {
      tags: ["Usage"],
      summary: "Get API usage summary",
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const userId = request.userId!;

      const [user, logs, totalRequests, totalCreditsUsed] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        }),
        prisma.usageLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.usageLog.count({ where: { userId } }),
        prisma.usageLog.aggregate({
          where: { userId },
          _sum: { creditsUsed: true },
        }),
      ]);

      const requestsByEndpoint = logs.reduce<Record<string, number>>(
        (acc, log) => {
          acc[log.endpoint] = (acc[log.endpoint] ?? 0) + 1;
          return acc;
        },
        {}
      );

      return reply.send({
        success: true,
        data: {
          remainingCredits: user?.credits ?? 0,
          totalRequests,
          totalCreditsUsed: totalCreditsUsed._sum.creditsUsed ?? 0,
          requestsByEndpoint,
          recentLogs: logs,
        },
      });
    },
  });
};
