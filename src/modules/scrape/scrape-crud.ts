import { getHtmlWithFallbacks } from "@/lib/scrape/get-html-with-fallbacks";

import type { ScrapeWebUrlOptions } from "./scrape-schemas";

/**
 * Scrape a web URL and return its HTML content using multiple fallback methods
 * @param url - The URL to scrape
 * @param options - Scraping options
 * @returns HTML content of the URL
 */
export async function scrapeWebUrl(url: string, options?: ScrapeWebUrlOptions) {
  try {
    console.log(`scrape-crud.ts > scrapeWebUrl() > Scraping URL: ${url}`);

    const htmlContent = await getHtmlWithFallbacks(url, options);

    console.log(`scrape-crud.ts > scrapeWebUrl() > Successfully scraped URL: ${url}`);
    return htmlContent;
  } catch (error) {
    console.error(`scrape-crud.ts > scrapeWebUrl() > Error scraping URL: ${url}`, error);
    throw new Error(
      `Failed to scrape URL: ${url} - ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
