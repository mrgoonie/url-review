/* eslint-disable prettier/prettier */
// Import axios
import axios from "axios";
import axiosRetry from "axios-retry";

import { env } from "@/env";

import { proxyUrlToAxiosProxy } from "../proxy";

// Configure axios with retry capability
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

// Get HTML content of a URL using axios
export async function getHtmlWithAxios(
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
  try {
    console.log(`get-html-with-axios.ts > Fetching HTML content from ${url}`);

    const response = await axios.get(url, {
      timeout: options?.timeout || 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        ...options?.headers,
      },
      responseType: "text",
    });

    return response.data;
  } catch (error) {
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

      const response = await axios.get(url, {
        timeout: options?.timeout || 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          ...options?.headers,
        },
        responseType: "text",
        proxy,
      });

      return response.data;
    } catch (error) {
      console.error(
        `get-html-with-axios.ts > Error fetching HTML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }
}
