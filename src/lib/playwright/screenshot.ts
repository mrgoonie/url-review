import { wait } from "@/lib/utils/wait";

import { type PlaywightProxy } from "../proxy";
import { browserPool } from "./browser-pool";

interface ScreenshotOptions {
  fullPage?: boolean;
  type?: "png" | "jpeg";
  quality?: number;
  path?: string;
  size?: {
    width: number;
    height: number;
  };
  clip?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  proxy?: PlaywightProxy;
  delayAfterLoad?: number;
  timeout?: number;
  debug?: boolean;
}

export async function screenshot(url: string, options: ScreenshotOptions = {}) {
  console.log("screenshot.ts > screenshot() > Take screenshot :>>", url);

  async function attemptScreenshot(
    browserType: "firefox" | "chromium",
    useProxy = false
  ): Promise<Buffer> {
    console.log(
      `screenshot.ts > attemptScreenshot() > Attempting with ${browserType}${
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
      viewport: options.size
        ? { width: options.size.width, height: options.size.height }
        : { width: 1400, height: 948 },
    });

    try {
      const page = await context.newPage();
      page.setDefaultTimeout(options.timeout ?? 60_000);
      page.setDefaultNavigationTimeout(options.timeout ?? 60_000);

      await page.goto(url, { waitUntil: "domcontentloaded" });
      console.log(`screenshot.ts > attemptScreenshot() > Page loaded`);

      // wait for 3s and take screenshot
      if (options.delayAfterLoad) await wait(options.delayAfterLoad);

      // hide cookie consent, google login popup, facebook-login popup, etc
      await page.evaluate(() => {
        try {
          const ids = ["cookie-consent", "credential_picker_container", "CybotCookiebotDialog"];
          ids.forEach((id) => {
            const element = document.querySelector(`#${id}`);
            if (element) element.setAttribute("style", "opacity: 0 !important;");
          });

          const classes = ["__fb-light-mode"];
          classes.forEach((cls) => {
            const elements = document.querySelectorAll(`div.${cls}`);
            elements.forEach((element) => {
              element.setAttribute("style", "opacity: 0 !important;");
            });
          });
        } catch (error) {
          console.error(error);
        }
      });

      const screenshotBuffer = await page.screenshot({
        fullPage: options.fullPage,
        type: options.type,
        quality: options.quality,
        path: options.path,
        clip: options.clip
          ? {
              x: options.clip.x ?? 0,
              y: options.clip.y ?? 0,
              width: options.clip.width ?? 0,
              height: options.clip.height ?? 0,
            }
          : undefined,
      });

      if (options.debug) {
        console.log(
          "screenshot.ts > attemptScreenshot() > Screenshot buffer :>>",
          screenshotBuffer
        );
        console.log(`screenshot.ts > attemptScreenshot() > Screenshot taken successfully`);
      }

      await page.close();
      await context.close();

      /**
       * NOTE: Do not close browser, keep it in pool
       */
      // await browser.close();

      return screenshotBuffer;
    } catch (error: any) {
      // await browser.close();
      await context.close();
      console.error(`screenshot.ts > attemptScreenshot() > Error with ${browserType} :>>`, error);
      throw error;
    }
  }

  // Validate proxy if provided
  // if (options.proxy) {
  //   const isProxyValid = await testProxyConnection(
  //     options.proxy.server,
  //     options.proxy.username,
  //     options.proxy.password
  //   );
  //   console.log("screenshot.ts > screenshot() > isProxyValid :>>", isProxyValid);
  //   if (!isProxyValid) {
  //     console.log("screenshot.ts > screenshot() > Proxy invalid, will attempt without proxy first");
  //   }
  // }

  try {
    // Try Firefox without proxy first
    console.log("screenshot.ts > screenshot() > Attempting Firefox without proxy");
    return await attemptScreenshot("firefox", false);
  } catch (error) {
    console.log(
      "screenshot.ts > screenshot() > Firefox without proxy failed, trying Firefox with proxy"
    );
    await wait(2000);

    try {
      // Try Firefox with proxy
      return await attemptScreenshot("firefox", true);
    } catch (error) {
      console.log(
        "screenshot.ts > screenshot() > Firefox with proxy failed, trying Chromium with proxy"
      );
      await wait(2000);

      try {
        // Try Chromium with proxy
        return await attemptScreenshot("chromium", true);
      } catch (error) {
        console.log(
          "screenshot.ts > screenshot() > Chromium with proxy failed, trying Chromium without proxy"
        );
        await wait(2000);

        try {
          // Last attempt: Chromium without proxy
          return await attemptScreenshot("chromium", false);
        } catch (error) {
          console.error("screenshot.ts > screenshot() > All attempts failed");
          throw new Error("Failed to take screenshot after trying all combinations");
        }
      }
    }
  }
}
