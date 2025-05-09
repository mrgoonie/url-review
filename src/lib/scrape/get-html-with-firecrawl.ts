import { env } from "@/env";

const BASE_URL = "https://api.firecrawl.dev/v1";

export type ResponseData = {
  metadata: any;
  html: string;
  markdown?: string;
};

export type ResponseType = {
  success: boolean;
  data: ResponseData;
  error?: string;
};

// Get HTML content of a URL using axios
export async function getHtmlWithFirecrawl(
  url: string,
  options?: {
    timeout?: number;
    headers?: Record<string, string>;
    debug?: boolean;
  }
): Promise<ResponseType> {
  try {
    const apiUrl = `${BASE_URL}/scrape`;

    if (options?.debug) {
      console.log(`get-html-with-firecrawl.ts > Fetching HTML content from ${url}`);
      console.log(`get-html-with-firecrawl.ts > API URL: ${apiUrl}`);
      console.log(`get-html-with-firecrawl.ts > API KEY: ${env.FIRECRAWL_API_KEY}`);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["html"],
        proxy: "basic",
        headers: options?.headers,
        timeout: options?.timeout,
      }),
    });

    const data = (await response.json()) as ResponseType;

    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error(
      `get-html-with-firecrawl.ts > Error fetching HTML: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}
