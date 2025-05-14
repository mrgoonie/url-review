/* eslint-disable no-unused-vars */
import * as cheerio from "cheerio";

import { env } from "@/env";
import { wait } from "@/lib/utils/wait";

import { getHtmlWithAxios } from "./get-html-with-axios";
import { getHtmlWithFirecrawl } from "./get-html-with-firecrawl";
import { getHtmlContent } from "./get-html-with-playwright";
import { getHtmlWithScrapedo } from "./get-html-with-scrapedo";
import { getHtmlWithScrappey } from "./get-html-with-scrappey";

/**
 * Simplify HTML content by removing unnecessary elements to reduce token count for LLMs
 * @param html - The HTML content to simplify
 * @returns Simplified HTML content
 */
function simplifyHtml(html: string): string {
  try {
    const $ = cheerio.load(html);

    // Remove scripts, styles, and other non-essential elements
    $("script").remove();
    $("style").remove();
    $('link[rel="stylesheet"]').remove();
    $("meta").remove();
    $("svg").remove();
    $("iframe").remove();
    $("noscript").remove();
    $("head").remove();
    $("[style]").removeAttr("style");
    $("*")
      .removeAttr("class")
      .removeAttr("id")
      .removeAttr("onclick")
      .removeAttr("data-*")
      .removeAttr("aria-*")
      .removeAttr("role")
      .removeAttr("tabindex")
      .removeAttr("target")
      .removeAttr("rel")
      .removeAttr("srcset")
      .removeAttr("sizes")
      .removeAttr("loading")
      .removeAttr("crossorigin")
      .removeAttr("integrity");

    // Remove comments
    $("*")
      .contents()
      .each(function (this: any) {
        if (this.type === "comment") {
          $(this).remove();
        }
      });

    // Remove empty elements (except for some structural elements)
    const keepElements = [
      "html",
      "body",
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "table",
      "tr",
      "td",
      "th",
    ];
    $("*").each(function (this: any) {
      const el = $(this);
      if (
        el.children().length === 0 &&
        !el.text().trim() &&
        !keepElements.includes(el.prop("tagName").toLowerCase())
      ) {
        el.remove();
      }
    });

    // Get the simplified HTML
    return $.html();
  } catch (error) {
    console.error("Error simplifying HTML:", error);
    return html; // Return original HTML if simplification fails
  }
}

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
    delayAfterLoad?: number;
    timeout?: number;
    headers?: Record<string, string>;
    proxyUrl?: string;
    debug?: boolean;
    selectors?: string[];
    selectorMode?: "first" | "all";
    simpleHtml?: boolean;
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
      return options?.simpleHtml ? simplifyHtml(html) : html;
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

      const htmlContent = typeof html === "string" ? html : html.join("\n");
      return options?.simpleHtml ? simplifyHtml(htmlContent) : htmlContent;
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

        return options?.simpleHtml ? simplifyHtml(html) : html;
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

        return options?.simpleHtml ? simplifyHtml(html) : html;
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

      return options?.simpleHtml ? simplifyHtml(response.data.html) : response.data.html;
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
