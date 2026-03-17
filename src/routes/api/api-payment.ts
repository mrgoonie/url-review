import express from "express";
import { z } from "zod";

import { prisma } from "@/lib/db";

// Base URL: /api/v1/payments
export const apiPaymentRouter = express.Router();

// Define the schema for the topup request
const topupSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
});

// Topup route
apiPaymentRouter.post("/topup", async (req, res) => {
  try {
    // Validate request body
    const validatedData = topupSchema.parse(req.body);

    // Here you would implement the logic to process the topup
    console.log("api-payment > topup() > validatedData :>>", validatedData);

    // If success, update the user balance
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: { balance: { increment: validatedData.amount } },
      select: { id: true, balance: true },
    });

    // Respond with success following standard API response
    res.status(201).json({
      success: true,
      message: "Topup successful",
      data: {
        userId: updatedUser.id,
        newBalance: updatedUser.balance,
      },
    });
  } catch (error) {
    console.error("api-payment > topup() > error :>>", error);

    // Handle different types of errors with appropriate status codes
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});
