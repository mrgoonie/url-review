import express from "express";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import {
  convertMultipleUrlsToMarkdown,
  convertUrlToMarkdown,
  ConvertWebUrlOptionsSchema,
} from "@/modules/convert";

// Convert API router
// Tag: Convert
export const apiConvertRouter = express.Router();

/**
 * @openapi
 * /api/v1/convert/markdown:
 *   post:
 *     summary: Convert URL to Markdown using AI
 *     tags:
 *       - Convert
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
 *                 description: The URL to convert to Markdown
 *               options:
 *                 type: object
 *                 properties:
 *                   model:
 *                     type: string
 *                     description: AI model to use for conversion
 *                     default: google/gemini-2.5-flash-preview
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   debug:
 *                     type: boolean
 *                     description: Enable debug mode for detailed logging
 *     responses:
 *       201:
 *         description: Successfully converted website URL to Markdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 url:
 *                   type: string
 *                 markdown:
 *                   type: string
 *                 model:
 *                   type: string
 *                 usage:
 *                   type: object
 *       400:
 *         description: Bad request, missing or invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiConvertRouter.post("/markdown", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const url = req.body.url;
    if (!url) throw new Error("url is required");

    // Parse options
    const options = ConvertWebUrlOptionsSchema.parse(req.body.options || {});

    // Convert URL to Markdown
    const result = await convertUrlToMarkdown(url, options);

    // Respond with the formatted results
    res.status(201).json({
      success: true,
      message: "Successfully converted URL to Markdown",
      url: result.url,
      markdown: result.markdown,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("api-convert.ts > POST / > Error :>>", error);

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
      message: "Failed to convert URL to Markdown",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/convert/markdown/urls:
 *   post:
 *     summary: Convert multiple URLs to Markdown using AI
 *     tags:
 *       - Convert
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
 *                 description: List of URLs to convert to Markdown
 *               options:
 *                 type: object
 *                 properties:
 *                   model:
 *                     type: string
 *                     description: AI model to use for conversion
 *                     default: google/gemini-2.5-flash-preview
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   maxLinks:
 *                     type: number
 *                     description: Maximum number of URLs to process
 *                     default: 20
 *                   debug:
 *                     type: boolean
 *                     description: Whether to enable debug mode
 *     responses:
 *       201:
 *         description: Successfully converted URLs to Markdown
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
 *                   example: Successfully converted URLs to Markdown
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       markdown:
 *                         type: string
 *                       error:
 *                         type: string
 *                       usage:
 *                         type: object
 *                       model:
 *                         type: string
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiConvertRouter.post("/markdown/urls", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const urls = req.body.urls;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error("urls array is required and must not be empty");
    }

    // Parse options
    const options = ConvertWebUrlOptionsSchema.parse(req.body.options || {});

    // Convert multiple URLs to Markdown
    const result = await convertMultipleUrlsToMarkdown(urls, options);

    // Respond with the formatted results
    res.status(201).json({
      success: true,
      message: "Successfully converted URLs to Markdown",
      urls: result.urls,
      results: result.results,
      usage: result.usage,
    });
  } catch (error) {
    console.error("api-convert.ts > POST /batch > Error :>>", error);

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
      message: "Failed to convert URLs to Markdown",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
