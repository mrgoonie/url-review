import express from "express";

import { DEFAULT_AI_MODELS, DEFAULT_VISION_MODELS } from "@/lib/ai";

export const apiAiRouter = express.Router();

/**
 * @swagger
 * /api/v1/ai/models:
 *   get:
 *     summary: Retrieve AI models
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: AI models retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 textModels:
 *                   type: array
 *                   items:
 *                     type: string
 *                 visionModels:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
apiAiRouter.get("/models", async (_, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "AI models retrieved successfully",
      textModels: DEFAULT_AI_MODELS,
      visionModels: DEFAULT_VISION_MODELS,
    });
  } catch (error) {
    console.error("api-ai > GET /models > error :>>", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
