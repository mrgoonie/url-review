import { wait } from "@/lib/utils/wait";

import { type PlaywightProxy } from "../proxy";
import { browserPool } from "./browser-pool";

interface ImageExtractionOptions {
  proxy?: PlaywightProxy;
  delayAfterLoad?: number;
  debug?: boolean;
  timeout?: number;
  excludeSelectors?: string[];
}

export async function getAllImages(url: string, options: ImageExtractionOptions = {}) {
  console.log("get-images.ts > getAllImages() > Extracting images from :>>", url);

  async function attemptGetAllImages(
    browserType: "firefox" | "chromium",
    useProxy = false
  ): Promise<string[]> {
    console.log(
      `get-images.ts > attemptGetAllImages() > Attempting with ${browserType}${
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
      console.log(`get-images.ts > attemptGetAllImages() > Page loaded`);

      // Optional delay after page load
      if (options.delayAfterLoad) await wait(options.delayAfterLoad);

      // Remove potentially intrusive elements
      await page.evaluate((excludeSelectors = []) => {
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

          // Remove any additional excluded selectors
          excludeSelectors.forEach((selector) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element) => element.remove());
          });
        } catch (error) {
          console.error(error);
        }
      }, options.excludeSelectors || []);

      // Extract all image URLs
      const imageUrls = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images
          .map((img) => img.src)
          .filter((src) => src && (src.startsWith("http") || src.startsWith("data:image")));
      });

      console.log(`get-images.ts > attemptGetAllImages() > Found ${imageUrls.length} images`);
      await page.close();
      await context.close();

      return imageUrls;
    } catch (error: any) {
      await context.close();
      console.error(`get-images.ts > attemptGetAllImages() > Error with ${browserType}:>>`, error);
      throw error;
    }
  }

  try {
    // Try Firefox without proxy first
    console.log("get-images.ts > getAllImages() > Attempting Firefox without proxy");
    return await attemptGetAllImages("firefox", false);
  } catch (error) {
    console.log(
      "get-images.ts > getAllImages() > Firefox without proxy failed, trying Firefox with proxy"
    );
    await wait(2000);

    try {
      // Try Firefox with proxy
      return await attemptGetAllImages("firefox", true);
    } catch (error) {
      console.log(
        "get-images.ts > getAllImages() > Firefox with proxy failed, trying Chromium with proxy"
      );
      await wait(2000);

      try {
        // Try Chromium with proxy
        return await attemptGetAllImages("chromium", true);
      } catch (error) {
        console.log(
          "get-images.ts > getAllImages() > Chromium with proxy failed, trying Chromium without proxy"
        );
        await wait(2000);

        try {
          // Last attempt: Chromium without proxy
          return await attemptGetAllImages("chromium", false);
        } catch (error) {
          console.error("get-images.ts > getAllImages() > All attempts failed");
          throw new Error("Failed to retrieve images after trying all combinations");
        }
      }
    }
  }
}
