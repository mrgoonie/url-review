import { wait } from "@/lib/utils/wait";

import { type PlaywightProxy } from "../proxy";
import { browserPool } from "./browser-pool";

interface HtmlContentOptions {
  proxy?: PlaywightProxy;
  delayAfterLoad?: number;
  debug?: boolean;
  timeout?: number;
  /** CSS selectors to extract specific elements instead of full HTML */
  selectors?: string[];
  /** Whether to return the first matching element or all matching elements */
  selectorMode?: "first" | "all";
}

/**
 * Get HTML content from a URL using Playwright.
 * @param url - The URL to fetch HTML content from.
 * @param options - Options for the HTML content retrieval.
 * @returns A promise that resolves to the HTML content.
 */
export async function getHtmlContent(url: string, options: HtmlContentOptions = {}) {
  console.log("get-html.ts > getHtmlContent() > Fetching HTML content :>>", url);

  async function attemptGetHtmlContent(
    browserType: "firefox" | "chromium",
    useProxy = false
  ): Promise<string | string[]> {
    console.log(
      `get-html.ts > attemptGetHtmlContent() > Attempting with ${browserType}${
        useProxy ? " (with proxy)" : " (no proxy)"
      }`
    );

    const browser = await browserPool.getBrowser(browserType);

    const context = await browser.newContext({
      proxy:
        useProxy && options.proxy
          ? { ...options.proxy, bypass: "http://localhost:3000" }
          : undefined,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      viewport: { width: 1400, height: 948 },
    });

    try {
      const page = await context.newPage();
      page.setDefaultTimeout(options.timeout || 60_000);
      page.setDefaultNavigationTimeout(options.timeout || 60_000);

      await page.goto(url, { waitUntil: "domcontentloaded" });
      console.log(`get-html.ts > attemptGetHtmlContent() > Page loaded`);

      // Optional delay after page load
      if (options.delayAfterLoad) await wait(options.delayAfterLoad);
      console.log(`get-html.ts > attemptGetHtmlContent() > HTML content extraction started`);

      // Remove potentially intrusive elements
      await page.evaluate(() => {
        try {
          const ids = ["cookie-consent", "credential_picker_container", "CybotCookiebotDialog"];
          ids.forEach((id) => {
            const element = document.querySelector(`#${id}`);
            if (element) element.remove();
          });

          const classes = ["__fb-light-mode"];
          classes.forEach((cls) => {
            const elements = document.querySelectorAll(`div.${cls}`);
            elements.forEach((element) => element.remove());
          });
        } catch (error) {
          console.error(error);
        }
      });

      // Get HTML content based on selectors or full page
      let htmlContent: string | string[];
      if (options.selectors && options.selectors.length > 0) {
        htmlContent = await page.evaluate(
          (params) => {
            const { selectors, mode } = params;
            const results = selectors
              .map((selector) => {
                const elements =
                  mode === "first"
                    ? [document.querySelector(selector)].filter(Boolean)
                    : Array.from(document.querySelectorAll(selector));
                return elements.map((el) => el?.outerHTML).filter((html) => html) as string[];
              })
              .flat();
            return results;
          },
          { selectors: options.selectors, mode: options.selectorMode || "first" }
        );
      } else {
        htmlContent = await page.content();
      }

      console.log(`get-html.ts > attemptGetHtmlContent() > HTML content retrieved successfully`);
      await page.close();
      await context.close();

      return htmlContent;
    } catch (error: any) {
      await context.close();
      console.error(`get-html.ts > attemptGetHtmlContent() > Error with ${browserType}:>>`, error);
      throw error;
    }
  }

  try {
    // Try Firefox without proxy first
    console.log("get-html.ts > getHtmlContent() > Attempting Firefox without proxy");
    return await attemptGetHtmlContent("firefox", false);
  } catch (error) {
    console.log(
      "get-html.ts > getHtmlContent() > Firefox without proxy failed, trying Firefox with proxy"
    );
    await wait(2000);

    try {
      // Try Firefox with proxy
      return await attemptGetHtmlContent("firefox", true);
    } catch (error) {
      console.log(
        "get-html.ts > getHtmlContent() > Firefox with proxy failed, trying Chromium with proxy"
      );
      await wait(2000);

      try {
        // Try Chromium with proxy
        return await attemptGetHtmlContent("chromium", true);
      } catch (error) {
        console.log(
          "get-html.ts > getHtmlContent() > Chromium with proxy failed, trying Chromium without proxy"
        );
        await wait(2000);

        try {
          // Last attempt: Chromium without proxy
          return await attemptGetHtmlContent("chromium", false);
        } catch (error) {
          console.error("get-html.ts > getHtmlContent() > All attempts failed");
          throw new Error("Failed to retrieve HTML content after trying all combinations");
        }
      }
    }
  }
}
