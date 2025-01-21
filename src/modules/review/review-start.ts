import { ReviewStatus } from "@prisma/client";
import dayjs from "dayjs";
import { z } from "zod";

import { IsDev } from "@/config";
import { TextModelSchema, VisionModelSchema } from "@/lib/ai";
import { analyzeImageBase64 } from "@/lib/ai/analyze-image";
import { analyzeUrl } from "@/lib/ai/analyze-url";
import { getAllImages } from "@/lib/playwright/get-images";
import { imageUrlToBase64 } from "@/lib/utils";
import { scrapeMetadata } from "@/modules/metadata/metadata-scrape";

import { extractAllLinksFromUrl } from "../scrape";
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
    const links = (
      validatedOptions?.skipLinkExtraction
        ? []
        : await extractAllLinksFromUrl(validatedInput.url, {
            maxLinks: validatedOptions?.maxExtractedLinks || 50,
          })
    ).map(({ link }) => link);

    // 4. Scrape metadata
    const metadata = await scrapeMetadata(validatedInput.url);

    // 6. Run AI analysis on HTML content
    const htmlAnalysis = await analyzeUrl(
      {
        systemPrompt: `Analyze the website content for safety, quality, and potential improvements.`,
        instructions: validatedInput.instructions || "",
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
        screenshot: {
          ...screenshotAnalysis.screenshot,
          data: screenshotAnalysis.data,
          usage: screenshotAnalysis.usage,
          model: screenshotAnalysis.model,
        },
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
