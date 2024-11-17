import dayjs from "dayjs";

import { getCachedData, setCachedData } from "@/lib/cache";
import { prisma } from "@/lib/db";

export const getCountries = async (
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
  const cacheKey = `countries:${linkId}:${startDate || ""}:${endDate || ""}:${page}:${limit}`;
  const cachedData = await getCachedData(cacheKey);

  if (cachedData) {
    console.log("getCountries > Cache hit :>>", cachedData);
    return cachedData;
  }

  const geoData = await prisma.linkView.groupBy({
    by: ["geo"],
    _count: {
      geo: true,
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
    orderBy: { geo: "asc" },
  });

  const formattedGeoData = geoData.map((item: { geo: string | null; _count: { geo: any } }) => ({
    geo: item.geo === "-" || item.geo === null ? "Unknown" : item.geo,
    count: item._count.geo,
  }));

  const totalUniqueGeos = await prisma.linkView.groupBy({
    by: ["geo"],
    where: {
      linkId,
      createdAt: {
        gte: startDate ? dayjs(startDate.toString()).toDate() : undefined,
        lte: endDate ? dayjs(endDate.toString()).toDate() : undefined,
      },
    },
  });

  const total = totalUniqueGeos.length;

  const result = {
    status: 1,
    data: {
      list: formattedGeoData,
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
