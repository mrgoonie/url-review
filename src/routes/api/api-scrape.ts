import express from "express";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isUrlAlive } from "@/lib/utils";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { scrapeMetadata } from "@/modules/metadata";
import { extractAllLinksFromUrl, scrapeWebUrl, ScrapeWebUrlOptionsSchema } from "@/modules/scrape";

// Scrape API router
// Tag: Scrape
export const apiScrapeRouter = express.Router();

// Schema for multiple URLs scraping
const ScrapeMultipleUrlsSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10).describe("Array of URLs to scrape (max 10)"),
  options: ScrapeWebUrlOptionsSchema,
});

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
 *                   delayBetweenRetries:
 *                     type: number
 *                     description: Delay between retry attempts in milliseconds
 *                   timeout:
 *                     type: number
 *                     description: Timeout for the request in milliseconds (default 30000)
 *                   headers:
 *                     type: object
 *                     description: Custom headers to send with the request
 *                   proxyUrl:
 *                     type: string
 *                     description: Proxy URL to use for the request
 *                   debug:
 *                     type: boolean
 *                     description: Enable debug logging
 *                   selectors:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: CSS selectors to extract specific elements from the page
 *                   selectorMode:
 *                     type: string
 *                     enum: ["first", "all"]
 *                     description: Whether to select the first matching element or all matching elements
 *                   simpleHtml:
 *                     type: boolean
 *                     description: Strip out all unnecessary HTML elements (scripts, styles, etc.) to reduce token count for LLMs
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

    // Check URL is available
    const { alive } = await isUrlAlive(url);
    if (!alive) throw new Error(`URL ${url} is not alive`);

    // Scrape HTML content and metadata in parallel
    const [html, metadata] = await Promise.all([
      // Scrape HTML content
      scrapeWebUrl(url, options),
      // Scrape metadata
      scrapeMetadata(url),
    ]);

    // Respond with scraped data
    res.status(201).json({
      success: true,
      message: "Successfully scraped the website url.",
      data: {
        url,
        metadata,
        html,
      },
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
 * @swagger
 * /api/v1/scrape/links-map:
 *   post:
 *     summary: Extract all links from a given URL
 *     description: Extracts and returns all valid links found on a webpage. Supports filtering by link type and limiting the number of results.
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
 *         description: The URL to extract links from
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               includeExternal:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to include external links (links to other domains)
 *               maxLinks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 default: 100
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
 *     responses:
 *       201:
 *         description: Successfully extracted links
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
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 healthy:
 *                   type: integer
 *                   example: 40
 *                 broken:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
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
 *                   example: ["url must be a valid URL"]
 *       500:
 *         description: Server error
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

/**
 * @openapi
 * /api/v1/scrape/urls:
 *   post:
 *     summary: Scrape multiple URLs at once
 *     tags:
 *       - Scrape
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
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
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: Array of URLs to scrape (max 10)
 *               options:
 *                 type: object
 *                 properties:
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   delayBetweenRetries:
 *                     type: number
 *                     description: Delay between retry attempts in milliseconds
 *                   timeout:
 *                     type: number
 *                     description: Timeout for the request in milliseconds (default 30000)
 *                   headers:
 *                     type: object
 *                     description: Custom headers to send with the request
 *                   proxyUrl:
 *                     type: string
 *                     description: Proxy URL to use for the request
 *                   debug:
 *                     type: boolean
 *                     description: Enable debug logging
 *                   selectors:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: CSS selectors to extract specific elements from the page
 *                   simpleHtml:
 *                     type: boolean
 *                     description: Strip out all unnecessary HTML elements (scripts, styles, etc.) to reduce token count for LLMs
 *     responses:
 *       201:
 *         description: Successfully scraped the URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 total:
 *                   type: integer
 *                 successful:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       data:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           html:
 *                             type: string
 *                           metadata:
 *                             type: object
 *                       error:
 *                         type: string
 *       400:
 *         description: Bad request, missing or invalid URLs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiScrapeRouter.post("/urls", validateSession, apiKeyAuth, async (req, res) => {
  try {
    // Validate request body
    const { urls, options } = ScrapeMultipleUrlsSchema.parse(req.body);

    // Process each URL in parallel
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        try {
          // Check URL is available
          const { alive } = await isUrlAlive(url);
          if (!alive) throw new Error(`URL ${url} is not alive`);

          // Scrape HTML content and metadata in parallel
          const [html, metadata] = await Promise.all([
            scrapeWebUrl(url, options),
            scrapeMetadata(url),
          ]);

          return {
            url,
            success: true,
            data: {
              url,
              metadata,
              html,
            },
          };
        } catch (error) {
          console.error(`Error scraping URL ${url}:`, error);
          return {
            url,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Count successful and failed scrapes
    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;
    const failureCount = results.length - successCount;

    // Respond with all results
    res.status(201).json({
      success: true,
      message: `Finished scraping ${successCount} URLs successfully, ${failureCount} failed.`,
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results: results.map((result) =>
        result.status === "fulfilled"
          ? result.value
          : {
              success: false,
              error: "Promise rejection during scraping",
            }
      ),
    });
  } catch (error) {
    console.error("api-scrape.ts > POST /urls > Error :>>", error);

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
      message: "Failed to process multiple URLs scraping request.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

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
    console.error("api-scrape.ts > POST /links-map > Error :>>", error);

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
