import { wait } from "@/lib/utils/wait";

import { browserPool } from "./browser-pool";

interface RenderOptions {
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  type?: "png" | "jpeg";
  quality?: number;
  /** Delay in milliseconds after page load before taking screenshot */
  delayAfterLoad?: number;
  /** Navigation/render timeout in milliseconds (default: 30s) */
  timeout?: number;
}

/**
 * Render a raw HTML string to a screenshot buffer using Playwright.
 * Uses `page.setContent()` — no URL or temp file needed.
 */
export async function renderHtmlToScreenshot(
  html: string,
  options: RenderOptions = {}
): Promise<Buffer> {
  const browser = await browserPool.getBrowser("chromium");
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1400, height: 800 },
  });

  const page = await context.newPage();
  try {
    page.setDefaultTimeout(options.timeout ?? 30_000);

    await page.setContent(html, { waitUntil: "load" });

    if (options.delayAfterLoad) await wait(options.delayAfterLoad);

    const buffer = await page.screenshot({
      fullPage: options.fullPage,
      type: options.type ?? "png",
      quality: options.type === "jpeg" ? (options.quality ?? 80) : undefined,
    });

    return buffer;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

/**
 * Render a locally-served HTML page to a screenshot buffer using Playwright.
 * The directory must already be served via Express static middleware.
 */
export async function renderServedHtmlToScreenshot(
  serveUrl: string,
  options: RenderOptions = {}
): Promise<Buffer> {
  const browser = await browserPool.getBrowser("chromium");
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1400, height: 800 },
  });

  const page = await context.newPage();
  try {
    page.setDefaultTimeout(options.timeout ?? 30_000);

    await page.goto(serveUrl, { waitUntil: "load" });

    if (options.delayAfterLoad) await wait(options.delayAfterLoad);

    const buffer = await page.screenshot({
      fullPage: options.fullPage,
      type: options.type ?? "png",
      quality: options.type === "jpeg" ? (options.quality ?? 80) : undefined,
    });

    return buffer;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}
