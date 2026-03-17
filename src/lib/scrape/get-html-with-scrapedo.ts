/* eslint-disable prettier/prettier */
// Import axios
import axios from "axios";

import { env } from "@/env";

import { proxyUrlToAxiosProxy } from "../proxy";

const BASE_URL = "https://api.scrape.do";

// Get HTML content of a URL using axios
export async function getHtmlWithScrapedo(
  url: string,
  options?: {
    /**
     * Timeout for the request in milliseconds
     * @default 30_000
     */
    timeout?: number;
    headers?: Record<string, string>;
    proxyUrl?: string;
  }
): Promise<string> {
  const apiUrl = `${BASE_URL}?token=${env.SCRAPE_DO_API_KEY}&url=${encodeURIComponent(url)}`;

  try {
    console.log(`get-html-with-scrapedo.ts > Fetching HTML content from ${url}`);

    // try without proxy first

    const response = await axios.get(apiUrl, {
      timeout: options?.timeout || 30_000,
      responseType: "text",
    });

    return response.data;
  } catch (error) {
    console.error(
      `get-html-with-scrapedo.ts > Error fetching HTML: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.log("get-html-with-scrapedo.ts > Try with proxy...");

    // try with proxy (if any)
    try {
      const proxy = options?.proxyUrl
        ? proxyUrlToAxiosProxy(options.proxyUrl)
        : env.PROXY_URL
        ? proxyUrlToAxiosProxy(env.PROXY_URL)
        : undefined;

      if (!proxy) {
        throw new Error("Proxy URL is not defined");
      }

      const response = await axios.get(apiUrl, {
        timeout: options?.timeout || 30_000,
        responseType: "text",
        proxy,
      });

      return response.data;
    } catch (error) {
      console.error(
        `get-html-with-scrapedo.ts > Error fetching HTML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }
}
