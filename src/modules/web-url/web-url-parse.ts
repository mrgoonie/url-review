import type express from "express";
import uaParser from "ua-parser-js";
import { z } from "zod";

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
