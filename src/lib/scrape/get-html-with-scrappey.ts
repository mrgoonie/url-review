// Import axios
import axios from "axios";

import { env } from "@/env";

/**
 * Get HTML content of a URL using https://rapidapi.com/dormic/api/scrappey-com
 * @param url The URL to fetch HTML from
 * @param options Optional parameters
 * @returns The HTML content as a string
 */
export async function getHtmlWithScrappey(
  url: string,
  options?: {
    /**
     * Timeout for the request in milliseconds
     * @default 30_000
     */
    timeout?: number;
    debug?: boolean;
  }
): Promise<string> {
  const requestOptions = {
    method: "POST",
    url: "https://scrappey-com.p.rapidapi.com/api/v1",
    timeout: options?.timeout || 30000,
    headers: {
      "x-rapidapi-key": env.RAPID_API_KEY,
      "x-rapidapi-host": "scrappey-com.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: {
      cmd: "request.get",
      url,
    },
  };

  try {
    console.log(`get-html-with-scrappey.ts > Fetching HTML content from ${url}`);

    const response = await axios.request(requestOptions);

    return response.data;
  } catch (error) {
    console.error(
      `get-html-with-scrappey.ts > Error fetching HTML: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}
