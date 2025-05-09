import Redis from "ioredis";

import { env } from "@/env";

// Redis client (Publisher)
export let redis: Redis;

// Redis client (Subscriber)
export let redisSubscriber: Redis;

const retryStrategy = (times: number) => {
  console.log("❌ Redis: Connection error -> retry:", times);
  const delay = Math.min(times * 50, 2000);
  return delay;
};

/**
 * Initialize Redis function
 */
export const initRedis = () => {
  if (!env.REDIS_URL) {
    console.error("Redis credentials are not set");
    return;
  }

  console.log("🔄 Redis: Connecting...");

  const url = new URL(env.REDIS_URL);

  // Create a new client for publisher
  redis = new Redis({
    name: "publisher",
    host: url.hostname,
    port: parseInt(url.port),
    username: url.username,
    password: url.password,
    retryStrategy,
    keyPrefix: env.REDIS_PREFIX as string,
  });

  // Create a duplicate client for subscriber
  // redisSubscriber = redis.duplicate();
  // redisSubscriber.options.name = "subscriber";
  // redisSubscriber.options.retryStrategy = retryStrategy;
  // redisSubscriber.subscribe();

  // Set the key prefix
  redis.options.keyPrefix = env.REDIS_PREFIX as string;

  // Handle Redis connection success
  redis.on("connect", () => {
    console.log("✅ Redis: Connected");
  });

  // Handle Redis disconnect
  redis.on("disconnect", () => {
    console.log("❌ Redis: Disconnected");
  });

  // Handle Redis connection errors
  redis.on("error", (error) => {
    console.error(`❌ Redis: ${error}`);
  });

  return redis;
};

// Add to cache
export const addToCache = async (key: string, value: string, ttl?: number) => {
  await redis.set(key, value);
  if (ttl) await redis.expire(key, ttl);
};

// Get from cache
export const getFromCache = async (key: string) => {
  return redis.get(key);
};

// Clear cache
export const clearCache = async (key: string) => {
  await redis.del(key);
};

// Publish message
export const publishMessage = async (roomId: string, message: string) => {
  await redis.publish(`chat:${roomId}`, message);
};

// Subscribe to room
// eslint-disable-next-line no-unused-vars
export const subscribeToRoom = (roomId: string, callback: (message: string) => void) => {
  const subscriber = redis.duplicate();
  subscriber.subscribe(`chat:${roomId}`);
  subscriber.on("message", (_channel, message) => {
    callback(message);
  });
  return subscriber;
};

// Save message
export const saveMessage = async (roomId: string, message: string) => {
  await redis.rpush(`chat:historysuwer :${roomId}`, message);
};

// Get chat history
export const getChatHistory = async (roomId: string, limit = 50) => {
  return redis.lrange(`chat:history:${roomId}`, -limit, -1);
};

// Add user to room
export const addUserToRoom = async (roomId: string, userId: string) => {
  await redis.sadd(`chat:users:${roomId}`, userId);
};

// Get users in room
export const getUsersInRoom = async (roomId: string) => {
  return redis.smembers(`chat:users:${roomId}`);
};
