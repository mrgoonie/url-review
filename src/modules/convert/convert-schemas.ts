import { z } from "zod";

import { TextModelSchema } from "@/lib/ai";

/**
 * Options for converting a URL to Markdown
 */
export const ConvertWebUrlOptionsSchema = z.object({
  /**
   * AI model to use for conversion
   * @default "google/gemini-2.5-flash-preview"
   */
  model: TextModelSchema.optional(),

  /**
   * Delay after page load in milliseconds
   * @default 3000
   */
  delayAfterLoad: z.number().min(0).max(10000).optional(),

  /**
   * Enable debug mode
   * @default false
   */
  debug: z.boolean().optional(),

  /**
   * Maximum number of links to process when converting multiple URLs
   * @default 20
   */
  maxLinks: z.number().min(1).max(100).optional(),
});

export type ConvertWebUrlOptions = z.infer<typeof ConvertWebUrlOptionsSchema>;
