import axios from "axios";
import type express from "express";
const IP_INFO_API = "https://api.iplocation.net";

export interface IPInfo {
  ip: string;
  ip_number: string;
  ip_version: number;
  country_name: string;
  country_code2: string;
  isp: string;
  response_code: string;
  response_message: string;
}

export function getClientIp(req: express.Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0] || req.socket?.remoteAddress || req.ip || null;
  }
  return forwardedFor?.[0] || req.socket?.remoteAddress || req.ip || null;
}

// Get user IP info
export async function getInfoIP(userIP: string, options?: { debug?: boolean }) {
  try {
    const response = await axios.get(`${IP_INFO_API}?ip=${userIP}`);
    const info = response.data;
    if (options?.debug) console.log(`getUserIP() > Info of "${userIP}":`, info);
    return info as IPInfo;
  } catch (error) {
    console.error("getUserIP() > Error fetching IP info:", error);
    return null;
  }
}
