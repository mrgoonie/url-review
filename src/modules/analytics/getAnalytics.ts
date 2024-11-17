import dayjs from "dayjs";

import { prisma } from "@/lib/db";

export const getAnalytics = async (linkId: string) => {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: {
      user: true,
      metadata: true,
      customMetadata: true,
    },
  });
  if (!link) return { status: 0, message: "Link not found" };

  // Get click counts for the specific link
  const clickCounts = await prisma.linkView.groupBy({
    by: ["linkId"],
    _count: {
      linkId: true,
    },
    where: {
      linkId: {
        equals: linkId,
      },
    },
  });

  // Get QR scan counts for the specific link
  const qrScanCounts = link.qrCodeId
    ? await prisma.qrCodeScan.groupBy({
        by: ["qrCodeId"],
        _count: {
          qrCodeId: true,
        },
        where: {
          qrCodeId: {
            equals: link.qrCodeId,
          },
        },
      })
    : [];

  // Create maps for quick access
  const clickCountMap = Object.fromEntries(
    clickCounts.map(({ linkId, _count }: { linkId: string; _count: { linkId: number } }) => [
      linkId,
      _count.linkId,
    ])
  );

  const qrScanCountMap = Object.fromEntries(
    qrScanCounts.map(({ qrCodeId, _count }: { qrCodeId: string; _count: { qrCodeId: number } }) => [
      qrCodeId,
      _count.qrCodeId || 0,
    ])
  );

  const createdAtFormatted = dayjs(link.createdAt).format("lll");
  const formattedLink = {
    ...link,
    clicks: clickCountMap[link.id] || 0,
    qrScanCount: link.qrCodeId ? qrScanCountMap[link.qrCodeId] || 0 : 0,
    createdAtFormatted,
  };

  // console.log("getAnalytics > formattedLink :>>", formattedLink);

  return {
    status: 1,
    data: formattedLink,
  };
};
