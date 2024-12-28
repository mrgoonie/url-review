import { ReviewStatus } from "@prisma/client";
import dayjs from "dayjs";
import { z } from "zod";

import { IsDev } from "@/config";
import { TextModelSchema, VisionModelSchema } from "@/lib/ai";
import { analyzeImageBase64 } from "@/lib/ai/analyze-image";
import { analyzeUrl } from "@/lib/ai/analyze-url";
import { getHtmlContent } from "@/lib/playwright/get-html";
import { getAllImages } from "@/lib/playwright/get-images";
import { imageUrlToBase64 } from "@/lib/utils";
import { scrapeMetadata } from "@/modules/metadata/metadata-scrape";

import type { ReviewCreateData } from "./review-crud";
import { createReview, updateReview } from "./review-crud";
import { reviewUrlByCaptureWebUrl } from "./review-url-by-screenshot";

export const ReviewStartOptionsSchema = z
  .object({
    debug: z.boolean().default(false).optional().describe("Print debug logs"),

    // Image extraction options
    skipImageExtraction: z.boolean().default(true).optional(),
    maxExtractedImages: z.number().min(1).max(100).default(50).optional(),

    // Link extraction options
    skipLinkExtraction: z.boolean().default(true).optional(),
    maxExtractedLinks: z.number().min(1).max(100).default(50).optional(),

    // AI model selection
    textModel: TextModelSchema.optional().describe("Optional text model for analysis"),
    visionModel: VisionModelSchema.optional().describe(
      "Optional vision model for image/screenshot analysis"
    ),

    // Additional configuration options
    delayAfterLoad: z
      .number()
      .min(0)
      .max(60_000)
      .default(3000)
      .optional()
      .describe("Delay after page load for extraction (ms)"),
    excludeImageSelectors: z
      .array(z.string())
      .optional()
      .describe("CSS selectors to exclude from image extraction"),

    // Error handling
    continueOnImageAnalysisError: z
      .boolean()
      .default(true)
      .optional()
      .describe("Continue review if image analysis fails"),
    continueOnLinkAnalysisError: z
      .boolean()
      .default(true)
      .optional()
      .describe("Continue review if link analysis fails"),
  })
  .optional();

export type ReviewStartOptions = z.infer<typeof ReviewStartOptionsSchema>;

export async function startReview(input: ReviewCreateData, options?: ReviewStartOptions) {
  // Validate input using Zod
  const ReviewCreateDataSchema = z.object({
    url: z.string().url("Invalid URL"),
    userId: z.string(),
    instructions: z.string().optional(),
    projectId: z.string().optional(),
  });

  // Validate input data
  const validatedInput = ReviewCreateDataSchema.parse(input);

  // Validate options if provided
  let validatedOptions = options ? ReviewStartOptionsSchema.parse(options) : undefined;

  // Assign default options if not provided
  if (!validatedOptions) validatedOptions = {};
  if (typeof validatedOptions.debug === "undefined") validatedOptions.debug = IsDev();
  if (typeof validatedOptions.skipImageExtraction === "undefined")
    validatedOptions.skipImageExtraction = true;
  if (typeof validatedOptions.skipLinkExtraction === "undefined")
    validatedOptions.skipLinkExtraction = true;
  if (!validatedOptions.maxExtractedImages) validatedOptions.maxExtractedImages = 50;
  if (!validatedOptions.maxExtractedLinks) validatedOptions.maxExtractedLinks = 50;

  // Log start time
  const startTime = dayjs();
  if (validatedOptions.debug)
    console.log(`review-start.ts > startReview() > Start Time :>>`, startTime.format());

  const review = await createReview(validatedInput);

  try {
    // 2. Get images (max 50 or configured)
    const imageUrls = validatedOptions?.skipImageExtraction
      ? []
      : await getAllImages(validatedInput.url, {
          delayAfterLoad: validatedOptions?.delayAfterLoad || 3000,
          excludeSelectors: validatedOptions?.excludeImageSelectors || [
            "svg",
            'img[alt=""]',
            'img[src^="data:image/svg"]',
          ],
        });
    const limitedImageUrls = imageUrls.slice(0, validatedOptions?.maxExtractedImages || 50);

    // 3. Get links (max 50 or configured)
    const links = validatedOptions?.skipLinkExtraction
      ? []
      : await extractLinks(validatedInput.url, {
          maxLinks: validatedOptions?.maxExtractedLinks || 50,
        });

    // 4. Scrape metadata
    const metadata = await scrapeMetadata(validatedInput.url);

    // 6. Run AI analysis on HTML content
    const htmlAnalysis = await analyzeUrl(
      {
        systemPrompt: `Analyze the website content for safety, quality, and potential improvements. ${
          validatedInput.instructions || ""
        }`,
        url: validatedInput.url,
      },
      { model: validatedOptions?.textModel, debug: validatedOptions.debug }
    );

    // 7. Run AI analysis on screenshot
    const screenshotAnalysis = await reviewUrlByCaptureWebUrl(
      { url: validatedInput.url },
      { model: validatedOptions?.visionModel, debug: validatedOptions.debug }
    );

    // 8. Run AI analysis on images
    const imagesAnalysis = await Promise.all(
      limitedImageUrls.map(async (imageUrl) => {
        try {
          const base64 = await imageUrlToBase64(imageUrl);
          if (!base64) {
            console.warn(`No base64 found for image ${imageUrl}`);
            return null;
          }

          return await analyzeImageBase64(
            {
              base64,
              instructions: "Analyze the image for content, safety, and potential issues",
            },
            { model: validatedOptions?.visionModel || "google/gemini-flash-1.5-8b" }
          );
        } catch (error) {
          console.error(`Image analysis failed for ${imageUrl}:`, error);

          if (!validatedOptions?.continueOnImageAnalysisError) throw error;

          return null;
        }
      })
    );

    // 9. Run AI analysis on links
    const linksAnalysis = await Promise.all(
      links.map(async (link) => {
        try {
          const linkAnalysis = await analyzeUrl(
            {
              url: link,
              systemPrompt: `Analyze the linked webpage for content safety, relevance, and potential risks. ${
                validatedInput.instructions || ""
              }`,
              instructions:
                "Provide a comprehensive assessment of the webpage's content and potential issues",
            },
            { model: validatedOptions?.textModel }
          );

          return {
            url: link,
            status: "completed",
            analysis: linkAnalysis,
          };
        } catch (error) {
          console.error(`Link analysis failed for ${link}:`, error);

          if (!validatedOptions?.continueOnLinkAnalysisError) throw error;

          return {
            url: link,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // 10. Update & save review
    const updatedReview = await updateReview(review.id, {
      metadata,
      status: ReviewStatus.COMPLETED,
      aiAnalysis: {
        html: htmlAnalysis,
        screenshot: screenshotAnalysis.screenshot,
        images: imagesAnalysis.filter((analysis) => analysis !== null),
        links: linksAnalysis,
      },
    });

    // 11. Return review
    const endTime = dayjs();
    const duration = endTime.diff(startTime, "millisecond");
    if (validatedOptions.debug) {
      console.log(`review-start.ts > startReview() > End Time :>>`, endTime.format());
      console.log(`review-start.ts > startReview() > Duration (ms) :>>`, duration);
    }

    return updatedReview;
  } catch (error) {
    // Handle any errors during the review process
    const endTime = dayjs();
    const duration = endTime.diff(startTime, "millisecond");
    console.error("review-start.ts > startReview() > error :>>", error);

    if (validatedOptions.debug) {
      console.log(`review-start.ts > startReview() > End Time :>>`, endTime.format());
      console.log(`review-start.ts > startReview() > Duration (ms) :>>`, duration);
    }

    // Update review with error status
    await updateReview(review.id, {
      status: ReviewStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
    });

    throw error;
  }
}

// Robust link extraction with multiple strategies and filtering options
async function extractLinks(
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

        // Validate URL and ensure it's not a relative path
        try {
          const parsedUrl = new URL(cleanedUrl, url);

          // Only add absolute URLs from the same domain or external domains
          if (parsedUrl.protocol.startsWith("http")) {
            extractedLinks.add(parsedUrl.toString());
          }
        } catch {
          // Ignore invalid URLs
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
