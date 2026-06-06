import Fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { redisClient } from "./lib/redis.js";

// Route plugins
import { authRoutes } from "./routes/auth.js";
import { compareRoutes } from "./routes/compare.js";
import { utilRoutes } from "./routes/utils.js";
import { billingRoutes } from "./routes/billing.js";
import { usageRoutes } from "./routes/usage.js";
import { apiKeyRoutes } from "./routes/api-keys.js";
import { adminRoutes } from "./routes/admin.js";
import { healthRoutes } from "./routes/health.js";
import { startCleanupJob } from "./services/cleanup.service.js";

export async function buildApp() {
  const app = Fastify({
    logger: logger as any,
    trustProxy: true,
    ajv: {
      customOptions: {
        strict: "log",
        keywords: ["kind", "modifier"],
      },
    },
  });

  // ---- Security ----
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Swagger UI needs this off
  });

  await app.register(fastifyCors, {
    origin:
      env.NODE_ENV === "production"
        ? [env.NEXT_PUBLIC_APP_URL]
        : true, // allow all in dev
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // ---- Rate Limiting ----
  await app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: "1 minute",
    redis: redisClient,
    keyGenerator: (request) =>
      (request.headers["x-api-key"] as string) || request.ip,
  });

  // ---- Auth ----
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  // ---- Swagger Docs ----
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "JSONTools API",
        description: "Production-grade JSON Compare SaaS API",
        version: "1.0.0",
      },
      servers: [{ url: `http://${env.API_HOST}:${env.API_PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
    uiConfig: { docExpansion: "list", deepLinking: false },
  });

  // ---- Routes ----
  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(compareRoutes, { prefix: "/api/v1" });
  await app.register(utilRoutes, { prefix: "/api/v1" });
  await app.register(billingRoutes, { prefix: "/api/v1/billing" });
  await app.register(usageRoutes, { prefix: "/api/v1/usage" });
  await app.register(apiKeyRoutes, { prefix: "/api/v1/api-keys" });
  await app.register(adminRoutes, { prefix: "/api/v1/admin" });

  // ---- Background Jobs ----
  startCleanupJob();

  // ---- Graceful Shutdown ----
  const shutdown = async () => {
    app.log.info("Shutting down...");
    await app.close();
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return app;
}
