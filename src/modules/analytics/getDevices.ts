import dayjs from "dayjs";

import { getCachedData, setCachedData } from "@/lib/cache"; // Import cache functions
import { prisma } from "@/lib/db";

export const getDevices = async (
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
  const cacheKey = `devices:${linkId}:${startDate || ""}:${endDate || ""}:${page}:${limit}`;
  const cachedData = await getCachedData(cacheKey);

  if (cachedData) {
    console.log("getDevices > Cache hit :>>", cachedData);
    return cachedData;
  }

  const deviceData = await prisma.linkView.groupBy({
    by: ["device"],
    _count: {
      device: true,
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
    orderBy: { device: "asc" },
  });

  const formattedDeviceData = deviceData.map((item) => ({
    device: item.device === "-" || item.device === null ? "Unknown" : item.device,
    count: item._count.device,
  }));

  const totalUniqueDevice = await prisma.linkView.groupBy({
    by: ["device"],
    where: {
      linkId,
      createdAt: {
        gte: startDate ? dayjs(startDate.toString()).toDate() : undefined,
        lte: endDate ? dayjs(endDate.toString()).toDate() : undefined,
      },
    },
  });

  const total = totalUniqueDevice.length;

  const result = {
    status: 1,
    data: {
      list: formattedDeviceData,
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
