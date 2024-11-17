import dayjs from "dayjs";
import { z } from "zod";

import { getCachedData, setCachedData } from "@/lib/cache";
import { prisma } from "@/lib/db";

export const getClicks = async (
  linkId: string,
  options: { startDate?: string; endDate?: string; page?: string; limit?: string }
) => {
  try {
    const link = await prisma.link.findUnique({ where: { id: linkId } });
    if (!link) return { status: 0, message: "Link not found" };

    const { startDate, endDate, page = 1, limit = 50 } = options;
    const parsedLimit = limit ? parseInt(limit.toString()) : 0;
    const parsedPage = page ? parseInt(page.toString()) : 1;
    const skip = (parsedPage - 1) * parsedLimit;

    // Check cache first
    const cacheKey = `clicks:${linkId}:${startDate || ""}:${endDate || ""}:${page}:${limit}`;
    const cachedData = await getCachedData<{
      status: number;
      data: {
        list: any[];
        total: number;
        limit: number;
        page: number;
        totalPage: number;
      };
    }>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const total = await prisma.linkView.count({ where: { linkId } }).catch((error: any) => {
      console.error("getClicks.ts > getClicks() > Count error :>>", error);
      return 0;
    });

    const list = await prisma.linkView
      .findMany({
        where: {
          linkId,
          createdAt: {
            gte: startDate ? dayjs(startDate.toString()).toDate() : undefined,
            lte: endDate ? dayjs(endDate.toString()).toDate() : undefined,
          },
        },
        take: parsedLimit > 0 ? parsedLimit : undefined,
        skip: parsedLimit > 0 ? skip : undefined,
      })
      .catch((error: any) => {
        console.error("getClicks.ts > getClicks() > Query error :>>", error);
        return [];
      });

    // format data
    const formattedList = list.map((item) => ({
      ...item,
      createdAtFormatted: dayjs(item.createdAt).format("lll"),
    }));

    const result = {
      status: 1,
      data: {
        list: formattedList,
        total,
        limit: parsedLimit,
        page: parsedPage,
        totalPage: Math.ceil(total / parsedLimit),
      },
    };

    // Cache results for 5 minutes
    await setCachedData(cacheKey, result, 300).catch((error) => {
      console.error("getClicks.ts > getClicks() > Cache error :>>", error);
    });

    return result;
  } catch (error) {
    console.error("getClicks.ts > getClicks() > Error :>>", error);
    return {
      status: 0,
      message: "An error occurred while fetching clicks",
    };
  }
};

// Validation schema
const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function countClicksByDates(linkId: string, startDate: string, endDate: string) {
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
    const cacheKey = `clicks-by-dates:${linkId}:${startDate}:${endDate}`;
    const cachedData = await getCachedData<{
      status: number;
      data: Array<{ date: string; count: number }>;
    }>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const link = await prisma.link.findUnique({ where: { id: linkId } });
    if (!link) return { status: 0, message: "Link not found" };

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

    const clickCounts = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT 
        DATE("createdAt") as date,
        CAST(COUNT(*) AS INTEGER) as count
      FROM "LinkView"
      WHERE "linkId" = ${linkId}
        AND "createdAt" >= ${startDateTime.toDate()}
        AND "createdAt" <= ${endDateTime.toDate()}
      GROUP BY DATE("createdAt")
    `;
    // console.log("clickCounts :>>", clickCounts);

    // Create a date range array
    const dateRange = [];
    let currentDate = startDateTime;
    while (currentDate.isBefore(endDateTime) || currentDate.isSame(endDateTime, "day")) {
      dateRange.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    // Updated aggregation logic
    const aggregatedCounts = dateRange.reduce(
      (acc: Record<string, { date: string; count: number }>, date) => {
        const countItem = clickCounts.find(
          (item: { date: string; count: number }) => dayjs(item.date).format("YYYY-MM-DD") === date
        );
        acc[date] = { date, count: countItem ? countItem.count : 0 };
        return acc;
      },
      {}
    );

    // Convert aggregated counts to an array
    const formattedList = Object.values(aggregatedCounts);

    const result = {
      status: 1,
      data: formattedList,
    };

    // Cache results for 5 minutes
    await setCachedData(cacheKey, result, 300).catch((error) => {
      console.error("getClicks.ts > countClicksByDates() > Cache error :>>", error);
    });

    return result;
  } catch (error) {
    console.error("getClicks.ts > countClicksByDates() > Error :>>", error);
    return {
      status: 0,
      message: "An error occurred while fetching click counts",
    };
  }
}
