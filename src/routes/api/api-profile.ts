import express from "express";

import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { maskUser } from "@/modules/user";
import { getUser } from "@/modules/user/get-user";

export const apiProfileRouter = express.Router();

apiProfileRouter.get("/", validateSession, apiKeyAuth, async (_, res) => {
  try {
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

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: maskUser(user),
    });
  } catch (error) {
    console.error("api-profile > GET / > error :>>", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
