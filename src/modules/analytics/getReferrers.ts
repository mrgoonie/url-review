import dayjs from "dayjs";

import { getCachedData, setCachedData } from "@/lib/cache";
import { prisma } from "@/lib/db";

export const getReferrers = async (
  linkId: string,
  options: { startDate?: string; endDate?: string; page?: string; limit?: string }
) => {
  // Generate cache key based on parameters
  const cacheKey = `referrers:${linkId}:${options.startDate || ""}:${options.endDate || ""}:${
    options.page || "1"
  }:${options.limit || "50"}`;

  // Try to get data from cache first
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    console.log("getReferrers.ts > getReferrers() > Serving from cache");
    return cachedData;
  }

  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) return { status: 0, message: "Link not found" };

  const { startDate, endDate, page = 1, limit = 50 } = options;
  const parsedLimit = limit ? parseInt(limit.toString()) : 0;
  const parsedPage = page ? parseInt(page.toString()) : 1;
  const skip = (parsedPage - 1) * parsedLimit;

  const referrerData = await prisma.linkView.groupBy({
    by: ["referrer"],
    _count: {
      _all: true,
    },
    where: {
      linkId,
      createdAt: {
        gte: startDate ? dayjs(startDate.toString()).toDate() : undefined,
        lte: endDate ? dayjs(endDate.toString()).toDate() : undefined,
      },
    },
    take: parsedLimit > 0 ? parsedLimit : undefined,
    skip: parsedLimit > 0 ? skip : undefined,
    orderBy: { referrer: "asc" },
  });

  const formattedReferrerData = referrerData.map(
    (item: { referrer: string | null; _count: { _all: number } }) => ({
      referrer: item.referrer === "-" || item.referrer === null ? "None" : item.referrer,
      count: item._count._all,
    })
  );

  const totalUniqueReferrer = await prisma.linkView.groupBy({
    by: ["referrer"],
    where: {
      linkId,
      createdAt: {
        gte: startDate ? dayjs(startDate.toString()).toDate() : undefined,
        lte: endDate ? dayjs(endDate.toString()).toDate() : undefined,
      },
    },
  });

  const total = totalUniqueReferrer.length;

  const result = {
    status: 1,
    data: {
      list: formattedReferrerData,
      total,
      limit: parsedLimit,
      page: parsedPage,
      totalPage: parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 1,
    },
  };

  // Cache the result for 5 minutes
  await setCachedData(cacheKey, result, 300);

  return result;
};
