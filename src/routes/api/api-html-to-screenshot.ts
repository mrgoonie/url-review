import { randomUUID } from "crypto";
import dayjs from "dayjs";
import express from "express";
import multer from "multer";
import path from "path";
import { z } from "zod";

import { env } from "@/env";
import { validateSession } from "@/lib/auth";
import { uploadFileBuffer } from "@/lib/cloud-storage";
import { renderHtmlToScreenshot, renderServedHtmlToScreenshot } from "@/lib/playwright";
import { extractZipToTempDir } from "@/lib/utils/extract-zip-to-temp-dir";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { checkPlanLimits } from "@/middlewares/check-plan-limits";

export const apiHtmlToScreenshotRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// --- Zod Schemas ---

const ViewportSchema = z.object({
  width: z.number().int().min(100).max(3840).default(1400),
  height: z.number().int().min(100).max(2160).default(800),
});

const HtmlBodySchema = z.object({
  html: z.string().min(1),
  viewport: ViewportSchema.optional(),
  fullPage: z.boolean().optional().default(false),
  output: z.enum(["url", "buffer"]).optional().default("url"),
  type: z.enum(["png", "jpeg"]).optional().default("png"),
  quality: z.number().min(1).max(100).optional(),
  delayAfterLoad: z.number().min(0).max(30000).optional().default(0),
});

const ZipFormSchema = z.object({
  fullPage: z.enum(["true", "false"]).optional().default("false"),
  output: z.enum(["url", "buffer"]).optional().default("url"),
  entryFile: z.string().optional().default("index.html"),
  type: z.enum(["png", "jpeg"]).optional().default("png"),
  quality: z.string().regex(/^\d+$/).optional(),
  delayAfterLoad: z.string().regex(/^\d+$/).optional(),
});

// --- Helpers ---

/** Sanitize entryFile to prevent directory traversal */
function sanitizeEntryFile(entryFile: string): string {
  const normalized = path.normalize(entryFile).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.startsWith("/") || normalized.startsWith("\\")) {
    return normalized.slice(1);
  }
  return normalized;
}

/** Send output as R2 URL or direct image buffer */
async function sendOutput(
  res: express.Response,
  buffer: Buffer,
  output: string,
  type: string
) {
  if (output === "buffer") {
    res.set("Content-Type", type === "jpeg" ? "image/jpeg" : "image/png");
    return res.send(buffer);
  }

  // Upload to R2 (UUID suffix prevents filename collisions on concurrent requests)
  const ext = type === "jpeg" ? "jpg" : "png";
  const fileName = `html-screenshots/${dayjs().format("YYYY-MM-DD_HH-mm-ss")}-${randomUUID().slice(0, 8)}.${ext}`;
  const uploaded = await uploadFileBuffer(buffer, fileName);

  return res.status(201).json({
    success: true,
    message: "Screenshot created successfully",
    data: { imageUrl: uploaded.publicUrl },
  });
}

// --- Route ---

/**
 * @openapi
 * components:
 *   schemas:
 *     HtmlToScreenshotHtmlBody:
 *       type: object
 *       properties:
 *         html:
 *           type: string
 *           description: Raw HTML string to render
 *           required: true
 *         viewport:
 *           type: object
 *           properties:
 *             width:
 *               type: integer
 *               minimum: 100
 *               maximum: 3840
 *               default: 1400
 *             height:
 *               type: integer
 *               minimum: 100
 *               maximum: 2160
 *               default: 800
 *         fullPage:
 *           type: boolean
 *           default: false
 *         output:
 *           type: string
 *           enum: ["url", "buffer"]
 *           default: "url"
 *           description: '"url" uploads to R2 and returns URL, "buffer" returns image binary'
 *         type:
 *           type: string
 *           enum: ["png", "jpeg"]
 *           default: "png"
 *         quality:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: JPEG quality (only used when type is jpeg)
 *         delayAfterLoad:
 *           type: number
 *           minimum: 0
 *           maximum: 30000
 *           default: 0
 *           description: Delay in ms after page load before screenshot
 *       required:
 *         - html
 */

/**
 * @openapi
 * /api/v1/html-to-screenshot:
 *   post:
 *     summary: Render HTML or ZIP to screenshot
 *     description: >
 *       Accept raw HTML string (JSON body) or ZIP file (multipart form)
 *       containing HTML/CSS/JS/assets, render via headless browser,
 *       and return screenshot as R2 URL or image buffer.
 *     tags:
 *       - Screenshot
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HtmlToScreenshotHtmlBody'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: ZIP file (max 50MB)
 *               viewport:
 *                 type: string
 *                 description: 'JSON string: {"width": 1400, "height": 800}'
 *               fullPage:
 *                 type: string
 *                 enum: ["true", "false"]
 *               output:
 *                 type: string
 *                 enum: ["url", "buffer"]
 *               entryFile:
 *                 type: string
 *                 default: "index.html"
 *               type:
 *                 type: string
 *                 enum: ["png", "jpeg"]
 *               quality:
 *                 type: string
 *               delayAfterLoad:
 *                 type: string
 *             required:
 *               - file
 *     responses:
 *       201:
 *         description: Screenshot created (output=url)
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
 *                     imageUrl:
 *                       type: string
 *                       format: url
 *       200:
 *         description: Screenshot buffer (output=buffer)
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Failed to render screenshot
 */
apiHtmlToScreenshotRouter.post(
  "/",
  validateSession,
  apiKeyAuth,
  checkPlanLimits,
  upload.single("file"),
  async (req, res) => {
    let cleanup: (() => void) | null = null;

    try {
      if (req.file) {
        // --- ZIP FILE INPUT ---

        // Validate ZIP magic bytes (PK header: 0x50 0x4B)
        if (
          req.file.buffer.length < 4 ||
          req.file.buffer[0] !== 0x50 ||
          req.file.buffer[1] !== 0x4b
        ) {
          return res.status(400).json({
            success: false,
            message: "File does not appear to be a valid ZIP archive.",
          });
        }

        // Validate form fields with Zod
        const formFields = ZipFormSchema.parse(req.body);

        // Parse viewport JSON separately with error handling
        let viewport;
        if (req.body.viewport) {
          try {
            viewport = ViewportSchema.parse(JSON.parse(req.body.viewport));
          } catch {
            return res.status(400).json({
              success: false,
              message: "Invalid viewport JSON. Expected: {\"width\": number, \"height\": number}",
            });
          }
        }

        const entryFile = sanitizeEntryFile(formFields.entryFile);
        const type = formFields.type as "png" | "jpeg";
        const quality = formFields.quality ? parseInt(formFields.quality) : undefined;
        const delayAfterLoad = formFields.delayAfterLoad ? parseInt(formFields.delayAfterLoad) : 0;

        // Extract ZIP to temp directory
        const extracted = await extractZipToTempDir(req.file.buffer);
        cleanup = extracted.cleanup;

        // Build serve URL — served via Express static at /tmp-render
        const sessionId = extracted.extractDir.split("/").pop();
        const serveUrl = `http://localhost:${env.PORT}/tmp-render/${sessionId}/${entryFile}`;

        // Render screenshot
        const imageBuffer = await renderServedHtmlToScreenshot(serveUrl, {
          viewport,
          fullPage: formFields.fullPage === "true",
          type,
          quality,
          delayAfterLoad,
        });

        // Cleanup temp files immediately after screenshot
        cleanup();
        cleanup = null;

        return await sendOutput(res, imageBuffer, formFields.output, type);
      } else {
        // --- HTML STRING INPUT ---
        const body = HtmlBodySchema.parse(req.body);

        const imageBuffer = await renderHtmlToScreenshot(body.html, {
          viewport: body.viewport,
          fullPage: body.fullPage,
          type: body.type,
          quality: body.quality,
          delayAfterLoad: body.delayAfterLoad,
        });

        return await sendOutput(res, imageBuffer, body.output, body.type);
      }
    } catch (error) {
      // Always cleanup on error
      if (cleanup) cleanup();

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: error.errors.map((e) => e.message),
        });
      }

      console.error("api-html-to-screenshot > POST / > Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to render screenshot",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
