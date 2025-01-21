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

export const assetExtensions = [
  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".tiff",
  // Stylesheets and fonts
  ".css",
  ".scss",
  ".less",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  // Scripts and data
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".xml",
  // Media
  ".mp3",
  ".mp4",
  ".wav",
  ".ogg",
  ".webm",
  ".avi",
  ".mov",
  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  // Archives
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  // manifest
  ".webmanifest",
];
