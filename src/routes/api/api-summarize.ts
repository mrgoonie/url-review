import express from "express";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import {
  summarizeMultipleUrls,
  summarizeWebsite,
  summarizeWebUrl,
  SummarizeWebUrlOptionsSchema,
} from "@/modules/summarize";

// Summarize API router
// Tag: Summarize
export const apiSummarizeRouter = express.Router();

/**
 * @openapi
 * /api/v1/summarize/url:
 *   post:
 *     summary: Summarize a URL using AI
 *     tags:
 *       - Summarize
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
 *                 description: The URL to summarize
 *               options:
 *                 type: object
 *                 properties:
 *                   instructions:
 *                     type: string
 *                     description: Custom instructions for the AI on how to summarize the content
 *                   systemPrompt:
 *                     type: string
 *                     description: Custom system prompt to guide the AI
 *                   model:
 *                     type: string
 *                     description: AI model to use for summarization
 *                     default: google/gemini-2.5-flash-preview
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   maxLength:
 *                     type: number
 *                     description: Maximum length of the summary in words
 *                     default: 500
 *                   format:
 *                     type: string
 *                     enum: [bullet, paragraph]
 *                     description: Format of the summary (bullet points or paragraph)
 *                     default: paragraph
 *                   debug:
 *                     type: boolean
 *                     description: Enable debug mode for detailed logging
 *     responses:
 *       201:
 *         description: Successfully summarized the URL
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
 *                 summary:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     keyPoints:
 *                       type: array
 *                       items:
 *                         type: string
 *                     wordCount:
 *                       type: number
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
apiSummarizeRouter.post("/url", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const url = req.body.url;
    if (!url) throw new Error("url is required");

    // Parse options
    const options = SummarizeWebUrlOptionsSchema.parse(req.body.options || {});

    // Summarize URL
    const result = await summarizeWebUrl(url, options);

    // Respond with the formatted results
    res.status(201).json({
      success: true,
      message: "Successfully summarized the URL",
      url: result.url,
      summary: result.summary,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("api-summarize.ts > POST /url > Error :>>", error);

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
      message: "Failed to summarize the URL",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/summarize/website:
 *   post:
 *     summary: Summarize a website (multiple pages) using AI
 *     tags:
 *       - Summarize
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
 *                 description: The main URL of the website to summarize
 *               options:
 *                 type: object
 *                 properties:
 *                   instructions:
 *                     type: string
 *                     description: Custom instructions for the AI on how to summarize the content
 *                   systemPrompt:
 *                     type: string
 *                     description: Custom system prompt to guide the AI
 *                   model:
 *                     type: string
 *                     description: AI model to use for summarization
 *                     default: google/gemini-2.5-flash-preview
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   maxLinks:
 *                     type: number
 *                     description: Maximum number of pages to process
 *                     default: 20
 *                   maxLength:
 *                     type: number
 *                     description: Maximum length of the summary in words
 *                     default: 800
 *                   format:
 *                     type: string
 *                     enum: [bullet, paragraph]
 *                     description: Format of the summary (bullet points or paragraph)
 *                     default: paragraph
 *                   debug:
 *                     type: boolean
 *                     description: Enable debug mode for detailed logging
 *     responses:
 *       201:
 *         description: Successfully summarized the website
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
 *                 websiteSummary:
 *                   type: object
 *                   properties:
 *                     websiteTitle:
 *                       type: string
 *                     websiteSummary:
 *                       type: string
 *                     mainPurpose:
 *                       type: string
 *                     keyFeatures:
 *                       type: array
 *                       items:
 *                         type: string
 *                     audienceTarget:
 *                       type: string
 *                     wordCount:
 *                       type: number
 *                 pageSummaries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       summary:
 *                         type: object
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
apiSummarizeRouter.post("/website", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const url = req.body.url;
    if (!url) throw new Error("url is required");

    // Parse options
    const options = SummarizeWebUrlOptionsSchema.parse(req.body.options || {});

    // Summarize website
    const result = await summarizeWebsite(url, options);

    // Respond with the formatted results
    res.status(201).json({
      success: true,
      message: "Successfully summarized the website",
      url: result.url,
      websiteSummary: result.websiteSummary,
      pageSummaries: result.pageSummaries,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("api-summarize.ts > POST /website > Error :>>", error);

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
      message: "Failed to summarize the website",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/summarize/urls:
 *   post:
 *     summary: Summarize multiple URLs using AI
 *     tags:
 *       - Summarize
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
 *                 description: List of URLs to summarize
 *               options:
 *                 type: object
 *                 properties:
 *                   instructions:
 *                     type: string
 *                     description: Custom instructions for the AI on how to summarize the content
 *                   systemPrompt:
 *                     type: string
 *                     description: Custom system prompt to guide the AI
 *                   model:
 *                     type: string
 *                     description: AI model to use for summarization
 *                     default: google/gemini-2.5-flash-preview
 *                   delayAfterLoad:
 *                     type: number
 *                     description: Optional delay after page load in milliseconds
 *                   maxLinks:
 *                     type: number
 *                     description: Maximum number of URLs to process
 *                     default: 20
 *                   maxLength:
 *                     type: number
 *                     description: Maximum length of each summary in words
 *                     default: 500
 *                   format:
 *                     type: string
 *                     enum: [bullet, paragraph]
 *                     description: Format of the summary (bullet points or paragraph)
 *                     default: paragraph
 *                   debug:
 *                     type: boolean
 *                     description: Enable debug mode for detailed logging
 *     responses:
 *       201:
 *         description: Successfully summarized the URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                 individualSummaries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       summary:
 *                         type: object
 *                       error:
 *                         type: string
 *                 combinedSummary:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     commonThemes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     keyDifferences:
 *                       type: array
 *                       items:
 *                         type: string
 *                     wordCount:
 *                       type: number
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
apiSummarizeRouter.post("/urls", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const urls = req.body.urls;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error("urls array is required and must not be empty");
    }

    // Parse options
    const options = SummarizeWebUrlOptionsSchema.parse(req.body.options || {});

    // Summarize multiple URLs
    const result = await summarizeMultipleUrls(urls, options);

    // Respond with the formatted results
    res.status(201).json({
      success: true,
      message: "Successfully summarized the URLs",
      urls: result.urls,
      individualSummaries: result.individualSummaries,
      combinedSummary: result.combinedSummary,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("api-summarize.ts > POST /urls > Error :>>", error);

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
      message: "Failed to summarize the URLs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
