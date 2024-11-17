import type express from "express";
import uaParser from "ua-parser-js";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getClientIp, getInfoIP } from "@/lib/network/ip";

export const LinkInfoSchema = z.object({
  ipAddress: z.string().optional(),
  device: z.string().optional(),
  os: z.string().optional(),
  browser: z.string().optional(),
  geo: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
});

export type LinkInfo = z.infer<typeof LinkInfoSchema>;

export async function parseLinkInfoFromRequest(req: express.Request) {
  const ipAddress = getClientIp(req);
  if (!ipAddress) return;

  const ipInfo = await getInfoIP(ipAddress);

  const userAgent = req.headers["user-agent"];
  if (!userAgent) return;

  const userAgentInfo = uaParser(userAgent);

  const info: LinkInfo = {
    ipAddress: req.ip,
    device: userAgentInfo.device.type,
    os: userAgentInfo.os.name,
    browser: userAgentInfo.browser.name,
    geo: ipInfo?.country_name,
    referrer: req.headers.referer,
    userAgent,
  };

  return info;
}

/**
 * Track link view
 * @param linkId - The ID of the link to track
 * @param info - The information to track
 * @returns The link view
 */
export async function trackLinkView(linkId: string, info?: LinkInfo) {
  const view = await prisma.linkView.create({ data: { linkId, ...info } });
  return view;
}

export async function trackLinkClick(linkId: string, info?: LinkInfo) {
  const click = await prisma.linkClick.create({ data: { linkId, ...info } });
  return click;
}
