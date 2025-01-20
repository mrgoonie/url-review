import { getHtmlContent } from "@/lib/playwright";

import type { ScrapeWebUrlOptions } from "./scrape-schemas";

export async function scrapeWebUrl(url: string, options?: ScrapeWebUrlOptions) {
  const htmlContent = await getHtmlContent(url, {
    delayAfterLoad: options?.delayAfterLoad ?? 3000,
  });
  return htmlContent;
}
