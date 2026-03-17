import express from "express";
import multer from "multer";
import { z } from "zod";

import { validateSession } from "@/lib/auth";
import { uploadFileBuffer } from "@/lib/cloud-storage/storage-upload";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { getUser } from "@/modules/user";

export const apiUploadRouter = express.Router();
const upload = multer();

// Zod schema for file upload validation
const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  mimetype: z
    .string()
    .refine((type) => ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(type), {
      message: "Invalid file type. Only images are allowed.",
    }),
  size: z.number().max(5 * 1024 * 1024, { message: "File size must be less than 5MB" }),
});

apiUploadRouter.post(
  "/",
  validateSession,
  apiKeyAuth,
  upload.single("image"),
  async (req, res, next) => {
    const userId = res.locals["user"]?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User ID not found in session",
      });
    }

    const user = await getUser(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not found",
      });
    }

    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
          error: "File is required",
        });
      }

      // Validate file using Zod
      const validatedFile = fileUploadSchema.parse(req.file);

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const originalExtension = validatedFile.originalname.split(".").pop();
      const uniqueFileName = `uploads/image-${timestamp}.${originalExtension}`;

      // Upload to Cloudflare storage
      const uploadResult = await uploadFileBuffer(req.file.buffer, uniqueFileName, {
        debug: process.env.NODE_ENV === "development",
        contentType: validatedFile.mimetype,
      });

      // Return upload result
      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          publicUrl: uploadResult.publicUrl,
          path: uploadResult.path,
        },
      });
    } catch (error) {
      console.error("api-upload.ts > image upload > error :>>", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid file",
          errors: error.errors,
        });
      }

      next(error);
    }
  }
);
