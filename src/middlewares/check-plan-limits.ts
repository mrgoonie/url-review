import dayjs from "dayjs";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { redis } from "@/lib/redis";
import { getUserPlanLimits } from "@/modules/payment/manage-plans";
import { respondFailure } from "@/modules/response/respond-helper";

// Zod schema for request validation
const RequestSchema = z.object({
  user: z.object({
    id: z.string(),
  }),
});

/**
 * Get Redis key for rate limiting
 */
const getRedisKeys = (userId: string) => {
  const minuteKey = `rate-limit:${userId}:per-minute`;
  const monthKey = `rate-limit:${userId}:per-month`;
  return { minuteKey, monthKey };
};

// --- In-memory fallback when Redis is unavailable ---
const memCache = new Map<string, { count: number; expiresAt: number }>();

function memIncr(key: string, ttlSeconds: number): number {
  const now = Date.now();
  const entry = memCache.get(key);

  if (entry && entry.expiresAt > now) {
    entry.count += 1;
    return entry.count;
  }

  // Expired or new — reset
  memCache.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
  return 1;
}

// Periodically clean up expired entries (every 5 minutes)
// .unref() allows Node to exit cleanly without waiting for this timer
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of memCache) {
      if (entry.expiresAt <= now) memCache.delete(key);
    }
  },
  5 * 60 * 1000
).unref();

/**
 * Increment a rate-limit counter using Redis, falling back to in-memory Map.
 */
async function incrCounter(key: string, ttlSeconds: number): Promise<number> {
  // Redis unavailable — use in-memory fallback
  if (!redis) return memIncr(key, ttlSeconds);

  try {
    const count = await redis.incr(key);
    await redis.expire(key, ttlSeconds);
    return count;
  } catch {
    // Redis error at runtime — fallback to memory
    return memIncr(key, ttlSeconds);
  }
}

/**
 * Middleware to check user plan request limits
 */
export const checkPlanLimits = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request
    const result = RequestSchema.safeParse(res.locals);
    if (!result.success) {
      return res.status(400).json(respondFailure("Invalid request"));
    }

    const { user } = result.data;
    const { minuteKey, monthKey } = getRedisKeys(user.id);

    // Get user plan limits
    const planLimits = await getUserPlanLimits(user.id);
    if (!planLimits) {
      return res.status(403).json(respondFailure("No active plan found"));
    }

    console.log(`[checkPlanLimits] planLimits :>>`, planLimits);
    const { maxRequestsPerMinute, maxRequestsPerMonth } = planLimits;

    // Check requests per minute (sliding window)
    const currentMinute = dayjs().minute();
    const minuteWindow = `${minuteKey}:${currentMinute}`;
    const requestsThisMinute = await incrCounter(minuteWindow, 60);

    if (requestsThisMinute > maxRequestsPerMinute) {
      return res
        .status(429)
        .json(respondFailure("Rate limit exceeded. Please try again in a minute."));
    }

    // Check requests per month
    const currentMonth = dayjs().format("YYYY-MM");
    const monthWindow = `${monthKey}:${currentMonth}`;
    const requestsThisMonth = await incrCounter(monthWindow, 31 * 24 * 60 * 60);

    if (requestsThisMonth > maxRequestsPerMonth) {
      return res
        .status(429)
        .json(respondFailure("Monthly request limit exceeded. Please upgrade your plan."));
    }

    // All checks passed
    next();
  } catch (error) {
    console.error("Error in checkPlanLimits middleware:", error);
    return res.status(500).json(respondFailure("Internal server error while checking plan limits"));
  }
};
