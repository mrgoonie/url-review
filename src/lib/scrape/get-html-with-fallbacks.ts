import { env } from "@/env";
import { wait } from "@/lib/utils/wait";

import { getHtmlWithAxios } from "./get-html-with-axios";
import { getHtmlWithFirecrawl } from "./get-html-with-firecrawl";
import { getHtmlContent } from "./get-html-with-playwright";
import { getHtmlWithScrapedo } from "./get-html-with-scrapedo";

/**
 * Get HTML content of a URL using multiple methods with fallbacks
 * Order of fallbacks:
 * 1. axios (fastest, but may fail with complex sites)
 * 2. playwright (more robust, but slower)
 * 3. scrapedo (external service)
 * 4. firecrawl (external service)
 */
export async function getHtmlWithFallbacks(
  url: string,
  options?: {
    timeout?: number;
    headers?: Record<string, string>;
    proxyUrl?: string;
    delayAfterLoad?: number;
    debug?: boolean;
    selectors?: string[];
    selectorMode?: "first" | "all";
  }
) {
  const debug = options?.debug ?? false;
  const timeout = options?.timeout ?? 30000;

  // Try axios first (fastest)
  try {
    if (debug) console.log(`get-html-with-fallbacks.ts > Trying axios for ${url}`);
    const html = await getHtmlWithAxios(url, {
      timeout,
      headers: options?.headers,
      proxyUrl: options?.proxyUrl,
    });
    if (html && typeof html === "string" && html.length > 0) {
      if (debug)
        console.log(`get-html-with-fallbacks.ts > Successfully fetched HTML with firecrawl`);
      if (debug) console.log(`get-html-with-fallbacks.ts > Successfully fetched HTML with axios`);
      return html;
    }
  } catch (error) {
    console.error(
      `get-html-with-fallbacks.ts > Axios failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // Wait before trying next method
    await wait(1000);
  }

  // Try playwright second (more robust)
  try {
    if (debug) console.log(`get-html-with-fallbacks.ts > Trying playwright for ${url}`);
    const html = await getHtmlContent(url, {
      delayAfterLoad: options?.delayAfterLoad,
      timeout,
      selectors: options?.selectors,
      selectorMode: options?.selectorMode,
      debug,
    });
    if (html && (typeof html === "string" || (Array.isArray(html) && html.length > 0))) {
      if (debug)
        console.log(`get-html-with-fallbacks.ts > Successfully fetched HTML with playwright`);

      return html;
    }
  } catch (error) {
    console.error(
      `get-html-with-fallbacks.ts > Playwright failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // Wait before trying next method
    await wait(1000);
  }

  // Try scrapedo third (external service)
  if (env.SCRAPE_DO_API_KEY) {
    try {
      if (debug) console.log(`get-html-with-fallbacks.ts > Trying scrapedo for ${url}`);
      const html = await getHtmlWithScrapedo(url, {
        timeout,
        headers: options?.headers,
        proxyUrl: options?.proxyUrl,
      });
      if (html && typeof html === "string" && html.length > 0) {
        if (debug)
          console.log(`get-html-with-fallbacks.ts > Successfully fetched HTML with scrapedo`);

        return html;
      }
    } catch (error) {
      console.error(
        `get-html-with-fallbacks.ts > Scrapedo failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // Wait before trying next method
      await wait(1000);
    }
  } else if (debug) {
    console.log(`get-html-with-fallbacks.ts > Skipping scrapedo (no API key)`);
  }

  // Try firecrawl last (external service)
  try {
    if (debug) console.log(`get-html-with-fallbacks.ts > Trying firecrawl for ${url}`);
    const html = await getHtmlWithFirecrawl(url, { debug });
    if (html && typeof html === "string" && html.length > 0) {
      if (debug)
        console.log(`get-html-with-fallbacks.ts > Successfully fetched HTML with firecrawl`);

      return html;
    }
  } catch (error) {
    console.error(
      `get-html-with-fallbacks.ts > Firecrawl failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // If all methods fail, throw an error
  throw new Error(`Failed to fetch HTML content for ${url} after trying all available methods`);
}
