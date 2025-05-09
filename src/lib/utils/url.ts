import axios from "axios";
import { exec } from "child_process";
import { URL } from "url";

import { proxyUrlToAxiosProxy } from "../proxy";

export async function isUrlAlive(
  url: string,
  options?: {
    timeout?: number;
    proxyUrl?: string;
  }
): Promise<{ alive: boolean; avgResponseTime?: number; method?: "axios" | "ping" }> {
  try {
    // 1st attempt: try with axios
    const isAliveWithAxios = await isUrlAliveWithAxios(url, options);

    if (isAliveWithAxios) {
      return { alive: true, method: "axios" };
    }

    // 2nd attempt: fallback to ping if axios fails
    const pingResult = await isUrlAliveWithPingCommand(url);

    return {
      ...pingResult,
      method: "ping",
    };
  } catch (error) {
    console.error(`isUrlAlive.ts > isUrlAlive() > Error :>>`, error);
    return { alive: false };
  }
}

export async function isUrlAliveWithAxios(
  url: string,
  options?: {
    timeout?: number;
    proxyUrl?: string;
  }
) {
  try {
    const proxy = options?.proxyUrl ? proxyUrlToAxiosProxy(options.proxyUrl) : undefined;

    const response = await axios.get(url, {
      timeout: options?.timeout || 10_000,
      proxy,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP status ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`isUrlAlive.ts > isUrlAlive() > Error :>>`, error);
    return false;
  }
}

export async function isUrlAliveWithPingCommand(
  url: string
): Promise<{ alive: boolean; avgResponseTime?: number }> {
  try {
    // Extract hostname from URL
    const hostname = new URL(url).hostname;

    // Execute ping command (4 packets, 1 second timeout)
    return new Promise((resolve) => {
      exec(`ping -c 4 -W 1000 ${hostname}`, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error(`isUrlAlive.ts > isUrlAliveWithPingCommand() > Error :>>`, error || stderr);
          resolve({ alive: false });
          return;
        }

        // Parse ping output
        const output = stdout.toString();

        // Check if we received responses
        const packetLossMatch = output.match(/(\d+)% packet loss/);
        const packetLoss = packetLossMatch ? parseInt(packetLossMatch[1], 10) : 100;

        // Extract average response time if available
        const avgTimeMatch = output.match(/min\/avg\/max\/.+?\s=\s[\d.]+\/([\d.]+)\/[\d.]+/);
        const avgResponseTime = avgTimeMatch ? parseFloat(avgTimeMatch[1]) : undefined;

        // Consider URL alive if packet loss is less than 100%
        const alive = packetLoss < 100;

        resolve({
          alive,
          avgResponseTime: alive ? avgResponseTime : undefined,
        });
      });
    });
  } catch (error) {
    console.error(`isUrlAlive.ts > isUrlAliveWithPingCommand() > Error :>>`, error);
    return { alive: false };
  }
}

export async function getUrlAfterRedirects(url: string) {
  try {
    const response = await axios.head(url);
    return response.request.res.responseUrl;
  } catch (error) {
    console.error(`getUrlAfterRedirects.ts > getUrlAfterRedirects() > Error :>>`, error);
    return url;
  }
}
