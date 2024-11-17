import express from "express";
import { z } from "zod";

import { prisma } from "@/lib/db";

// Base URL: /api/v1/payments
const router = express.Router();

// Define the schema for the topup request
const topupSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
});

// Topup route
router.post("/topup", async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = topupSchema.parse(req.body);

    // Here you would implement the logic to process the topup
    console.log("api-payment > topup() > validatedData :>>", validatedData);

    // If success, update the user balance
    await prisma.user.update({
      where: { id: validatedData.userId },
      data: { balance: { increment: validatedData.amount } },
    });

    // Respond with success
    res.status(200).json({ message: "Topup successful", data: validatedData });
  } catch (error) {
    next(error); // Pass the error to the next middleware
  }
});

export const paymentRouter = router;
