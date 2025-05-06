import { z } from "zod";

import { TextModelSchema } from "@/lib/ai";

/**
 * Options for summarizing a URL
 */
export const SummarizeWebUrlOptionsSchema = z.object({
  /**
   * Custom system prompt for the AI
   */
  systemPrompt: z.string().optional(),

  /**
   * Instructions for the AI on how to summarize the content
   */
  instructions: z.string().optional(),

  /**
   * AI model to use for summarization
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
   * Maximum number of links to process when summarizing multiple URLs
   * @default 20
   */
  maxLinks: z.number().min(1).max(100).optional(),

  /**
   * Maximum length of the summary in words
   * @default 500
   */
  maxLength: z.number().min(50).max(2000).optional(),

  /**
   * Summary format (bullet points or paragraph)
   * @default "paragraph"
   */
  format: z.enum(["bullet", "paragraph"]).optional(),
});

export type SummarizeWebUrlOptions = z.infer<typeof SummarizeWebUrlOptionsSchema>;
