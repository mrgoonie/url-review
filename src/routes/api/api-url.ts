import express from "express";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { getUrlAfterRedirects, isUrlAlive } from "@/lib/utils/url";
import { apiKeyAuth } from "@/middlewares/api_key_auth";

// URL API Router
// Tag: URL
export const apiUrlRouter = express.Router();

// Zod schema for URL validation
const UrlAliveRequestSchema = z.object({
  url: z.string().url(),
  timeout: z.number().int().min(1000).max(60000).optional(),
  proxyUrl: z.string().url().optional(),
});

const UrlAfterRedirectsRequestSchema = z.object({
  url: z.string().url(),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     UrlAliveRequest:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           format: url
 *           description: URL to check if it's alive
 *           example: https://example.com
 *         timeout:
 *           type: integer
 *           minimum: 1000
 *           maximum: 60000
 *           default: 10000
 *           description: Request timeout in milliseconds
 *         proxyUrl:
 *           type: string
 *           format: url
 *           description: Proxy URL to use for the request
 *       required:
 *         - url
 *
 *     UrlAliveResponse:
 *       type: object
 *       properties:
 *         alive:
 *           type: boolean
 *           description: Whether the URL is alive
 *         avgResponseTime:
 *           type: number
 *           description: Average response time in milliseconds (only available when using ping method)
 *         method:
 *           type: string
 *           enum: [axios, ping]
 *           description: Method used to check if the URL is alive
 */

/**
 * @openapi
 * /api/v1/url/is-alive:
 *   get:
 *     summary: Check if a URL is alive
 *     description: Checks if a URL is alive using HTTP requests and/or ping
 *     tags:
 *       - URL
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
 *         description: URL to check
 *       - in: query
 *         name: timeout
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1000
 *           maximum: 60000
 *           default: 10000
 *         description: Request timeout in milliseconds
 *       - in: query
 *         name: proxyUrl
 *         required: false
 *         schema:
 *           type: string
 *           format: url
 *         description: Proxy URL to use for the request
 *     responses:
 *       200:
 *         description: URL alive check successful
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
 *                   example: URL alive check successful
 *                 data:
 *                   $ref: '#/components/schemas/UrlAliveResponse'
 *       400:
 *         description: Invalid URL or parameters
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
 *                   example: Invalid URL or parameters
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Failed to check if URL is alive
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
 *                   example: Failed to check if URL is alive
 *                 error:
 *                   type: string
 */
apiUrlRouter.get("/is-alive", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const { url, timeout, proxyUrl } = UrlAliveRequestSchema.parse({
      url: req.query.url,
      timeout: req.query.timeout ? parseInt(req.query.timeout as string) : undefined,
      proxyUrl: req.query.proxyUrl,
    });

    const result = await isUrlAlive(url, { timeout, proxyUrl });

    res.status(200).json({
      success: true,
      message: "URL alive check successful",
      data: result,
    });
  } catch (error) {
    console.error("api-url.ts > GET /is-alive > Error :>>", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL or parameters",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to check if URL is alive",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * components:
 *   schemas:
 *     UrlAfterRedirectsRequest:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           format: url
 *           description: URL to get after redirects
 *           example: https://example.com
 *       required:
 *         - url
 *
 *     UrlAfterRedirectsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: URL after redirects successful
 *         data:
 *           type: string
 *           description: URL after redirects
 *           example: https://example.com
 */
apiUrlRouter.get("/get-url-after-redirects", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const { url } = UrlAfterRedirectsRequestSchema.parse({
      url: req.query.url,
    });

    const result = await getUrlAfterRedirects(url);

    res.status(200).json({
      success: true,
      message: "URL after redirects successful",
      data: result,
    });
  } catch (error) {
    console.error("api-url.ts > GET /get-url-after-redirects > Error :>>", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL or parameters",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to get URL after redirects",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
