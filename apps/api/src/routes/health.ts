import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", {
    schema: {
      tags: ["Health"],
      summary: "Health check",
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            timestamp: { type: "string" },
            uptime: { type: "number" },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      reply.send({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    },
  });

  app.get("/ready", {
    schema: { tags: ["Health"], summary: "Readiness check" },
    handler: async (_request, reply) => {
      // Could ping DB + Redis here
      reply.send({ status: "ready" });
    },
  });
};
