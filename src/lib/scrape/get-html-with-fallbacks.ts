/* eslint-disable no-unused-vars */
import * as cheerio from "cheerio";

import { env } from "@/env";
import { wait } from "@/lib/utils/wait";

import { getHtmlWithAxios } from "./get-html-with-axios";
import { getHtmlWithFirecrawl } from "./get-html-with-firecrawl";
import { getHtmlContent } from "./get-html-with-playwright";
import { getHtmlWithScrapedo } from "./get-html-with-scrapedo";
import { getHtmlWithScrapling } from "./get-html-with-scrapling";
import { getHtmlWithScrappey } from "./get-html-with-scrappey";
import { getFacebookHtml, isFacebookUrl } from "./get-facebook-content";
import { getTwitterHtml, isTwitterUrl } from "./get-twitter-content";
import { validateHtmlContent } from "./validate-html-content";

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

interface ScrapeOptions {
  delayBetweenRetries?: number;
  delayAfterLoad?: number;
  timeout?: number;
  headers?: Record<string, string>;
  proxyUrl?: string;
  debug?: boolean;
  selectors?: string[];
  selectorMode?: "first" | "all";
  simpleHtml?: boolean;
  /** Extra block patterns to check in addition to defaults */
  extraBlockPatterns?: RegExp[];
  /** Skip structure validation for partial HTML extraction */
  skipStructureCheck?: boolean;
}

interface ScrapeMethod {
  name: string;
  execute: (url: string, options: ScrapeOptions) => Promise<string>;
  isAvailable: () => boolean;
}

/**
 * Create list of scrape methods with availability check
 */
function createScrapeMethods(_options: ScrapeOptions): ScrapeMethod[] {
  return [
    // 1. axios - fastest, may fail with complex sites
    {
      name: "axios",
      isAvailable: () => true,
      execute: async (url: string, opts: ScrapeOptions) => {
        return getHtmlWithAxios(url, {
          timeout: opts.timeout,
          headers: opts.headers,
          proxyUrl: opts.proxyUrl,
        });
      },
    },
    // 2. playwright - more robust, slower
    {
      name: "playwright",
      isAvailable: () => true,
      execute: async (url: string, opts: ScrapeOptions) => {
        const html = await getHtmlContent(url, {
          delayAfterLoad: opts.delayAfterLoad,
          timeout: opts.timeout,
          selectors: opts.selectors,
          selectorMode: opts.selectorMode,
          debug: opts.debug,
        });
        return typeof html === "string" ? html : html.join("\n");
      },
    },
    // 3. scrapling - free stealth browser with anti-bot bypass
    {
      name: "scrapling",
      isAvailable: () => true,
      execute: async (url: string, opts: ScrapeOptions) => {
        return getHtmlWithScrapling(url, {
          timeout: opts.timeout,
          debug: opts.debug,
        });
      },
    },
    // 4. scrapedo - external service
    {
      name: "scrapedo",
      isAvailable: () => !!env.SCRAPE_DO_API_KEY,
      execute: async (url: string, opts: ScrapeOptions) => {
        return getHtmlWithScrapedo(url, {
          timeout: opts.timeout,
          headers: opts.headers,
          proxyUrl: opts.proxyUrl,
        });
      },
    },
    // 5. scrappey - external service
    {
      name: "scrappey",
      isAvailable: () => !!env.RAPID_API_KEY,
      execute: async (url: string, opts: ScrapeOptions) => {
        const result = await getHtmlWithScrappey(url, {
          timeout: opts.timeout,
          debug: opts.debug,
        });
        // scrappey may return object, ensure string
        return typeof result === "string" ? result : JSON.stringify(result);
      },
    },
    // 6. firecrawl - external service
    {
      name: "firecrawl",
      isAvailable: () => !!env.FIRECRAWL_API_KEY,
      execute: async (url: string, opts: ScrapeOptions) => {
        const response = await getHtmlWithFirecrawl(url, { debug: opts.debug });
        if (!response.success || !response.data.html) {
          throw new Error(response.error || "Firecrawl returned no HTML");
        }
        return response.data.html;
      },
    },
  ];
}

/**
 * Get HTML content of a URL using multiple methods with fallbacks
 * Tries all available methods until one succeeds with valid HTML
 *
 * Order of fallbacks:
 * 1. axios (fastest, but may fail with complex sites)
 * 2. playwright (more robust, but slower)
 * 3. scrapling (free stealth browser with anti-bot bypass)
 * 4. scrapedo (external service, requires API key)
 * 5. scrappey (external service, requires API key)
 * 6. firecrawl (external service, requires API key)
 */
export async function getHtmlWithFallbacks(url: string, options?: ScrapeOptions): Promise<string> {
  const debug = options?.debug ?? false;
  const opts: ScrapeOptions = {
    timeout: 30000,
    ...options,
  };

  // Special handling for Twitter/X URLs - use specialized Twitter fetcher first
  if (isTwitterUrl(url)) {
    if (debug) console.log(`get-html-with-fallbacks.ts > Detected Twitter URL, using specialized handler`);
    try {
      const html = await getTwitterHtml(url, { debug, includeReplies: true });
      if (debug) console.log(`get-html-with-fallbacks.ts > Successfully fetched Twitter content`);
      return opts.simpleHtml ? simplifyHtml(html) : html;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (debug) console.log(`get-html-with-fallbacks.ts > Twitter handler failed: ${errorMsg}, falling back to generic methods`);
      // Continue to generic fallback methods if Twitter-specific methods fail
    }
  }

  // Special handling for Facebook URLs - use specialized Facebook fetcher first
  if (isFacebookUrl(url)) {
    if (debug) console.log(`get-html-with-fallbacks.ts > Detected Facebook URL, using specialized handler`);
    try {
      const html = await getFacebookHtml(url, { debug });
      if (debug) console.log(`get-html-with-fallbacks.ts > Successfully fetched Facebook content`);
      return opts.simpleHtml ? simplifyHtml(html) : html;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (debug) console.log(`get-html-with-fallbacks.ts > Facebook handler failed: ${errorMsg}, falling back to generic methods`);
    }
  }

  const methods = createScrapeMethods(opts);
  const errors: Array<{ method: string; error: string }> = [];

  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    const stepNum = i + 1;

    // Check if method is available
    if (!method.isAvailable()) {
      if (debug) {
        console.log(
          `get-html-with-fallbacks.ts > STEP ${stepNum}: Skipping ${method.name} (not available)`
        );
      }
      continue;
    }

    try {
      if (debug) {
        console.log(
          `get-html-with-fallbacks.ts > STEP ${stepNum}: Trying ${method.name} for ${url}`
        );
      }

      const html = await method.execute(url, opts);

      // Validate HTML content
      const validation = validateHtmlContent(html, {
        extraBlockPatterns: opts.extraBlockPatterns,
        skipStructureCheck: opts.skipStructureCheck,
      });

      if (validation.isValid) {
        if (debug) {
          console.log(
            `get-html-with-fallbacks.ts > STEP ${stepNum}: Successfully fetched HTML with ${method.name}`
          );
        }
        return opts.simpleHtml ? simplifyHtml(html) : html;
      }

      // Invalid HTML - log reason and continue to next method
      const reason = validation.reason || "unknown";
      errors.push({ method: method.name, error: `Invalid HTML: ${reason}` });

      if (debug) {
        console.log(
          `get-html-with-fallbacks.ts > STEP ${stepNum}: ${method.name} returned invalid HTML (${reason}), trying next method...`
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ method: method.name, error: errorMsg });

      console.error(
        `get-html-with-fallbacks.ts > STEP ${stepNum}: ${method.name} failed: ${errorMsg}`
      );
    }

    // Wait before trying next method (if configured)
    if (opts.delayBetweenRetries && i < methods.length - 1) {
      await wait(opts.delayBetweenRetries);
    }
  }

  // All methods failed - throw aggregate error with details
  const methodsTried = errors.map((e) => `${e.method}: ${e.error}`).join("; ");
  throw new Error(
    `Failed to fetch HTML content for ${url} after trying all available methods. Errors: ${methodsTried}`
  );
}
