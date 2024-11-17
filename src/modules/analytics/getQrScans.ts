import dayjs from "dayjs";
import { z } from "zod";

import { getCachedData, setCachedData } from "@/lib/cache";
import { prisma } from "@/lib/db";

export const getQrScans = async (
  linkId: string,
  options: { startDate?: string; endDate?: string; page?: string; limit?: string }
) => {
  // Generate cache key based on parameters
  const cacheKey = `qr-scans:${linkId}:${options.startDate || ""}:${options.endDate || ""}:${
    options.page || "1"
  }:${options.limit || "50"}`;

  // Try to get data from cache first
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log("getQrScans.ts > getQrScans() > Serving from cache");
    return cachedData;
  }

  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) return { status: 0, message: "Link not found" };
  if (!link.qrCodeId) return { status: 0, message: "Link has no QR code" };

  const { startDate, endDate, page = 1, limit = 50 } = options;
  const parsedLimit = limit ? parseInt(limit.toString()) : 0;
  const parsedPage = page ? parseInt(page.toString()) : 1;
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await prisma.qrCodeScan
    .count({
      where: { qrCodeId: link.qrCodeId },
    })
    .catch((error: any) => {
      console.error("getQrScans.ts > getQrScans() > Count error :>>", error);
      return 0;
    });

  const list = await prisma.qrCodeScan
    .findMany({
      where: {
        qrCodeId: link.qrCodeId,
        createdAt: {
          gte: startDate ? dayjs(startDate.toString()).toDate() : undefined,
          lte: endDate ? dayjs(endDate.toString()).toDate() : undefined,
        },
      },
      take: parsedLimit > 0 ? parsedLimit : undefined,
      skip: parsedLimit > 0 ? skip : undefined,
    })
    .catch((error: any) => {
      console.error("getQrScans.ts > getQrScans() > List error :>>", error);
      return [];
    });

  const result = {
    status: 1,
    data: {
      list,
      total,
      limit: parsedLimit,
      page: parsedPage,
      totalPage: Math.ceil(total / parsedLimit),
    },
  };

  // Cache the result for 5 minutes
  await setCachedData(cacheKey, result, 300);

  return result;
};

// Validation schema
const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function countQrScansByDates(linkId: string, startDate: string, endDate: string) {
  // console.log("getQrScans.ts > countQrScansByDates() > params :>>", { linkId, startDate, endDate });

  try {
    // Validate input dates
    const validation = DateRangeSchema.safeParse({ startDate, endDate });
    if (!validation.success) {
      return {
        status: 0,
        message: "Invalid date format. Use YYYY-MM-DD",
      };
    }

    // Check cache first
    const cacheKey = `qr-scans:${linkId}:${startDate}:${endDate}`;
    const cachedData = await getCachedData<{
      status: number;
      data: Array<{ date: string; count: number }>;
    }>(cacheKey);

    if (cachedData) {
      // console.log("getQrScans.ts > countQrScansByDates() > Serving from cache");
      return cachedData;
    }

    // Validate link and QR code with timeout
    const linkPromise = prisma.link.findUnique({
      where: { id: linkId },
      select: { qrCodeId: true },
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database query timeout")), 5000);
    });

    const link = await Promise.race([linkPromise, timeoutPromise]).catch((error) => {
      console.error("getQrScans.ts > countQrScansByDates() > Link query error :>>", error);
      return null;
    });

    if (!link) return { status: 0, message: "Link not found or query timeout" };
    if (!(link as any).qrCodeId) return { status: 0, message: "Link has no QR code" };

    // Parse dates
    const startDateTime = dayjs(startDate).startOf("day");
    const endDateTime = dayjs(endDate).endOf("day");

    // Validate date range
    const daysDiff = endDateTime.diff(startDateTime, "days");
    if (daysDiff > 90) {
      return { status: 0, message: "Date range cannot exceed 90 days" };
    }
    if (daysDiff < 0) {
      return { status: 0, message: "Start date must be before end date" };
    }

    // Fetch scans with timeout
    const scansPromise = prisma.qrCodeScan.findMany({
      where: {
        qrCodeId: (link as any).qrCodeId,
        createdAt: {
          gte: startDateTime.toDate(),
          lte: endDateTime.toDate(),
        },
      },
      select: {
        createdAt: true,
      },
    });

    const scans = await Promise.race([scansPromise, timeoutPromise]).catch((error) => {
      console.error("getQrScans.ts > countQrScansByDates() > Scans query error :>>", error);
      return [];
    });

    // Process results
    const countsMap = new Map<string, number>();
    const formattedList: Array<{ date: string; count: number }> = [];

    // Pre-fill all dates with 0 counts
    let currentDate = startDateTime;
    while (currentDate.isBefore(endDateTime) || currentDate.isSame(endDateTime, "day")) {
      const dateStr = currentDate.format("YYYY-MM-DD");
      countsMap.set(dateStr, 0);
      currentDate = currentDate.add(1, "day");
    }
    // Validate scans type
    const validatedScans = z
      .array(
        z.object({
          createdAt: z.string(), // Assuming createdAt is a string, adjust if necessary
        })
      )
      .parse(scans);

    // Count actual scans
    validatedScans.forEach((scan) => {
      const dateStr = dayjs(scan.createdAt).format("YYYY-MM-DD");
      countsMap.set(dateStr, (countsMap.get(dateStr) || 0) + 1);
    });

    // Convert map to sorted array
    Array.from(countsMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .forEach(([date, count]) => {
        formattedList.push({ date, count });
      });

    // console.log("getQrScans.ts > countQrScansByDates() > result length :>>", formattedList.length);

    const result = {
      status: 1,
      data: formattedList,
    };

    // Cache results
    await setCachedData(cacheKey, result, 300).catch((error) => {
      console.error("getQrScans.ts > countQrScansByDates() > Cache error :>>", error);
    });

    return result;
  } catch (error) {
    console.error("getQrScans.ts > countQrScansByDates() > Error :>>", error);
    return {
      status: 0,
      message: "An error occurred while fetching QR scan counts",
    };
  }
}
