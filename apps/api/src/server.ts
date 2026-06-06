// Entry point — loads env first, then starts Fastify
import "dotenv/config";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    logger.info(`API running at http://${env.API_HOST}:${env.API_PORT}`);
    logger.info(
      `Swagger UI: http://${env.API_HOST}:${env.API_PORT}/documentation`
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
