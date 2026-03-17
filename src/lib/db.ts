import { PrismaClient } from "@prisma/client";
import pg from "pg";

import { env } from "@/env";

// Configure the connection pool with better defaults
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000, // Add statement timeout
  query_timeout: 10000, // Add query timeout
  allowExitOnIdle: true,
});

// Add connection initialization check
const initializePool = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database: Pool initialized :>>", {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    });
    client.release();
  } catch (error) {
    console.error("❌ Database: Pool initialization failed :>>", error);
    process.exit(1); // Exit if we can't establish initial connection
  }
};

// Initialize the pool
initializePool();

// Create Prisma client with better timeout handling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
};

const prisma = ((globalThis as any).prisma as PrismaClient) || prismaClientSingleton();

// Add transaction timeout middleware
const withTimeout = async (promise: Promise<any>, timeoutMs: number = 10000) => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    console.error("db.ts > withTimeout() > error :>>", error);
    throw error;
  }
};

// Export wrapped Prisma client with timeout
export const prismaWithTimeout = {
  ...prisma,
  $transaction: async (fn: any, options?: any) => {
    return withTimeout(prisma.$transaction(fn, options));
  },
};

export { pool, prisma };

// Cleanup on application shutdown
process.on("SIGINT", async () => {
  console.log("db.ts > Closing database connections...");
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});
