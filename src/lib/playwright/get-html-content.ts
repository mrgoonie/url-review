import { env } from "@/env";
import { wait } from "@/lib/utils/wait";

import { type PlaywightProxy, proxyUrlToPlaywightProxy } from "../proxy";
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

export const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36 Edg/93.0.961.52",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:96.0) Gecko/20100101 Firefox/96.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 Edg/96.0.1054.29",
  "Mozilla/5.0 (iPad; CPU OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/96.0.4664.53 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 OPR/81.0.4196.31",
  "Mozilla/5.0 (Android 12; Mobile; rv:95.0) Gecko/95.0 Firefox/95.0",
  "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
  "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0",
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 Edg/94.0.992.47",
  "Mozilla/5.0 (X11; Linux x86_64; rv:96.0) Gecko/20100101 Firefox/96.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62",
  "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36",
];
export const randomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

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

    if (useProxy && !options.proxy && env.PROXY_URL) {
      options.proxy = proxyUrlToPlaywightProxy(env.PROXY_URL);
      console.log("get-html.ts > attemptGetHtmlContent() > Using proxy :>>", options.proxy);
    }

    const browser = await browserPool.getBrowser(browserType);

    const context = await browser.newContext({
      extraHTTPHeaders: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        TE: "Trailers",
      },
      proxy:
        useProxy && options.proxy
          ? {
              ...options.proxy,
              // bypass: "http://localhost:3000"
            }
          : undefined,
      userAgent: randomUserAgent(),
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

      // Check for Cloudflare Bot Shield
      if (htmlContent.indexOf("cloudflare.com/5xx-error-landing") !== -1) {
        throw new Error("Failed to retrieve HTML content due to Cloudflare Bot Shield");
      }

      console.log(`get-html.ts > attemptGetHtmlContent() > HTML content retrieved successfully`);
      // console.log(`get-html.ts > attemptGetHtmlContent() > HTML content :>>`, htmlContent);
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
