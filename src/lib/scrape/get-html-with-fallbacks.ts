import { env } from "@/env";
import { wait } from "@/lib/utils/wait";

import { getHtmlWithAxios } from "./get-html-with-axios";
import { getHtmlWithFirecrawl } from "./get-html-with-firecrawl";
import { getHtmlContent } from "./get-html-with-playwright";
import { getHtmlWithScrapedo } from "./get-html-with-scrapedo";
import { getHtmlWithScrappey } from "./get-html-with-scrappey";

/**
 * Get HTML content of a URL using multiple methods with fallbacks
 * Order of fallbacks:
 * 1. axios (fastest, but may fail with complex sites)
 * 2. playwright (more robust, but slower)
 * 3. scrappey (external service)
 * 4. scrapedo (external service)
 * 5. firecrawl (external service)
 */
export async function getHtmlWithFallbacks(
  url: string,
  options?: {
    delayBetweenRetries?: number;
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

  // 1. Try axios first (fastest)
  try {
    if (debug) console.log(`get-html-with-fallbacks.ts > STEP 1: Trying axios for ${url}`);
    const html = await getHtmlWithAxios(url, {
      timeout,
      headers: options?.headers,
      proxyUrl: options?.proxyUrl,
    });
    if (html && typeof html === "string" && html.length > 0) {
      if (debug)
        console.log(`get-html-with-fallbacks.ts > STEP 1: Successfully fetched HTML with axios`);
      return html;
    }
  } catch (error) {
    console.error(
      `get-html-with-fallbacks.ts > STEP 1: Axios failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // Wait before trying next method
    await wait(options?.delayBetweenRetries ?? 0);
  }

  // 2. Try playwright second (more robust)
  try {
    if (debug) console.log(`get-html-with-fallbacks.ts > STEP 2: Trying playwright for ${url}`);
    const html = await getHtmlContent(url, {
      delayAfterLoad: options?.delayAfterLoad,
      timeout,
      selectors: options?.selectors,
      selectorMode: options?.selectorMode,
      debug,
    });
    if (html && (typeof html === "string" || (Array.isArray(html) && html.length > 0))) {
      if (debug)
        console.log(
          `get-html-with-fallbacks.ts > STEP 2: Successfully fetched HTML with playwright`
        );

      return html;
    }
  } catch (error) {
    console.error(
      `get-html-with-fallbacks.ts > STEP 2: Playwright failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // Wait before trying next method
    await wait(options?.delayBetweenRetries ?? 0);
  }

  // 3. Try scrapedo third (external service)
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
          console.log(
            `get-html-with-fallbacks.ts > STEP 3: Successfully fetched HTML with scrapedo`
          );

        return html;
      }
    } catch (error) {
      console.error(
        `get-html-with-fallbacks.ts > STEP 3: Scrapedo failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // Wait before trying next method
      await wait(options?.delayBetweenRetries ?? 0);
    }
  } else if (debug) {
    console.log(`get-html-with-fallbacks.ts > STEP 3: Skipping scrapedo (no API key)`);
  }

  // 4. Try scrappey fourth (external service)
  if (env.RAPID_API_KEY) {
    try {
      if (debug) console.log(`get-html-with-fallbacks.ts > STEP 4: Trying scrappey for ${url}`);
      const html = await getHtmlWithScrappey(url, {
        timeout,
        debug,
      });
      if (html && typeof html === "string" && html.length > 0) {
        if (debug)
          console.log(
            `get-html-with-fallbacks.ts > STEP 4: Successfully fetched HTML with scrappey`
          );

        return html;
      }
    } catch (error) {
      console.error(
        `get-html-with-fallbacks.ts > STEP 4: Scrappey failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // Wait before trying next method
      await wait(options?.delayBetweenRetries ?? 0);
    }
  } else if (debug) {
    console.log(`get-html-with-fallbacks.ts > STEP 4: Skipping scrappey (no API key)`);
  }

  // 5. Try firecrawl last (external service)
  try {
    if (debug) console.log(`get-html-with-fallbacks.ts > STEP 5: Trying firecrawl for ${url}`);
    const response = await getHtmlWithFirecrawl(url, { debug });
    if (response.success && response.data.html) {
      if (debug)
        console.log(
          `get-html-with-fallbacks.ts > STEP 5: Successfully fetched HTML with firecrawl`
        );

      return response.data.html;
    }
  } catch (error) {
    console.error(
      `get-html-with-fallbacks.ts > STEP 5: Firecrawl failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // If all methods fail, throw an error
  throw new Error(`Failed to fetch HTML content for ${url} after trying all available methods`);
}
