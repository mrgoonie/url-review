import express from "express";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import {
  deleteReview,
  getReviewById,
  getUserReviews,
  ReviewCreateDataSchema,
  ReviewStartOptionsSchema,
  startReview,
  updateReview,
} from "@/modules/review";

// Review API router
// Tag: Review
export const apiReviewRouter = express.Router();

// Create a new review
/**
 * @openapi
 * components:
 *   schemas:
 *     ReviewStartOptions:
 *       type: object
 *       properties:
 *         skipImageExtraction:
 *           type: boolean
 *           description: Skip extracting images from the website
 *           default: true
 *         skipLinkExtraction:
 *           type: boolean
 *           description: Skip extracting links from the website
 *           default: true
 *         maxExtractedImages:
 *           type: number
 *           description: Maximum number of images to extract
 *           default: 50
 *         maxExtractedLinks:
 *           type: number
 *           description: Maximum number of links to extract
 *           default: 50
 *         textModel:
 *           type: string
 *           description: Text model to use for AI analysis
 *         visionModel:
 *           type: string
 *           description: Vision model to use for AI analysis
 *     ReviewCreate:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *           description: Website URL to be reviewed
 *           example: "https://example.com"
 *         instructions:
 *           type: string
 *           description: Optional custom review instructions
 *           example: "Analyze the website for SEO performance"
 *         options:
 *           $ref: '#/components/schemas/ReviewStartOptions'
 *     ReviewResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             reviewId:
 *               type: string
 *             url:
 *               type: string
 *             status:
 *               type: string
 *
 * @swagger
 * /api/v1/review:
 *   post:
 *     summary: Start a new website review
 *     tags:
 *       - Review
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewCreate'
 *     responses:
 *       201:
 *         description: Review started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Failed to start review
 */
apiReviewRouter.post("/", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"];

  try {
    const { options, ...rest } = req.body;

    // Validate request body
    const validatedData = ReviewCreateDataSchema.parse({ ...rest, userId });

    // Validate options
    const validatedOptions = ReviewStartOptionsSchema.parse(options);

    // Start the review process
    const review = await startReview(validatedData, validatedOptions);

    // Respond with review details
    res.status(201).json({
      success: true,
      message: "Finished reviewing the website url.",
      data: review,
    });
  } catch (error) {
    console.error("api-review.ts > POST / > Error :>>", error);

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
      message: "Failed to start review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get a review by ID
/**
 * @openapi
 * /api/v1/review/{reviewId}:
 *   get:
 *     summary: Get a specific review by its ID
 *     tags:
 *       - Review
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the review
 *     responses:
 *       200:
 *         description: Successfully retrieved review details
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
 *                   example: Review retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       404:
 *         description: Review not found
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
 *                   example: Review not found
 *                 error:
 *                   type: string
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
 *                   example: Failed to retrieve review
 *                 error:
 *                   type: string
 */
apiReviewRouter.get("/:reviewId", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"]!;
  const { reviewId } = req.params;

  try {
    const review = await getReviewById(reviewId, userId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
        error: `No review found with ID: ${reviewId}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Review retrieved successfully",
      data: review,
    });
  } catch (error) {
    console.error("api-review.ts > GET /:reviewId > Error :>>", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all reviews for a user with pagination
/**
 * @openapi
 * components:
 *   schemas:
 *     ReviewList:
 *       type: object
 *       properties:
 *         reviews:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               url:
 *                 type: string
 *               status:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *
 * @swagger
 * /api/v1/review:
 *   get:
 *     summary: Get all reviews for a user with pagination
 *     tags:
 *       - Review
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews
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
 *                   example: Reviews retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReviewList'
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
 *                   example: Failed to retrieve reviews
 *                 error:
 *                   type: string
 */
apiReviewRouter.get("/", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"]!;
  const page = parseInt(req.query["page"]?.toString() ?? "1");
  const limit = parseInt(req.query["limit"]?.toString() ?? "10");

  try {
    const { reviews, total } = await getUserReviews(userId, page, limit);

    res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully",
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("api-review.ts > GET / > Error :>>", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve reviews",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update a review
/**
 * @openapi
 * components:
 *   schemas:
 *     ReviewUpdate:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: Updated website URL to be reviewed
 *           example: "https://example.com"
 *         instructions:
 *           type: string
 *           description: Updated custom review instructions
 *           example: "Analyze the website for SEO performance and user experience"
 *     ReviewUpdateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Review'
 *
 * @swagger
 * /api/v1/review/{reviewId}:
 *   patch:
 *     summary: Update an existing review
 *     tags:
 *       - Review
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewUpdate'
 *     responses:
 *       200:
 *         description: Successfully updated review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewUpdateResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Review not found
 *       500:
 *         description: Failed to update review
 */
apiReviewRouter.patch("/:reviewId", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"];
  const { reviewId } = req.params;
  if (!reviewId) {
    return res.status(400).json({
      success: false,
      message: "Review ID is required",
      error: "Review ID not provided",
    });
  }

  try {
    // Validate request body
    const validatedData = ReviewCreateDataSchema.partial().parse({ ...req.body, userId });

    const updatedReview = await updateReview(reviewId, validatedData);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    console.error("api-review.ts > PATCH /:reviewId > Error :>>", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete a review
/**
 * @openapi
 * /api/v1/review/{reviewId}:
 *   delete:
 *     summary: Delete a specific review by its ID
 *     tags:
 *       - Review
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the review to delete
 *     responses:
 *       200:
 *         description: Successfully deleted review
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
 *                   example: Review deleted successfully
 *       400:
 *         description: Invalid review ID
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
 *                   example: Review ID is required
 *                 error:
 *                   type: string
 *       404:
 *         description: Review not found
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
 *                   example: Review not found
 *                 error:
 *                   type: string
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
 *                   example: Failed to delete review
 *                 error:
 *                   type: string
 */
apiReviewRouter.delete("/:reviewId", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
        error: "Review ID not provided",
      });
    }

    await deleteReview(reviewId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("api-review.ts > DELETE /:reviewId > Error :>>", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
