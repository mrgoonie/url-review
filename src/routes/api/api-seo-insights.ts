import express from "express";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import {
  checkTrafficForDomain,
  getBacklinksForDomain,
  getKeywordDifficultyForKeyword,
  getKeywordIdeasForKeyword,
} from "@/modules/seo-insights/seo-insights-crud";
import {
  BacklinksRequestSchema,
  KeywordDifficultyRequestSchema,
  KeywordIdeasRequestSchema,
  TrafficCheckRequestSchema,
} from "@/modules/seo-insights/seo-insights-schemas";

// SEO Insights API router
// Tag: SEO Insights
export const apiSeoInsightsRouter = express.Router();

/**
 * @openapi
 * /api/v1/seo-insights/backlinks:
 *   post:
 *     summary: Get backlinks for a domain
 *     tags:
 *       - SEO Insights
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
 *               - domain
 *             properties:
 *               domain:
 *                 type: string
 *                 format: url
 *                 description: The domain to get backlinks for
 *     responses:
 *       200:
 *         description: Successfully retrieved backlinks
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
 *                     overview:
 *                       type: object
 *                     backlinks:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request, missing or invalid domain
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiSeoInsightsRouter.post("/backlinks", validateSession, apiKeyAuth, async (req, res) => {
  try {
    // Validate request body
    const params = BacklinksRequestSchema.parse(req.body);

    // Get backlinks for domain
    const data = await getBacklinksForDomain(params);

    // Respond with backlinks data
    res.status(200).json({
      success: true,
      message: `Successfully retrieved backlinks for domain: ${params.domain}`,
      data,
    });
  } catch (error) {
    console.error("api-seo-insights.ts > POST /backlinks > Error :>>", error);

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
      message: "Failed to get backlinks for domain.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/seo-insights/keyword-ideas:
 *   post:
 *     summary: Get keyword ideas for a keyword
 *     tags:
 *       - SEO Insights
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
 *               - keyword
 *             properties:
 *               keyword:
 *                 type: string
 *                 description: The keyword to get ideas for
 *               country:
 *                 type: string
 *                 description: "Country code (default: us)"
 *               searchEngine:
 *                 type: string
 *                 description: "Search engine to use (default: Google)"
 *     responses:
 *       200:
 *         description: Successfully retrieved keyword ideas
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
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request, missing or invalid keyword
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiSeoInsightsRouter.post("/keyword-ideas", validateSession, apiKeyAuth, async (req, res) => {
  try {
    // Validate request body
    const params = KeywordIdeasRequestSchema.parse(req.body);

    // Get keyword ideas
    const data = await getKeywordIdeasForKeyword(params);

    // Respond with keyword ideas data
    res.status(200).json({
      success: true,
      message: `Successfully retrieved keyword ideas for: ${params.keyword}`,
      data,
    });
  } catch (error) {
    console.error("api-seo-insights.ts > POST /keyword-ideas > Error :>>", error);

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
      message: "Failed to get keyword ideas.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/seo-insights/keyword-difficulty:
 *   post:
 *     summary: Get keyword difficulty for a keyword
 *     tags:
 *       - SEO Insights
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
 *               - keyword
 *             properties:
 *               keyword:
 *                 type: string
 *                 description: The keyword to check difficulty for
 *               country:
 *                 type: string
 *                 description: "Country code (default: us)"
 *     responses:
 *       200:
 *         description: Successfully retrieved keyword difficulty
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
 *                     difficulty:
 *                       type: number
 *                     shortage:
 *                       type: number
 *                     lastUpdate:
 *                       type: string
 *                     serp:
 *                       type: object
 *       400:
 *         description: Bad request, missing or invalid keyword
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiSeoInsightsRouter.post("/keyword-difficulty", validateSession, apiKeyAuth, async (req, res) => {
  try {
    // Validate request body
    const params = KeywordDifficultyRequestSchema.parse(req.body);

    // Get keyword difficulty
    const data = await getKeywordDifficultyForKeyword(params);

    // Respond with keyword difficulty data
    res.status(200).json({
      success: true,
      message: `Successfully retrieved keyword difficulty for: ${params.keyword}`,
      data,
    });
  } catch (error) {
    console.error("api-seo-insights.ts > POST /keyword-difficulty > Error :>>", error);

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
      message: "Failed to get keyword difficulty.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/seo-insights/traffic:
 *   post:
 *     summary: Check traffic for a domain or URL
 *     tags:
 *       - SEO Insights
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
 *               - domainOrUrl
 *             properties:
 *               domainOrUrl:
 *                 type: string
 *                 format: url
 *                 description: The domain or URL to check traffic for
 *               mode:
 *                 type: string
 *                 enum: [subdomains, exact]
 *                 description: "Mode to use (default: subdomains)"
 *               country:
 *                 type: string
 *                 description: "Country code (default: None)"
 *     responses:
 *       200:
 *         description: Successfully checked traffic
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
 *                     traffic_history:
 *                       type: array
 *                     traffic:
 *                       type: object
 *                     top_pages:
 *                       type: array
 *                     top_countries:
 *                       type: array
 *                     top_keywords:
 *                       type: array
 *       400:
 *         description: Bad request, missing or invalid domain/URL
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
apiSeoInsightsRouter.post("/traffic", validateSession, apiKeyAuth, async (req, res) => {
  try {
    // Validate request body
    const params = TrafficCheckRequestSchema.parse(req.body);

    // Check traffic
    const data = await checkTrafficForDomain(params);

    // Respond with traffic data
    res.status(200).json({
      success: true,
      message: `Successfully checked traffic for: ${params.domainOrUrl}`,
      data,
    });
  } catch (error) {
    console.error("api-seo-insights.ts > POST /traffic > Error :>>", error);

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
      message: "Failed to check traffic.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
