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
    const requestsThisMinute = await redis.incr(minuteWindow);

    // Set expiry for minute window (1 minute)
    await redis.expire(minuteWindow, 60);

    if (requestsThisMinute > maxRequestsPerMinute) {
      return res
        .status(429)
        .json(respondFailure("Rate limit exceeded. Please try again in a minute."));
    }

    // Check requests per month
    const currentMonth = dayjs().format("YYYY-MM"); // YYYY-MM
    const monthWindow = `${monthKey}:${currentMonth}`;
    const requestsThisMonth = await redis.incr(monthWindow);

    // Set expiry for month window (31 days to be safe)
    await redis.expire(monthWindow, 31 * 24 * 60 * 60);

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
