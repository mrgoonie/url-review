import { z } from "zod";

import { TextModelSchema } from "@/lib/ai";

// scrape
export const ScrapeWebUrlOptionsSchema = z
  .object({
    delayAfterLoad: z.number().optional(),
  })
  .optional();

export type ScrapeWebUrlOptions = z.infer<typeof ScrapeWebUrlOptionsSchema>;

export const ScrapeWebUrlSchema = z.object({
  url: z.string().url(),
});

export type ScrapeWebUrl = z.infer<typeof ScrapeWebUrlSchema>;

// extract
export const ExtractWebUrlOptionsSchema = z.object({
  instructions: z.string(),
  systemPrompt: z.string().optional(),
  jsonTemplate: z.string(),
  model: TextModelSchema.optional(),
  delayAfterLoad: z.number().optional(),
  debug: z.boolean().optional(),
});
export type ExtractWebUrlOptions = z.infer<typeof ExtractWebUrlOptionsSchema>;
