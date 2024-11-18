/* eslint-disable prettier/prettier */
import IORedis from "ioredis";

import { env } from "@/env";

// Retry strategy for subscriber
const retryStrategy = (times: number) => {
  console.log("❌ Redis: Connection error -> retry:", times);
  const delay = Math.min(times * 50, 2000);
  return delay;
};

console.log("🔄 Redis: Connecting...");

// Create Redis client
export const redis = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, {
      keyPrefix: env.REDIS_PREFIX || "ziione:",
      maxRetriesPerRequest: 3,
      retryStrategy,
    })
  : null;

// Redis client (Subscriber)
export let redisSubscriber: IORedis;

redis?.on("error", (error) => {
  console.error("❌ Redis client error :>>", error);
});

redis?.on("connect", () => {
  console.log("✅ Redis client connected");
});

// Helper functions for caching
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis?.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("redis.ts > getCachedData() > Error :>>", error);
    return null;
  }
}

export async function setCachedData(key: string, data: unknown, ttl = 300): Promise<void> {
  try {
    await redis?.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error("redis.ts > setCachedData() > Error :>>", error);
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    await redis?.del(key);
  } catch (error) {
    console.error("redis.ts > deleteCachedData() > Error :>>", error);
  }
}

export async function clearCacheByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis?.keys(pattern);
    if (keys?.length && keys.length > 0) {
      await redis?.del(...keys);
    }
  } catch (error) {
    console.error("redis.ts > clearCacheByPattern() > Error :>>", error);
  }
}

// Publish message
export const publishMessage = async (roomId: string, message: string) => {
  await redis?.publish(`chat:${roomId}`, message);
};

// Subscribe to room
// eslint-disable-next-line no-unused-vars
export const subscribeToRoom = (roomId: string, callback: (message: string) => void) => {
  if (!callback) {
    throw new Error("Callback function is required for room subscription");
  }

  const subscriber = redis?.duplicate();
  if (!subscriber) throw new Error("Redis client not initialized");

  subscriber.subscribe(`chat:${roomId}`);
  subscriber.on("message", (_channel, message) => {
    callback(message);
  });
  return subscriber;
};

// Save message
export const saveMessage = async (roomId: string, message: string) => {
  await redis?.rpush(`chat:historysuwer :${roomId}`, message);
};

// Get chat history
export const getChatHistory = async (roomId: string, limit = 50) => {
  return redis?.lrange(`chat:history:${roomId}`, -limit, -1);
};

// Add user to room
export const addUserToRoom = async (roomId: string, userId: string) => {
  await redis?.sadd(`chat:users:${roomId}`, userId);
};

// Get users in room
export const getUsersInRoom = async (roomId: string) => {
  return redis?.smembers(`chat:users:${roomId}`);
};

export default redis;
