import { z } from "zod";

import { getHtmlContent } from "@/lib/playwright";

import { getHttpStatusCodeAll } from "./check-links-http-status";
import { assetExtensions } from "./scrape-schemas";

export const ExtractAllLinksFromUrlOptionsSchema = z
  .object({
    type: z.enum(["web", "image", "file", "all"]).default("all").optional(),
    maxLinks: z.number().default(500).optional(),
    autoScrapeInternalLinks: z.boolean().default(false).optional(),
    getStatusCode: z.boolean().default(false).optional(),
    delayAfterLoad: z
      .number()
      .min(0)
      .max(10 * 60_000) // 10 minutes
      .default(5000) // 5 seconds
      .optional(),
  })
  .strict();
export type ExtractAllLinksFromUrlOptions = z.infer<typeof ExtractAllLinksFromUrlOptionsSchema>;

// Robust link extraction with multiple strategies and filtering options
export async function extractAllLinksFromUrl(
  url: string,
  options?: ExtractAllLinksFromUrlOptions
): Promise<{ link: string; statusCode?: number | null }[]> {
  try {
    const parsedOptions = ExtractAllLinksFromUrlOptionsSchema.parse(options || {});

    const htmlContent = await getHtmlContent(url, {
      delayAfterLoad: parsedOptions.delayAfterLoad,
    });
    const content = Array.isArray(htmlContent) ? htmlContent.join("\n") : htmlContent;

    // More comprehensive link extraction strategies
    const linkRegexes = [
      // Standard http/https URLs
      /https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+/g,

      // URLs with additional characters like parentheses or brackets
      /https?:\/\/[^\s'"<>()[\]{}]+/g,

      // Capture all <a> tag href attributes
      /<a[^>]+href=["']([^"']+)["'][^>]*>/g,

      // Capture links within href attributes (including relative URLs)
      /href=["']([^"']+)["']/g,

      // Capture links within src attributes (including relative URLs)
      /src=["']([^"']+)["']/g,

      // Relative URLs starting with / or ./
      /(?:href|src)=["'](\/[^"']+|\.\/[^"']+)["']/g,

      // Relative URLs without leading slash
      /(?:href|src)=["'](?!https?:\/\/)(?!\/)[^"'\s]+["']/g,

      // Specific pattern for internal navigation links
      /href=["']\/?(?:[\w-]+(?:\/[\w-]+)*)\/?["']/g,
    ];

    const extractedLinks = new Set<string>();

    // Apply multiple regex strategies
    linkRegexes.forEach((regex) => {
      const matches = content.match(regex) || [];
      matches.forEach((match) => {
        // Clean and validate URLs
        let cleanedUrl = match
          .replace(/<a[^>]+href=["']|href=["']|src=["']|["'][^>]*>|["']$/g, "") // Remove all HTML tag wrappers
          .trim();

        // Skip empty URLs, javascript: links, and mailto: links
        if (
          !cleanedUrl ||
          cleanedUrl.startsWith("javascript:") ||
          cleanedUrl.startsWith("mailto:") ||
          cleanedUrl === "#"
        ) {
          return;
        }

        // Handle relative URLs
        if (!cleanedUrl.startsWith("http")) {
          try {
            // Convert relative URLs to absolute using the base URL
            const baseUrl = new URL(url);

            // Handle different types of relative URLs
            if (cleanedUrl.startsWith("//")) {
              // Protocol-relative URLs
              cleanedUrl = `${baseUrl.protocol}${cleanedUrl}`;
            } else if (cleanedUrl.startsWith("/")) {
              // Root-relative URLs
              cleanedUrl = `${baseUrl.origin}${cleanedUrl}`;
            } else if (cleanedUrl.startsWith("./")) {
              // Current directory relative URLs
              cleanedUrl = new URL(cleanedUrl.slice(2), baseUrl.href).href;
            } else if (!cleanedUrl.startsWith("http")) {
              // Other relative URLs
              cleanedUrl = new URL(cleanedUrl, baseUrl.href).href;
            }
          } catch (error) {
            console.debug(`Failed to process relative URL: ${cleanedUrl}`);
            return;
          }
        }

        try {
          const parsedUrl = new URL(cleanedUrl);
          // Remove trailing slash for consistency
          let normalizedUrl = parsedUrl.toString();
          if (normalizedUrl.endsWith("/") && !parsedUrl.pathname.endsWith("//")) {
            normalizedUrl = normalizedUrl.slice(0, -1);
          }
          extractedLinks.add(normalizedUrl);
        } catch {
          console.debug(`Invalid URL found: ${cleanedUrl}`);
        }
      });
    });

    // Filter links based on type option
    const filteredLinks = Array.from(extractedLinks)
      .filter((link) => {
        // Default to all if no type specified
        const type = parsedOptions.type || "all";
        const fileExtensions = {
          web: [".html", ".htm", ".php", ".asp", ".aspx"],
          image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff"],
          file: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv", ".zip", ".rar"],
        };

        // Exclude common non-content links
        const isNonContentLink = link.includes("javascript:") || link.includes("mailto:");

        // Check link type
        if (type === "all") return !isNonContentLink;

        const hasMatchingExtension = fileExtensions[type].some((ext) =>
          link.toLowerCase().endsWith(ext)
        );

        return hasMatchingExtension && !isNonContentLink;
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

    if (parsedOptions.autoScrapeInternalLinks) {
      const scrapeResults = await Promise.all(
        internalLinks.map((link) =>
          extractAllLinksFromUrl(link, {
            ...parsedOptions,
            getStatusCode: false,
            autoScrapeInternalLinks: false,
          })
        )
      );
      const _links = scrapeResults.flat();
      filteredLinks.push(..._links.map((link) => link.link));
    }

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
    console.error(
      `review-start.ts > extractLinks() > Failed to extract links from ${url} :>>`,
      error
    );
    return [];
  }
}
