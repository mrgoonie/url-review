import express from "express";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import {
  deleteReview,
  getReviewById,
  getUserReviews,
  ReviewCreateDataSchema,
  startReview,
  updateReview,
} from "@/modules/review";
import { getUser } from "@/modules/user/get-user";

export const apiReviewRouter = express.Router();

// Create a new review
apiReviewRouter.post("/", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"];
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: "User ID not found in session",
    });
  }

  const user = await getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: `No user found with ID: ${userId}`,
    });
  }

  try {
    // Validate request body
    const validatedData = ReviewCreateDataSchema.parse({ ...req.body, userId });

    // Start the review process
    const review = await startReview(validatedData);

    // Respond with review details
    res.status(201).json({
      success: true,
      message: "Review started successfully",
      data: {
        reviewId: review.id,
        url: review.url,
        status: review.status,
      },
    });
  } catch (error) {
    console.error("api-review.ts > POST / > Error :>>", error);

    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.errors,
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
apiReviewRouter.get("/:reviewId", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"];
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
apiReviewRouter.get("/", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"];
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
apiReviewRouter.patch("/:reviewId", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"];
  const { reviewId } = req.params;

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
        errors: error.errors,
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
apiReviewRouter.delete("/:reviewId", validateSession, apiKeyAuth, async (req, res) => {
  const userId = res.locals["userId"].toString();
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: "User ID not found in session",
    });
  }

  const user = await getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: `No user found with ID: ${userId}`,
    });
  }

  const { reviewId } = req.params;

  try {
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
