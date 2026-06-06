/**
 * Comparison TTL cleanup job.
 * Runs every hour and hard-deletes comparisons past their expiresAt timestamp.
 * Uses a simple setInterval — BullMQ is overkill for a single periodic task.
 */
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export async function runCleanupOnce(): Promise<number> {
  const { count } = await prisma.comparison.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}

export function startCleanupJob(): void {
  // Run once immediately on startup to clear any backlog
  runCleanupOnce()
    .then((n) => logger.info(`[cleanup] Startup purge: deleted ${n} expired comparison(s)`))
    .catch((err) => logger.error({ err }, "[cleanup] Startup purge failed"));

  // Then run every hour
  const timer = setInterval(async () => {
    try {
      const n = await runCleanupOnce();
      if (n > 0) {
        logger.info(`[cleanup] Deleted ${n} expired comparison(s)`);
      }
    } catch (err) {
      logger.error({ err }, "[cleanup] Periodic cleanup failed");
    }
  }, CLEANUP_INTERVAL_MS);

  // Don't keep the process alive just for this timer
  timer.unref();

  logger.info("[cleanup] TTL cleanup job started (interval: 1 h)");
}
