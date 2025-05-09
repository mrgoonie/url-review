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
  debug: z.boolean().optional(),
  instructions: z.string().describe("Instructions for the AI to extract data from the website"),
  systemPrompt: z.string().optional().describe("System prompt for the AI"),
  jsonTemplate: z.string().describe("JSON schema template for the extracted data output"),
  model: TextModelSchema.optional().default("google/gemini-2.5-flash-preview"),
  delayAfterLoad: z.number().optional().describe("Optional delay after page load in milliseconds"),
  recursive: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "If true, will recursively scrape all internal URLs found on the page and extract data from each of them using the same options"
    ),
  maxLinks: z
    .number()
    .optional()
    .default(20)
    .describe("Maximum number of links to process when recursive is true (default: 20)"),
  stopWhenFound: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "If true, will stop processing remaining links once valid data is extracted from any link"
    ),
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
