import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

// Extend Fastify request type
declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    userRole?: string;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const payload = request.user as { sub: string; role: string };
    request.userId = payload.sub;
    request.userRole = payload.role;
  } catch {
    reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await requireAuth(request, reply);
  if (request.userRole !== "admin") {
    reply.status(403).send({
      success: false,
      error: { code: "FORBIDDEN", message: "Admin access required" },
    });
  }
}

export async function requireCredits(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await requireAuth(request, reply);

  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    select: { credits: true, role: true },
  });

  if (!user) {
    return reply.status(401).send({
      success: false,
      error: { code: "USER_NOT_FOUND", message: "User not found" },
    });
  }

  if (user.role === "free" && user.credits <= 0) {
    return reply.status(402).send({
      success: false,
      error: {
        code: "INSUFFICIENT_CREDITS",
        message: "No credits remaining. Please purchase more credits.",
      },
    });
  }
}

/**
 * Authenticate via API key (for programmatic access)
 */
export async function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const rawKey = request.headers["x-api-key"] as string | undefined;
  if (!rawKey) {
    return reply.status(401).send({
      success: false,
      error: { code: "MISSING_API_KEY", message: "x-api-key header required" },
    });
  }

  // Key format: jt_<env>_<prefix>_<secret>
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: { keyHash: await hashApiKey(rawKey), isActive: true },
    include: { user: true },
  });

  if (!apiKeyRecord) {
    return reply.status(401).send({
      success: false,
      error: { code: "INVALID_API_KEY", message: "Invalid or revoked API key" },
    });
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() },
  });

  request.userId = apiKeyRecord.user.id;
  request.userRole = apiKeyRecord.user.role;
}

async function hashApiKey(key: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(key).digest("hex");
}
