import { analyzeUrl } from "@/lib/ai";
import { extractAllLinksFromUrl } from "@/modules/scrape";

import type { SummarizeWebUrlOptions } from "./summarize-schemas";

/**
 * Summarize a web URL
 * @param url The URL to summarize
 * @param options Summarization options
 * @returns Summary of the URL content
 */
export async function summarizeWebUrl(url: string, options?: SummarizeWebUrlOptions) {
  // Default instructions for summarization
  const instructions =
    options?.instructions ||
    `Summarize the content of this webpage in a clear, concise manner.
    
    ## Instructions:
    - Create a ${options?.format === "bullet" ? "bullet-point list" : "coherent paragraph"} summary
    - Focus on the main points and key information
    - Limit the summary to approximately ${options?.maxLength || 500} words
    - Maintain the original meaning and intent of the content
    - Include the most important facts, arguments, and conclusions
    - Exclude minor details, examples, and tangential information
    - Use clear, straightforward language
    - Organize information in a logical flow
    - Add a title at the top based on the page content
    - Include a source URL reference at the bottom`;

  // Default system prompt
  const systemPrompt =
    options?.systemPrompt ||
    "You are an expert content summarizer. Your task is to analyze webpage content and create concise, accurate summaries that capture the essential information while eliminating unnecessary details.";

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
          title: { type: "string", description: "A descriptive title for the summary" },
          summary: { type: "string", description: "The summarized content" },
          keyPoints: {
            type: "array",
            items: { type: "string" },
            description: "Key points extracted from the content (3-7 items)",
          },
        },
        required: ["title", "summary"],
      },
      model: options?.model,
      delayAfterLoad: options?.delayAfterLoad ?? 3000,
      debug: options?.debug,
    }
  );

  // Return the summary
  return {
    url,
    summary: result.data,
    model: result.model,
    usage: result.usage,
  };
}

/**
 * Summarize a website by analyzing multiple pages
 * @param url The main URL of the website
 * @param options Summarization options
 * @returns Summary of the website content
 */
export async function summarizeWebsite(url: string, options?: SummarizeWebUrlOptions) {
  // First, summarize the main URL
  const mainPageSummary = await summarizeWebUrl(url, options);

  // Extract internal links from the URL
  const internalLinks = await extractAllLinksFromUrl(url, {
    type: "internal",
    autoScrapeInternalLinks: false,
    getStatusCode: true,
    delayAfterLoad: options?.delayAfterLoad,
    maxLinks: options?.maxLinks || 20,
  });

  // Filter out non-200 status codes and limit to maxLinks
  const linksToProcess = internalLinks
    .filter((link) => link.statusCode === 200)
    .slice(0, (options?.maxLinks || 20) - 1); // -1 to account for the main page

  // Process links with controlled concurrency
  const concurrencyLimit = 3; // Process 3 links at a time
  const chunks: Array<typeof internalLinks> = [];

  // Split links into chunks for controlled concurrency
  for (let i = 0; i < linksToProcess.length; i += concurrencyLimit) {
    chunks.push(linksToProcess.slice(i, i + concurrencyLimit));
  }

  type SummaryResult = {
    url: string;
    summary: any;
    error?: string;
    usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
    model?: string;
  };

  const allResults: SummaryResult[] = [
    {
      url,
      summary: mainPageSummary.summary,
      usage: mainPageSummary.usage,
      model: mainPageSummary.model,
    },
  ];

  // Process each chunk sequentially, but links within a chunk in parallel
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (linkObj) => {
        try {
          console.log(
            `summarize-crud.ts > summarizeWebsite > Processing internal link: ${linkObj.link}`
          );

          // Summarize the internal link
          const result = await summarizeWebUrl(linkObj.link, {
            ...options,
            maxLength: Math.min(options?.maxLength || 500, 300), // Shorter summaries for subpages
          });

          return {
            url: linkObj.link,
            summary: result.summary,
            usage: result.usage,
            model: result.model,
          };
        } catch (error) {
          console.error(
            `summarize-crud.ts > summarizeWebsite > Error processing ${linkObj.link}:`,
            error
          );
          return {
            url: linkObj.link,
            summary: null,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    allResults.push(...chunkResults.filter((result) => result.summary !== null));
  }

  // Calculate total usage across all summaries
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

  // Combine the summaries into a comprehensive website summary
  const combinedSummaryResult = await analyzeUrl(
    {
      url: "combined-summary", // Placeholder URL
      systemPrompt:
        "You are an expert content summarizer specializing in creating comprehensive website summaries.",
      instructions: `Create a comprehensive summary of the entire website based on the summaries of individual pages provided.
      
      ## Instructions:
      - Create a ${
        options?.format === "bullet" ? "bullet-point list" : "coherent narrative"
      } summary
      - Combine and synthesize information from all page summaries
      - Identify common themes, purposes, and key offerings of the website
      - Limit the summary to approximately ${options?.maxLength || 800} words
      - Organize information logically with clear sections
      - Include a descriptive title for the website
      - Mention the main URL of the website
      
      ## Individual Page Summaries:
      ${allResults
        .map(
          (result) => `
      ### Page: ${result.url}
      ${
        typeof result.summary === "object"
          ? `Title: ${result.summary.title || "N/A"}
        Summary: ${result.summary.summary || "N/A"}
        ${result.summary.keyPoints ? `Key Points: ${result.summary.keyPoints.join(", ")}` : ""}`
          : `${result.summary || "No summary available"}`
      }
      `
        )
        .join("\n")}`,
    },
    {
      jsonResponseFormat: {
        type: "object",
        properties: {
          websiteTitle: {
            type: "string",
            description: "A descriptive title for the entire website",
          },
          websiteSummary: { type: "string", description: "Comprehensive summary of the website" },
          mainPurpose: {
            type: "string",
            description: "The main purpose or function of the website",
          },
          keyFeatures: {
            type: "array",
            items: { type: "string" },
            description: "Key features or offerings of the website (3-7 items)",
          },
          audienceTarget: {
            type: "string",
            description: "The likely target audience of the website",
          },
          wordCount: { type: "number", description: "Approximate word count of the summary" },
        },
        required: ["websiteTitle", "websiteSummary", "mainPurpose"],
      },
      model: options?.model,
      debug: options?.debug,
    }
  );

  // Return the combined website summary
  return {
    url,
    pageSummaries: allResults.map((result) => ({
      url: result.url,
      summary: result.summary,
    })),
    websiteSummary: combinedSummaryResult.data,
    model: combinedSummaryResult.model,
    usage: totalUsage,
  };
}

/**
 * Summarize multiple URLs
 * @param urls Array of URLs to summarize
 * @param options Summarization options
 * @returns Array of summaries for each URL
 */
export async function summarizeMultipleUrls(urls: string[], options?: SummarizeWebUrlOptions) {
  // Limit the number of URLs to process
  const MAX_URLS = options?.maxLinks || 20;
  const urlsToProcess = urls.slice(0, MAX_URLS);

  // Process URLs with controlled concurrency
  const concurrencyLimit = 3; // Process 3 URLs at a time
  const chunks: string[][] = [];

  // Split URLs into chunks for controlled concurrency
  for (let i = 0; i < urlsToProcess.length; i += concurrencyLimit) {
    chunks.push(urlsToProcess.slice(i, i + concurrencyLimit));
  }

  type SummaryResult = {
    url: string;
    summary: any;
    error?: string;
    usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
    model?: string;
  };

  const allResults: SummaryResult[] = [];

  // Process each chunk sequentially, but URLs within a chunk in parallel
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (url) => {
        try {
          const result = await summarizeWebUrl(url, options);
          return {
            url,
            summary: result.summary,
            usage: result.usage,
            model: result.model,
          };
        } catch (error) {
          console.error(
            `summarize-crud.ts > summarizeMultipleUrls > Error processing ${url}:`,
            error
          );
          return {
            url,
            summary: null,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    allResults.push(...chunkResults);
  }

  // Calculate total usage across all summaries
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

  // Create a combined summary of all URLs
  const combinedSummaryResult = await analyzeUrl(
    {
      url: "combined-summary", // Placeholder URL
      systemPrompt:
        "You are an expert content summarizer specializing in creating comparative summaries.",
      instructions: `Create a comparative summary of the multiple URLs provided.
      
      ## Instructions:
      - Create a ${
        options?.format === "bullet" ? "bullet-point list" : "coherent narrative"
      } summary
      - Compare and contrast the content from different URLs
      - Identify common themes and key differences
      - Limit the summary to approximately ${options?.maxLength || 800} words
      - Organize information logically with clear sections
      - Include a descriptive title for the comparative summary
      
      ## Individual URL Summaries:
      ${allResults
        .filter((result) => result.summary !== null)
        .map(
          (result) => `
      ### URL: ${result.url}
      ${
        typeof result.summary === "object"
          ? `Title: ${result.summary.title || "N/A"}
        Summary: ${result.summary.summary || "N/A"}
        ${result.summary.keyPoints ? `Key Points: ${result.summary.keyPoints.join(", ")}` : ""}`
          : `${result.summary || "No summary available"}`
      }
      `
        )
        .join("\n")}`,
    },
    {
      jsonResponseFormat: {
        type: "object",
        properties: {
          title: { type: "string", description: "A descriptive title for the comparative summary" },
          summary: { type: "string", description: "Comparative summary of all URLs" },
          commonThemes: {
            type: "array",
            items: { type: "string" },
            description: "Common themes across the URLs (3-5 items)",
          },
          keyDifferences: {
            type: "array",
            items: { type: "string" },
            description: "Key differences between the URLs (3-5 items)",
          },
          wordCount: { type: "number", description: "Approximate word count of the summary" },
        },
        required: ["title", "summary"],
      },
      model: options?.model,
      debug: options?.debug,
    }
  );

  // Return the results
  return {
    urls: urlsToProcess,
    individualSummaries: allResults,
    combinedSummary: combinedSummaryResult.data,
    model: combinedSummaryResult.model,
    usage: totalUsage,
  };
}
