// Import axios
import axios from "axios";

import { env } from "@/env";

const BASE_URL = "https://api.scrape.do";

// Get HTML content of a URL using axios
export async function getHtmlWithScrapedo(
  url: string,
  options?: { timeout?: number; headers?: Record<string, string> }
): Promise<string> {
  try {
    console.log(`get-html-with-scrapedo.ts > Fetching HTML content from ${url}`);

    // try without proxy first
    const apiUrl = `${BASE_URL}?token=${env.SCRAPE_DO_API_KEY}&url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      timeout: options?.timeout || 30000,
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
      const apiUrl = `${BASE_URL}?token=${env.SCRAPE_DO_API_KEY}&url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl, {
        timeout: options?.timeout || 30000,
        responseType: "text",
        proxy: {
          protocol: "http",
          host: "proxy.scrape.do",
          port: 8080,
          auth: {
            username: env.SCRAPE_DO_API_KEY,
            password: "",
          },
        },
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
