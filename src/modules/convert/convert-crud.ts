import { analyzeUrl } from "@/lib/ai";

import type { ConvertWebUrlOptions } from "./convert-schemas";

/**
 * Convert a web URL to Markdown format
 * @param url The URL to convert
 * @param options Conversion options
 * @returns Markdown content of the URL
 */
export async function convertUrlToMarkdown(url: string, options?: ConvertWebUrlOptions) {
  // Default instructions for conversion
  const instructions = `Convert the HTML content of this webpage into well-formatted Markdown.
    
    ## Instructions:
    - Create a clean, readable Markdown document
    - Preserve the document structure (headings, paragraphs, lists)
    - Include links, images, and tables
    - Format code blocks appropriately
    - Remove unnecessary elements like ads, navigation menus, footers
    - Focus on the main content of the page
    - Add a title at the top based on the page title
    - Include a source URL reference at the bottom
    - Ensure the Markdown is valid and well-formatted`;

  // Default system prompt
  const systemPrompt =
    "You are an expert HTML to Markdown converter. Your task is to convert webpage content into clean, well-formatted Markdown while preserving the important content and structure.";

  // Use analyzeUrl to process the content
  const result = await analyzeUrl(
    {
      url,
      systemPrompt,
      instructions,
    },
    {
      jsonResponseFormat: {
        type: "object",
        properties: {
          content: { type: "string", description: "The Markdown content of the webpage" },
        },
      },
      model: options?.model,
      delayAfterLoad: options?.delayAfterLoad ?? 3000,
      debug: options?.debug,
    }
  );

  // Return the markdown content
  return {
    url,
    markdown: result.data,
    model: result.model,
    usage: result.usage,
  };
}

/**
 * Convert multiple URLs to Markdown format
 * @param urls Array of URLs to convert
 * @param options Conversion options
 * @returns Array of markdown content for each URL
 */
export async function convertMultipleUrlsToMarkdown(
  urls: string[],
  options?: ConvertWebUrlOptions
) {
  // Limit the number of URLs to process
  const MAX_URLS = options?.maxLinks || 20;
  const urlsToProcess = urls.slice(0, MAX_URLS);

  // Process URLs with controlled concurrency
  const concurrencyLimit = 5; // Process 5 URLs at a time
  const chunks: string[][] = [];

  // Split URLs into chunks for controlled concurrency
  for (let i = 0; i < urlsToProcess.length; i += concurrencyLimit) {
    chunks.push(urlsToProcess.slice(i, i + concurrencyLimit));
  }

  type ConversionResult = {
    url: string;
    markdown: string;
    error?: string;
    usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
    model?: string;
  };

  const allResults: ConversionResult[] = [];

  // Process each chunk sequentially, but URLs within a chunk in parallel
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (url) => {
        try {
          const result = await convertUrlToMarkdown(url, options);
          return {
            url,
            markdown: result.markdown,
            usage: result.usage,
            model: result.model,
          };
        } catch (error) {
          console.error(
            `convert-crud.ts > convertMultipleUrlsToMarkdown > Error processing ${url}:`,
            error
          );
          return {
            url,
            markdown: "",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    allResults.push(...chunkResults);
  }

  // Calculate total usage across all conversions
  const totalUsage = allResults.reduce(
    (acc, item) => {
      if (item.usage) {
        acc.total_tokens += item.usage.total_tokens || 0;
        acc.prompt_tokens += item.usage.prompt_tokens || 0;
        acc.completion_tokens += item.usage.completion_tokens || 0;
      }
      return acc;
    },
    { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
  );

  // Return the results
  return {
    urls: urlsToProcess,
    results: allResults,
    usage: totalUsage,
  };
}
