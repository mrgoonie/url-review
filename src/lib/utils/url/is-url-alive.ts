import axios from "axios";
import { exec } from "child_process";
import { URL } from "url";

import { proxyUrlToAxiosProxy } from "../../proxy";

export async function isUrlAlive(
  url: string,
  options?: {
    timeout?: number;
    proxyUrl?: string;
  }
): Promise<{
  alive: boolean;
  avgResponseTime?: number;
  method?: "axios" | "ping";
  message?: string;
}> {
  try {
    // 1st attempt: try with axios
    const isAliveWithAxios = await isUrlAliveWithAxios(url, options);

    if (isAliveWithAxios.alive) {
      return { alive: true, method: "axios", message: isAliveWithAxios.message };
    } else {
      if (isAliveWithAxios.message.indexOf("certificate has expired") !== -1) {
        return { alive: false, method: "axios", message: isAliveWithAxios.message };
      }
    }

    // 2nd attempt: fallback to ping if axios fails
    const pingResult = await isUrlAliveWithPingCommand(url);

    return {
      ...pingResult,
      method: "ping",
      message: pingResult.message,
    };
  } catch (error) {
    console.error(`isUrlAlive.ts > isUrlAlive() > Error > ${url} :>> ${error}`);
    return { alive: false, message: `${error}` };
  }
}

export async function isUrlAliveWithAxios(
  url: string,
  options?: {
    timeout?: number;
    proxyUrl?: string;
  }
) {
  const startTime = Date.now();
  try {
    const proxy = options?.proxyUrl ? proxyUrlToAxiosProxy(options.proxyUrl) : undefined;

    const response = await axios.get(url, {
      timeout: options?.timeout || 10_000,
      proxy,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP status ${response.status}`);
    }

    return {
      alive: true,
      method: "axios",
      avgResponseTime: Date.now() - startTime,
      message: "URL is alive",
    };
  } catch (error) {
    console.error(`isUrlAlive.ts > isUrlAliveWithAxios() > Error > ${url} :>> ${error}`);
    return {
      alive: false,
      method: "axios",
      message: `${error}`,
      avgResponseTime: Date.now() - startTime,
    };
  }
}

export async function isUrlAliveWithPingCommand(
  url: string
): Promise<{ alive: boolean; avgResponseTime?: number; message?: string }> {
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
          message: "URL is alive",
        });
      });
    });
  } catch (error) {
    console.error(`isUrlAlive.ts > isUrlAliveWithPingCommand() > Error :>>`, error);
    return { alive: false, message: `${error}` };
  }
}
