import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
});

redisClient.on("connect", () => logger.info("Redis connected"));
redisClient.on("error", (err: unknown) => logger.error({ err }, "Redis error"));

export async function connectRedis() {
  await redisClient.connect();
}
