// Import axios
import axios from "axios";

import { env } from "@/env";

const BASE_URL = "https://api.firecrawl.dev/v1";

// Get HTML content of a URL using axios
export async function getHtmlWithFirecrawl(
  url: string,
  options?: {
    debug?: boolean;
  }
): Promise<string> {
  try {
    if (options?.debug) {
      console.log(`get-html-with-firecrawl.ts > Fetching HTML content from ${url}`);
    }

    const response = await axios.post(`${BASE_URL}/scrape`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
      },
      data: {
        url,
        formats: ["html"],
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      `get-html-with-firecrawl.ts > Error fetching HTML: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}
