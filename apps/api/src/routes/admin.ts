import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/admin/users
  app.get("/users", {
    preHandler: [requireAdmin],
    schema: {
      tags: ["Admin"],
      summary: "List all users",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "number", default: 1 },
          pageSize: { type: "number", default: 20 },
        },
      },
    },
    handler: async (request, reply) => {
      const { page = 1, pageSize = 20 } = request.query as {
        page?: number;
        pageSize?: number;
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            credits: true,
            createdAt: true,
          },
        }),
        prisma.user.count(),
      ]);

      return reply.send({
        success: true,
        data: { items: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      });
    },
  });

  // GET /api/v1/admin/stats
  app.get("/stats", {
    preHandler: [requireAdmin],
    schema: { tags: ["Admin"], summary: "Platform statistics", security: [{ bearerAuth: [] }] },
    handler: async (_request, reply) => {
      const [totalUsers, totalComparisons, totalRevenue, usageToday] =
        await Promise.all([
          prisma.user.count(),
          prisma.comparison.count(),
          prisma.purchase.aggregate({
            where: { status: "paid" },
            _sum: { amountInr: true },
          }),
          prisma.usageLog.count({
            where: {
              createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
          }),
        ]);

      return reply.send({
        success: true,
        data: {
          totalUsers,
          totalComparisons,
          totalRevenueInr: totalRevenue._sum.amountInr ?? 0,
          usageToday,
        },
      });
    },
  });
};
