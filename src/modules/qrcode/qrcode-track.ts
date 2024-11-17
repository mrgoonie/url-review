import { prisma } from "@/lib/db";

import type { LinkInfo } from "../link";

/**
 * Track link view
 * @param linkId - The ID of the link to track
 * @param info - The information to track
 * @returns The link view
 */
export async function trackQrCodeScan(qrCodeId: string, info?: LinkInfo) {
  const scan = await prisma.qrCodeScan.create({ data: { qrCodeId, ...info } });
  return scan;
}
