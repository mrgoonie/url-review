import dayjs from "dayjs";

import { getCachedData, setCachedData } from "@/lib/cache"; // Import cache functions
import { prisma } from "@/lib/db";

export const getOs = async (
  linkId: string,
  options: { startDate?: string; endDate?: string; page?: string; limit?: string }
) => {
  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) return { status: 0, message: "Link not found" };

  const { startDate, endDate, page = 1, limit = 50 } = options;
  const parsedLimit = limit ? parseInt(limit.toString()) : 0;
  const parsedPage = page ? parseInt(page.toString()) : 1;
  const skip = (parsedPage - 1) * parsedLimit;

  // Check cache first
  const cacheKey = `os:${linkId}:${startDate || ""}:${endDate || ""}:${page}:${limit}`;
  const cachedData = await getCachedData(cacheKey);

  if (cachedData) {
    console.log("getOs > Cache hit :>>", cachedData);
    return cachedData;
  }

  const osData = await prisma.linkView.groupBy({
    by: ["os"],
    _count: {
      os: true,
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
    orderBy: { os: "asc" },
  });

  const formattedOsData = osData.map((item: { os: string | null; _count: { os: any } }) => ({
    os: item.os === "-" || item.os === null ? "Unknown" : item.os,
    count: item._count.os,
  }));

  const totalUniqueOs = await prisma.linkView.groupBy({
    by: ["os"],
    where: {
      linkId,
      createdAt: {
        gte: startDate ? dayjs(startDate.toString()).toDate() : undefined,
        lte: endDate ? dayjs(endDate.toString()).toDate() : undefined,
      },
    },
  });

  const total = totalUniqueOs.length;

  const result = {
    status: 1,
    data: {
      list: formattedOsData,
      total,
      limit: parsedLimit,
      page: parsedPage,
      totalPage: parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 1,
    },
  };

  // Set cache
  await setCachedData(cacheKey, result);

  return result;
};
