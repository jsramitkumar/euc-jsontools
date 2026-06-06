import { createHash } from "crypto";
import { nanoid } from "nanoid";
import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { redisClient } from "../lib/redis.js";
import { compareJson } from "./compare-engine.js";
import type { CompareRequest, CompareResponse } from "@jsontools/shared";

const CACHE_TTL_SECONDS = 3600;
const MAX_JSON_SIZE_BYTES = 1024 * 1024;
const DEFAULT_TTL_HOURS = 12;
const MAX_TTL_HOURS = 168; // 7 days cap

export async function runComparison(
  request: CompareRequest,
  userId: string
): Promise<CompareResponse> {
  const size1 = JSON.stringify(request.json1).length;
  const size2 = JSON.stringify(request.json2).length;

  if (size1 > MAX_JSON_SIZE_BYTES || size2 > MAX_JSON_SIZE_BYTES) {
    throw new Error("JSON payload exceeds 1 MB limit");
  }

  const cacheKey = buildCacheKey(request);
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as CompareResponse;
  }

  const result = compareJson(request.json1, request.json2, request.options);
  const comparisonId = nanoid(12);
  const shareToken = nanoid(20);

  // TTL — clamp between 1 and MAX_TTL_HOURS, default 12 h
  const ttlHours = Math.min(
    Math.max(request.options?.ttlHours ?? DEFAULT_TTL_HOURS, 1),
    MAX_TTL_HOURS
  );
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  // Optional access password
  const rawPassword = request.options?.accessPassword;
  const isProtected = Boolean(rawPassword);
  const accessPasswordHash = rawPassword
    ? await argon2.hash(rawPassword)
    : null;

  await prisma.comparison.create({
    data: {
      id: comparisonId,
      userId,
      json1: request.json1 as any,
      json2: request.json2 as any,
      options: (request.options ?? {}) as any,
      result: result as any,
      shareToken,
      expiresAt,
      isProtected,
      accessPasswordHash,
    },
  });

  const response: CompareResponse = {
    comparisonId,
    status: "success",
    summary: result.summary,
    differences: result.differences,
    imageUrl: null,
    htmlUrl: `/api/v1/comparison/${comparisonId}/html`,
    shareToken,
    processingTimeMs: result.processingTimeMs,
    expiresAt: expiresAt.toISOString(),
    isProtected,
  };

  await redisClient.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));

  return response;
}

function buildCacheKey(request: CompareRequest): string {
  const payload = JSON.stringify({
    j1: request.json1,
    j2: request.json2,
    opts: request.options ?? {},
  });
  return `compare:${createHash("sha256").update(payload).digest("hex")}`;
}

