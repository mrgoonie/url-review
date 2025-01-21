import { getHtmlContent } from "@/lib/playwright";

// Robust link extraction with multiple strategies and filtering options
export async function extractAllLinksFromUrl(
  url: string,
  options?: {
    type?: "web" | "image" | "file" | "all";
    maxLinks?: number;
  }
): Promise<string[]> {
  try {
    const htmlContent = await getHtmlContent(url, { delayAfterLoad: 3000 });
    const content = Array.isArray(htmlContent) ? htmlContent.join("\n") : htmlContent;

    // More comprehensive link extraction strategies
    const linkRegexes = [
      // Standard http/https URLs
      /https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+/g,

      // URLs with additional characters like parentheses or brackets
      /https?:\/\/[^\s'"<>()[\]{}]+/g,

      // Capture links within href attributes
      /href=["']([^"']+)["']/g,

      // Capture links within src attributes
      /src=["']([^"']+)["']/g,
    ];

    const extractedLinks = new Set<string>();

    // Apply multiple regex strategies
    linkRegexes.forEach((regex) => {
      const matches = content.match(regex) || [];
      matches.forEach((match) => {
        // Clean and validate URLs
        const cleanedUrl = match
          .replace(/^href=["']|["']$/g, "") // Remove href/src attribute wrappers
          .replace(/^src=["']|["']$/g, "")
          .trim();

        // Try to convert relative URLs to absolute using the base URL
        try {
          const parsedUrl = new URL(cleanedUrl, url);

          // Add all valid URLs, including relative ones that were converted
          extractedLinks.add(parsedUrl.toString());
        } catch {
          // Skip invalid URLs that can't be parsed
          console.debug(`Invalid URL found: ${cleanedUrl}`);
        }
      });
    });

    // Filter links based on type option
    const filteredLinks = Array.from(extractedLinks)
      .filter((link) => {
        // Default to all if no type specified
        const type = options?.type || "all";
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
      .slice(0, options?.maxLinks || 50);

    return filteredLinks;
  } catch (error) {
    console.error(
      `review-start.ts > extractLinks() > Failed to extract links from ${url} :>>`,
      error
    );
    return [];
  }
}
