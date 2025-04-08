import express from "express";
import { z } from "zod";

import { analyzeUrl } from "@/lib/ai";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { scrapeMetadata } from "@/modules/metadata";
import {
  extractAllLinksFromUrl,
  ExtractWebUrlOptionsSchema,
  scrapeWebUrl,
  ScrapeWebUrlOptionsSchema,
} from "@/modules/scrape";

// Scrape API router
// Tag: Scrape
export const apiScrapeRouter = express.Router();

// Scrape a new url
/**
 * @openapi
 * /api/v1/scrape:
 *   post:
 *     summary: Scrape a new URL
 *     tags:
 *       - Scrape
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: url
 *         description: The URL to scrape
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                 required: []
 *     responses:
 *       201:
 *         description: Successfully scraped the website URL
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
 *                   properties:
 *                     url:
 *                       type: string
 *                     html:
 *                       type: string
 *                     metadata:
 *                       type: object
 *       400:
 *         description: Bad request, missing or invalid URL
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiScrapeRouter.post("/", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const url = req.query["url"]?.toString();
    if (!url) throw new Error("url is required");

    // Extract options from req.body (if any)
    const options = ScrapeWebUrlOptionsSchema.parse(req.body.options);

    // Start the review process
    const html = await scrapeWebUrl(url, options);
    const metadata = await scrapeMetadata(url);
    const data = {
      url,
      metadata,
      html,
    };

    // Respond with review details
    res.status(201).json({
      success: true,
      message: "Finished scraping the website url.",
      data,
    });
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
      message: "Failed to scrape the website url.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/scrape/extract:
 *   post:
 *     summary: Extract structured data from a URL using AI
 *     tags:
 *       - Scrape
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: url
 *         description: The URL to extract data from
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *                     default: google/gemini-flash-1.5
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
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
apiScrapeRouter.post("/extract", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const url = req.query["url"]?.toString();
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
        model: options.model || "google/gemini-flash-1.5",
        delayAfterLoad: options.delayAfterLoad,
        debug: options.debug,
      }
    );

    // Respond with review details
    res.status(201).json({
      success: true,
      message: "Finished scraping & extracting data from the website url.",
      ...result,
    });
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
 * /api/v1/scrape/links-map:
 *   post:
 *     summary: Extract all links from a given URL
 *     description: Extracts and returns all valid links found on a webpage. Supports filtering by link type and limiting the number of results.
 *     tags: [Scrape]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: The target URL to extract links from
 *     requestBody:
 *       description: Optional configuration for link extraction
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [web, image, file, all]
 *                 default: all
 *                 description: Type of links to extract
 *               maxLinks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 default: 500
 *                 description: Maximum number of links to return
 *               delayAfterLoad:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 600000
 *                 default: 5000
 *                 description: Delay in milliseconds after page load before extracting links (max 10 minutes)
 *               getStatusCode:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to get HTTP status codes for each link
 *               autoScrapeInternalLinks:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to automatically scrape internal links
 *               debug:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to enable debug mode
 *             additionalProperties: false
 *     responses:
 *       201:
 *         description: Successfully extracted links from the URL
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
 *                   example: Finished extracting all links from the website url.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *                   description: Array of extracted URLs
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
 *       500:
 *         description: Server error while processing the request
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
 *                   example: Failed to extract all links from the website url.
 *                 error:
 *                   type: string
 */
apiScrapeRouter.post("/links-map", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const url = req.query["url"]?.toString();
    if (!url) throw new Error("url is required");

    // Extract all links from url
    const data = await extractAllLinksFromUrl(url, req.body);

    // Save to database
    const result = await prisma.scanLinkResult.create({
      data: {
        url,
        status: "COMPLETED",
        links: data.map((l) => l.link),
        statusCodes: data.map((l) => l.statusCode || 404),
      },
    });
    console.log(JSON.stringify(result, null, 2));

    // Respond with review details
    res.status(201).json({
      success: true,
      message: "Finished extracting all links from the website url.",
      total: data.length,
      healthy: data.filter((l) => l.statusCode === 200).length,
      broken: data.filter((l) => l.statusCode !== 200).length,
      data: result,
    });
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
      message: "Failed to extract all links from the website url.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
