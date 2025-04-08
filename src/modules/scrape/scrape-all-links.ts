import * as cheerio from "cheerio";
import { z } from "zod";

import { getHtmlContent } from "@/lib/playwright";
import { getHtmlWithAxios } from "@/lib/scrape";

import { getHttpStatusCodeAll } from "./check-links-http-status";
import { assetExtensions } from "./scrape-schemas";

export const ExtractAllLinksFromUrlOptionsSchema = z
  .object({
    type: z.enum(["web", "external", "internal", "image", "file", "all"]).default("all").optional(),
    maxLinks: z.number().default(500).optional(),
    autoScrapeInternalLinks: z.boolean().default(false).optional(),
    getStatusCode: z.boolean().default(false).optional(),
    delayAfterLoad: z
      .number()
      .min(0)
      .max(10 * 60_000) // 10 minutes
      .default(5000) // 5 seconds
      .optional(),
    debug: z.boolean().default(false).optional(),
    processedUrls: z.instanceof(Set<string>).optional(), // Track processed URLs for recursion
  })
  .strict();
export type ExtractAllLinksFromUrlOptions = z.infer<typeof ExtractAllLinksFromUrlOptionsSchema>;

// Robust link extraction with multiple strategies and filtering options
export async function extractAllLinksFromUrl(
  url: string,
  options?: ExtractAllLinksFromUrlOptions
): Promise<{ link: string; statusCode?: number | null }[]> {
  try {
    // Initialize processedUrls set if not provided (for the initial call)
    const processedUrls = options?.processedUrls || new Set<string>();

    // If this URL has already been processed in this chain, stop.
    if (processedUrls.has(url)) {
      console.log(`Skipping already processed URL: ${url}`);
      return [];
    }

    // Add current URL to the processed set
    processedUrls.add(url);

    // Parse options *after* handling processedUrls initialization
    const parsedOptions = ExtractAllLinksFromUrlOptionsSchema.parse({ ...options, processedUrls });

    let htmlContent: string | string[] | undefined;
    try {
      htmlContent = await getHtmlContent(url, {
        delayAfterLoad: parsedOptions.delayAfterLoad,
        debug: parsedOptions.debug,
      });
    } catch (error) {
      console.error("Error fetching HTML content with Playwright:", error);
      console.log("Falling back to get HTML content with Axios");

      // use get HTML content with Axios
      try {
        htmlContent = await getHtmlWithAxios(url);
      } catch (error) {
        console.error("Error fetching HTML content with Axios:", error);
        return [];
      }
    }
    const content = Array.isArray(htmlContent) ? htmlContent.join("\n") : htmlContent;

    // Load HTML content into cheerio
    const $ = cheerio.load(content);

    const extractedLinks = new Set<string>();

    // Extract links using cheerio
    $("a").each((_, element) => {
      const href = $(element).attr("href");

      if (href) {
        let cleanedUrl = href.trim();

        // Skip empty URLs, javascript: links, mailto: links, and anchors
        if (
          !cleanedUrl ||
          cleanedUrl.startsWith("javascript:") ||
          cleanedUrl.startsWith("mailto:") ||
          cleanedUrl.startsWith("#") // Skip fragment identifiers
        ) {
          return;
        }

        // Handle relative URLs
        try {
          const absoluteUrl = new URL(cleanedUrl, url).href;
          cleanedUrl = absoluteUrl;
        } catch (error) {
          // Handle invalid URLs gracefully, maybe log them
          console.debug(
            `Failed to process relative URL or invalid URL: ${cleanedUrl}, ` + `Base URL: ${url}`
          );
          return; // Skip invalid URLs
        }

        try {
          const parsedUrl = new URL(cleanedUrl);
          // Remove trailing slash for consistency, unless it's just the domain
          let normalizedUrl = parsedUrl.toString();
          if (normalizedUrl.endsWith("/") && parsedUrl.pathname !== "/") {
            normalizedUrl = normalizedUrl.slice(0, -1);
          }
          extractedLinks.add(normalizedUrl);
        } catch {
          // This catch block might be redundant now due to the earlier try-catch
          // but kept for safety, e.g., if URL constructor throws for other reasons
          console.debug(`Invalid URL found after normalization attempt: ${cleanedUrl}`);
        }
      }
    });

    // Filter links based on type option
    let filteredLinks = Array.from(extractedLinks)
      .filter((link) => {
        const type = parsedOptions.type || "all";

        // Early exit for 'all' type
        if (type === "all") return true;

        // Determine if the link is internal or external relative to the base URL
        let isInternalLink = false;
        let isExternalLink = false;
        try {
          const baseUrl = new URL(url); // Base URL from the function input
          const currentLinkUrl = new URL(link);
          if (currentLinkUrl.origin === baseUrl.origin) {
            isInternalLink = true;
          } else {
            isExternalLink = true;
          }
        } catch (e) {
          // If URL parsing fails, treat as neither internal nor external for filtering
          console.debug(`Could not parse link for internal/external check: ${link}`);
          return false;
        }

        // Filter based on type
        if (type === "internal") return isInternalLink;
        if (type === "external") return isExternalLink;

        // --- Existing logic for web, image, file types ---
        const fileExtensions = {
          web: [".html", ".htm", ".php", ".asp", ".aspx"],
          // Note: internal/external keys are kept for structure but filtering is handled above
          external: [".html", ".htm", ".php", ".asp", ".aspx"],
          internal: [".html", ".htm", ".php", ".asp", ".aspx"],
          image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff"],
          file: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv", ".zip", ".rar"],
        } as const; // Use 'as const' for stricter typing

        // Check if the link has one of the specified extensions for the type
        // Or, if type is 'web', also include links without extensions (common for web pages)
        const hasMatchingExtension = fileExtensions[type as keyof typeof fileExtensions]?.some(
          (ext) => link.toLowerCase().includes(ext) // Use includes for flexibility (e.g., ignore query params)
        );

        // Check if it's likely a web page (no common file extension)
        const isLikelyWebPage =
          // Note: flat() requires ES2019 target in tsconfig
          !Object.values(fileExtensions)
            .flat()
            .some((ext) => link.toLowerCase().includes(ext));

        // Final check for web, image, file types
        if (type === "web") {
          return hasMatchingExtension || isLikelyWebPage;
        } else if (type === "image" || type === "file") {
          // For image/file, only check extensions, not isLikelyWebPage
          return hasMatchingExtension;
        }

        // Fallback: should not be reached if type is valid
        return false;
      })
      .slice(0, parsedOptions.maxLinks);

    // Detect internal links
    let internalLinks = filteredLinks.filter((link) => {
      const baseUrl = new URL(url);
      const linkUrl = new URL(link, baseUrl.href);

      // Check if it's an internal link
      const isInternal = linkUrl.origin === baseUrl.origin;

      // Check if it's not an asset file
      const isAsset = assetExtensions.some((ext) => linkUrl.pathname.toLowerCase().endsWith(ext));

      return isInternal && !isAsset;
    });

    // Process internal links in batches if autoScrapeInternalLinks is enabled
    if (parsedOptions.autoScrapeInternalLinks) {
      const batchSize = 10;
      let allScrapedInternalLinks: { link: string; statusCode?: number | null }[] = [];

      console.log(`Found ${internalLinks.length} internal links to potentially scrape.`);

      for (let i = 0; i < internalLinks.length; i += batchSize) {
        const batch = internalLinks.slice(i, i + batchSize);
        console.log(
          `Scraping batch ${i / batchSize + 1} of internal links (size: ${batch.length})...`
        );

        const batchResults = await Promise.all(
          batch.map((link) =>
            extractAllLinksFromUrl(link, {
              ...parsedOptions, // Pass down all options including type, maxLinks etc.
              getStatusCode: false, // No need for status codes in recursive calls
              processedUrls: processedUrls, // Pass the *same* set down
              // No longer forcing autoScrapeInternalLinks to false here
            })
          )
        );

        allScrapedInternalLinks = allScrapedInternalLinks.concat(batchResults.flat());
      }

      // Add the newly scraped links (avoiding duplicates just in case)
      const uniqueNewLinks = allScrapedInternalLinks
        .map((result) => result.link)
        .filter((link) => !filteredLinks.includes(link));

      filteredLinks.push(...uniqueNewLinks);
      console.log(`Added ${uniqueNewLinks.length} new unique links from internal scraping.`);
    }

    // Remove duplicates
    filteredLinks = Array.from(new Set(filteredLinks));

    // Get status codes if requested
    if (parsedOptions.getStatusCode) {
      const statusCodes = await getHttpStatusCodeAll(filteredLinks);
      return filteredLinks.map((link, index) => ({
        link,
        statusCode: statusCodes?.[index] || null,
      }));
    }

    console.log(`✅ Extracted ${filteredLinks.length} links from ${url}`);
    return filteredLinks.map((link) => ({ link }));
  } catch (error) {
    console.error("Error extracting links:", error);
    return [];
  }
}
