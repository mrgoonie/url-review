import express from "express";
import { z } from "zod";

import { analyzeUrl, type AskAiResponse, fetchAi, validateJson } from "@/lib/ai";
import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { extractAllLinksFromUrl, ExtractWebUrlOptionsSchema } from "@/modules/scrape";

// Scrape API router
// Tag: Extract
export const apiExtractRouter = express.Router();

/**
 * @openapi
 * /api/v1/extract:
 *   post:
 *     summary: Extract structured data from a URL using AI
 *     tags:
 *       - Extract
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: url
 *                 description: The URL to extract data from
 *               options:
 *                 type: object
 *                 required:
 *                   - instructions
 *                   - jsonTemplate
 *                 properties:
 *                   instructions:
 *                     type: string
 *                     description: Instructions for the AI on what data to extract
 *                   systemPrompt:
 *                     type: string
 *                     description: Optional system prompt to guide the AI
 *                   jsonTemplate:
 *                     type: string
 *                     description: JSON template for structuring the extracted data
 *                   model:
 *                     type: string
 *                     description: AI model to use for extraction
 *                     default: google/gemini-2.0-flash-001
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   recursive:
 *                     type: boolean
 *                     description: If true, recursively scrape all internal URLs and extract data from each
 *                     default: false
 *                   debug:
 *                     type: boolean
 *                     description: Enable debug mode for detailed logging
 *     responses:
 *       201:
 *         description: Successfully extracted data from the website URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: The extracted data in the requested JSON format
 *       400:
 *         description: Bad request, missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiExtractRouter.post("/", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const url = req.body.url;
    if (!url) throw new Error("url is required");

    // options
    const options = ExtractWebUrlOptionsSchema.parse(req.body.options);

    // Default instructions
    if (!options.instructions)
      options.instructions = `Analyze the following HTML content of the website and extract the data following these instructions:
## Instructions:
- Only return the stringified JSON result following the JSON template format
- Carefully escape quotes and double quotes in JSON values
- Do not include any explanation in your response
- Do not wrap your response with tripple backticks

## JSON Response Format:
\`\`\`
${options.jsonTemplate}
\`\`\``;

    // Extract data from url
    const result = await analyzeUrl(
      {
        url,
        systemPrompt: options.systemPrompt || `You are an AI data extraction tool.`,
        instructions: options.instructions,
      },
      {
        jsonResponseFormat: options.jsonTemplate,
        model: options.model,
        delayAfterLoad: options.delayAfterLoad,
        debug: options.debug,
      }
    );

    // If recursive option is enabled, extract data from all internal URLs
    type RecursiveResult = {
      url: string;
      data?: any;
      error?: string;
      usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
      model?: string;
    };
    const recursiveResults: RecursiveResult[] = [];
    if (options.recursive) {
      console.log(`api-scrape.ts > POST /extract > Recursive extraction enabled for ${url}`);

      // Extract all internal links from the URL
      const internalLinks = await extractAllLinksFromUrl(url, {
        // Only get internal web pages, not assets or external links
        type: "internal",
        // Don't recursively scrape the internal links again to avoid infinite loops
        autoScrapeInternalLinks: false,
        // Get status codes for the links
        getStatusCode: true,
        // Use the same delay after load
        delayAfterLoad: options.delayAfterLoad,
      });

      console.log(
        `api-scrape.ts > POST /extract > Found ${internalLinks.length} internal links for ${url}`
      );

      // Filter out non-200 status codes and limit to maxLinks
      const linksToProcess = internalLinks
        .filter((link) => link.statusCode === 200)
        .slice(0, options.maxLinks);

      // Process links in parallel with a concurrency limit
      const concurrencyLimit = 5; // Process 5 links at a time
      const chunks: Array<typeof internalLinks> = [];

      // Split links into chunks for controlled concurrency
      for (let i = 0; i < linksToProcess.length; i += concurrencyLimit) {
        chunks.push(linksToProcess.slice(i, i + concurrencyLimit));
      }

      // Process each chunk sequentially, but links within a chunk in parallel
      let shouldStopProcessing = false;

      for (const chunk of chunks) {
        if (shouldStopProcessing) {
          console.log(
            `api-scrape.ts > POST /extract > Stopping processing remaining links as valid data was found`
          );
          break;
        }

        const chunkResults = await Promise.all(
          chunk.map(async (linkObj) => {
            // Skip processing if we already found valid data and stopWhenFound is enabled
            if (shouldStopProcessing) {
              return null;
            }

            try {
              console.log(
                `api-scrape.ts > POST /extract > Processing internal link: ${linkObj.link}`
              );

              // Extract data from the internal link
              const internalResult = await analyzeUrl(
                {
                  url: linkObj.link,
                  systemPrompt: options.systemPrompt || `You are an AI data extraction tool.`,
                  instructions: options.instructions,
                },
                {
                  jsonResponseFormat: options.jsonTemplate,
                  model: options.model,
                  delayAfterLoad: options.delayAfterLoad,
                  debug: options.debug,
                }
              );

              // Check if we found valid data and should stop processing
              if (
                options.stopWhenFound &&
                internalResult.data &&
                typeof internalResult.data === "object" &&
                Object.keys(internalResult.data).length > 0
              ) {
                console.log(
                  `api-scrape.ts > POST /extract > Found valid data, marking to stop processing remaining links`
                );
                shouldStopProcessing = true;
              }

              return {
                url: linkObj.link,
                data: internalResult.data,
                usage: internalResult.usage,
                model: internalResult.model,
              };
            } catch (error) {
              console.error(
                `api-scrape.ts > POST /extract > Error processing ${linkObj.link}:`,
                error
              );
              return {
                url: linkObj.link,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          })
        );

        // Filter out null results (from skipped processing)
        const validResults = chunkResults.filter((result) => result !== null);
        recursiveResults.push(...validResults);
      }
    }

    // Calculate total usage stats if recursive option was enabled
    const totalUsage = options.recursive
      ? [...recursiveResults, { usage: result.usage }].reduce(
          (acc, item) => {
            if (item.usage) {
              acc.total_tokens += item.usage.total_tokens || 0;
              acc.prompt_tokens += item.usage.prompt_tokens || 0;
              acc.completion_tokens += item.usage.completion_tokens || 0;
            }
            return acc;
          },
          { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
        )
      : result.usage;

    // Normalize the extracted data from all sources
    const normalizeData = (data: any) => {
      // If data already has the expected structure with actual values (not schema), return it
      if (data && typeof data === "object" && !data.type && !data.properties) {
        return data;
      }

      // If data is in schema format, return empty object to avoid confusion
      return {};
    };

    // Define the response object type with optional properties
    type ResponseObject = {
      success: boolean;
      message: string;
      url: string;
      model: string;
      /**
       * Main extracted data
       */
      data: any;
      usage: typeof totalUsage;
      pages?: {
        count: number;
        items: Array<{
          url: string;
          data: any;
          usage?: typeof result.usage;
          error?: string;
        }>;
      };
      errors?: {
        count: number;
        items: Array<{
          url: string;
          error: string;
        }>;
      };
    };

    // Prepare the main response object
    const responseObj: ResponseObject = {
      success: true,
      message: "Finished scraping & extracting data from the website url.",
      url,
      model: result.model,
      // Main extraction result
      data: normalizeData(result.data),
      // Total usage across all extractions
      usage: totalUsage,
    };

    // Add recursive results if enabled
    if (options.recursive && recursiveResults.length > 0) {
      responseObj.pages = {
        count: recursiveResults.length,
        items: recursiveResults
          .map((item) => ({
            url: item.url,
            data: normalizeData(item.data),
            usage: item.usage,
            model: item.model,
            error: item.error,
          }))
          .filter((item) => !item.error),
      };

      // Add errors section if any pages had errors
      const errorItems = recursiveResults
        .filter((item): item is RecursiveResult & { error: string } => Boolean(item.error))
        .map((item) => ({
          url: item.url,
          error: item.error,
        }));

      if (errorItems.length > 0) {
        responseObj.errors = {
          count: errorItems.length,
          items: errorItems,
        };
      }

      // Replace response data with the summarized data
      const res = (await fetchAi({
        messages: [
          {
            role: "system",
            content: "You are a professional summarizer & extractor tool",
          },
          {
            role: "user",
            content: `Response the result in structured JSON output based on the following data & schema: 
            <task>
            ${options.instructions}
            </task>
            
            <input_data>
            ${JSON.stringify(recursiveResults.map((item) => item.data))}
            </input_data>
            
            <output_json_schema>
            ${options.jsonTemplate}
            </output_json_schema>`,
          },
        ],
      })) as AskAiResponse;
      const responseContent = res.choices[0].message.content;
      if (!responseContent) {
        console.log(`api-scrape.ts > POST /extract > No response content found :>>`, res);
        console.log(`api-scrape.ts > POST /extract > Error :>>`, res.choices[0].message);
        throw new Error(res.choices[0].error?.message ?? "No response content found");
      }

      // Add usage to response object
      responseObj.usage = [responseObj.usage, res.usage].reduce(
        (acc, item) => {
          if (!item) return acc;
          return {
            total_tokens: (acc.total_tokens || 0) + (item.total_tokens || 0),
            prompt_tokens: (acc.prompt_tokens || 0) + (item.prompt_tokens || 0),
            completion_tokens: (acc.completion_tokens || 0) + (item.completion_tokens || 0),
          };
        },
        {} as { total_tokens: number; prompt_tokens: number; completion_tokens: number }
      );

      // Validate and parse JSON response
      const extraction = await validateJson(responseContent, { parse: true });
      responseObj.data = extraction;
    }

    // Respond with the formatted results
    res.status(201).json(responseObj);
  } catch (error) {
    console.error("api-scrape.ts > POST / > Error :>>", error);

    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to scrape & extract data from the website url.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /api/v1/extract/urls:
 *   post:
 *     summary: Extract structured data from multiple URLs using AI
 *     tags:
 *       - Extract
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - urls
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 description: List of URLs to extract data from
 *               options:
 *                 type: object
 *                 required:
 *                   - instructions
 *                   - jsonTemplate
 *                 properties:
 *                   instructions:
 *                     type: string
 *                     description: Instructions for the AI to extract data from the websites
 *                   systemPrompt:
 *                     type: string
 *                     description: System prompt for the AI
 *                   jsonTemplate:
 *                     type: string
 *                     description: JSON schema template for the extracted data output
 *                   model:
 *                     type: string
 *                     description: AI model to use for extraction
 *                     default: google/gemini-2.0-flash-001
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   debug:
 *                     type: boolean
 *                     description: Whether to enable debug mode
 *     responses:
 *       201:
 *         description: Successfully extracted data from the URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Finished extracting data from the URLs
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *                 model:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         format: uri
 *                       data:
 *                         type: object
 *                       error:
 *                         type: string
 *                       usage:
 *                         type: object
 *                         properties:
 *                           total_tokens:
 *                             type: number
 *                           prompt_tokens:
 *                             type: number
 *                           completion_tokens:
 *                             type: number
 *                 usage:
 *                   type: object
 *                   properties:
 *                     total_tokens:
 *                       type: number
 *                     prompt_tokens:
 *                       type: number
 *                     completion_tokens:
 *                       type: number
 *       400:
 *         description: Invalid request data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid request data
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiExtractRouter.post("/urls", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const urls = req.body.urls;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error("urls array is required and must not be empty");
    }

    // Limit the number of URLs to process (to prevent abuse)
    const MAX_URLS = 20;
    const urlsToProcess = urls.slice(0, MAX_URLS);

    if (urlsToProcess.length < urls.length) {
      console.log(
        `api-scrape.ts > POST /extract-urls > Limiting URLs from ${urls.length} to ${MAX_URLS}`
      );
    }

    // Parse options
    const options = ExtractWebUrlOptionsSchema.parse(req.body.options);

    // Default instructions
    if (!options.instructions) {
      options.instructions = `Analyze the following HTML content of the website and extract the data following these instructions:
## Instructions:
- Only return the stringified JSON result following the JSON template format
- Carefully escape quotes and double quotes in JSON values
- Do not include any explanation in your response
- Do not wrap your response with tripple backticks

## JSON Response Format:
\`\`\`
${options.jsonTemplate}
\`\`\``;
    }

    // Process URLs with controlled concurrency
    const concurrencyLimit = 5; // Process 5 URLs at a time
    const chunks: string[][] = [];

    // Split URLs into chunks for controlled concurrency
    for (let i = 0; i < urlsToProcess.length; i += concurrencyLimit) {
      chunks.push(urlsToProcess.slice(i, i + concurrencyLimit));
    }

    // Define result type
    type ExtractionResult = {
      url: string;
      data?: any;
      error?: string;
      usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
      model?: string;
    };

    const allResults: ExtractionResult[] = [];

    // Process each chunk sequentially, but URLs within a chunk in parallel
    for (const chunk of chunks) {
      console.log(`api-scrape.ts > POST /extract-urls > Processing chunk of ${chunk.length} URLs`);

      const chunkResults = await Promise.all(
        chunk.map(async (url) => {
          try {
            console.log(`api-scrape.ts > POST /extract-urls > Processing URL: ${url}`);

            // Extract data from the URL
            const result = await analyzeUrl(
              {
                url,
                systemPrompt: options.systemPrompt || `You are an AI data extraction tool.`,
                instructions: options.instructions,
              },
              {
                jsonResponseFormat: options.jsonTemplate,
                model: options.model,
                delayAfterLoad: options.delayAfterLoad,
                debug: options.debug,
              }
            );

            return {
              url,
              data: result.data,
              usage: result.usage,
              model: result.model,
            };
          } catch (error) {
            console.error(`api-scrape.ts > POST /extract-urls > Error processing ${url}:`, error);
            return {
              url,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      allResults.push(...chunkResults);
    }

    // Calculate total usage across all extractions
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

    // Normalize the extracted data
    const normalizeData = (data: any) => {
      // If data already has the expected structure with actual values (not schema), return it
      if (data && typeof data === "object" && !data.type && !data.properties) {
        return data;
      }
      // If data is in schema format, return empty object to avoid confusion
      return {};
    };

    // Prepare successful and failed results
    const successfulResults = allResults
      .filter((item): item is ExtractionResult & { data: any } => Boolean(item.data))
      .map((item) => ({
        url: item.url,
        data: normalizeData(item.data),
        usage: item.usage,
        model: item.model,
      }));

    const failedResults = allResults
      .filter((item): item is ExtractionResult & { error: string } => Boolean(item.error))
      .map((item) => ({
        url: item.url,
        error: item.error,
      }));

    // Prepare the response object
    const responseObj = {
      success: true,
      message: "Finished extracting data from the URLs.",
      urls: urlsToProcess,
      model: allResults.find((r) => r.model)?.model || options.model,
      results: {
        successful: {
          count: successfulResults.length,
          items: successfulResults,
        },
        failed: {
          count: failedResults.length,
          items: failedResults,
        },
      },
      usage: totalUsage,
    };

    // Respond with the formatted results
    res.status(201).json(responseObj);
  } catch (error) {
    console.error("api-scrape.ts > POST /extract-urls > Error:", error);

    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to extract data from the URLs.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
