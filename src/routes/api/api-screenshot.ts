import dayjs from "dayjs";
import express from "express";
import { z } from "zod";

import { IsDev } from "@/config";
import { validateSession } from "@/lib/auth";
import { uploadFileBuffer } from "@/lib/cloud-storage";
import { screenshot } from "@/lib/playwright";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import {
  createScreenshot,
  deleteScreenshot,
  getListOfScreenshots,
  getScreenshotById,
  updateScreenshot,
} from "@/modules/screenshot/screenshot-crud";

// Screenshot API Router
// Tag: Screenshot
export const apiScreenshotRouter = express.Router();

// Zod schema for screenshot creation
const ScreenshotRequestSchema = z.object({
  url: z.string().url(),
  fullPage: z.boolean().optional().default(false),
  deviceType: z.enum(["DESKTOP", "MOBILE", "TABLET"]).optional().default("DESKTOP"),
  viewportWidth: z.number().int().min(100).max(3840).optional().default(1400),
  viewportHeight: z.number().int().min(100).max(2160).optional().default(800),
  viewportScale: z.number().min(0.1).max(3).optional().default(1),
  reviewId: z.string().uuid().optional(),
  userId: z.string().uuid(),
});

// Capture a screenshot of a web url
/**
 * @openapi
 * components:
 *   schemas:
 *     ScreenshotCreate:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           format: url
 *           description: Website URL to capture screenshot
 *         fullPage:
 *           type: boolean
 *           default: false
 *           description: Capture full page screenshot
 *         deviceType:
 *           type: string
 *           enum: ["DESKTOP", "MOBILE", "TABLET"]
 *           default: "DESKTOP"
 *           description: Device type for screenshot
 *         viewportWidth:
 *           type: integer
 *           minimum: 100
 *           maximum: 3840
 *           default: 1400
 *           description: Viewport width for screenshot
 *         viewportHeight:
 *           type: integer
 *           minimum: 100
 *           maximum: 2160
 *           default: 800
 *           description: Viewport height for screenshot
 *         viewportScale:
 *           type: number
 *           minimum: 0.1
 *           maximum: 3
 *           default: 1
 *           description: Viewport scale factor
 *         reviewId:
 *           type: string
 *           format: uuid
 *           description: Associated review ID
 *       required:
 *         - url
 *
 *     Screenshot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         url:
 *           type: string
 *           format: url
 *         imageUrl:
 *           type: string
 *           format: url
 *         fullPage:
 *           type: boolean
 *         deviceType:
 *           type: string
 *           enum: ["DESKTOP", "MOBILE", "TABLET"]
 *         viewportWidth:
 *           type: integer
 *         viewportHeight:
 *           type: integer
 *         viewportScale:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/v1/screenshot:
 *   post:
 *     summary: Capture a screenshot of a website
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
 *             $ref: '#/components/schemas/ScreenshotCreate'
 *     responses:
 *       201:
 *         description: Screenshot created successfully
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
 *                   example: Screenshot created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Screenshot'
 *       400:
 *         description: Invalid screenshot data
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
 *                   example: Invalid screenshot data
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to create screenshot
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
 *                   example: Failed to create screenshot
 *                 error:
 *                   type: string
 */
apiScreenshotRouter.post("/", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const userId = res.locals["userId"];
    console.log("api-screenshot.ts > POST / > userId :>>", userId);
    const screenshotData = ScreenshotRequestSchema.parse({ ...req.body, userId });

    // take screenshot
    const imageBuffer = await screenshot(screenshotData.url, { debug: IsDev() });

    // upload to cloudflare r2
    const imageFileName = `screenshots/${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.png`;
    const uploadedImage = await uploadFileBuffer(imageBuffer, imageFileName, { debug: IsDev() });

    // save data to db
    const image = await createScreenshot({ ...screenshotData, imageUrl: uploadedImage.publicUrl });

    res.status(201).json({
      success: true,
      message: "Screenshot created successfully",
      data: image,
    });
  } catch (error) {
    console.error("api-screenshot.ts > POST / > Error :>>", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid screenshot data",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create screenshot",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ScreenshotList:
 *       type: object
 *       properties:
 *         screenshots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Screenshot'
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
 */

/**
 * @openapi
 * /api/v1/screenshot:
 *   get:
 *     summary: Get screenshots by review ID
 *     tags:
 *       - Screenshot
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reviewId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Screenshots retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Failed to retrieve screenshots
 */
apiScreenshotRouter.get("/", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const reviewId = req.query["reviewId"]?.toString();
    const page = parseInt(req.query["page"]?.toString() ?? "1");
    const limit = parseInt(req.query["limit"]?.toString() ?? "10");

    const { screenshots, pagination } = await getListOfScreenshots(
      reviewId ? { reviewId } : {},
      page,
      limit
    );

    res.status(200).json({
      success: true,
      message: "Screenshots retrieved successfully",
      data: {
        screenshots,
        pagination,
      },
    });
  } catch (error) {
    console.error("api-screenshot.ts > GET / > Error :>>", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve screenshots",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/screenshot/{id}:
 *   get:
 *     summary: Get screenshot by ID
 *     tags:
 *       - Screenshot
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Screenshot retrieved successfully
 *       404:
 *         description: Screenshot not found
 *       500:
 *         description: Failed to retrieve screenshot
 */
apiScreenshotRouter.get("/:id", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const screenshot = await getScreenshotById(id);

    res.status(200).json({
      success: true,
      message: "Screenshot retrieved successfully",
      data: screenshot,
    });
  } catch (error) {
    console.error("api-screenshot.ts > GET /:id > Error :>>", error);

    if (error instanceof Error && error.message === "Screenshot not found") {
      return res.status(404).json({
        success: false,
        message: "Screenshot not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve screenshot",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/screenshot/{id}:
 *   put:
 *     summary: Update a screenshot
 *     tags:
 *       - Screenshot
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScreenshotCreate'
 *     responses:
 *       200:
 *         description: Screenshot updated successfully
 *       400:
 *         description: Invalid screenshot data
 *       500:
 *         description: Failed to update screenshot
 */
apiScreenshotRouter.put("/:id", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const screenshotData = ScreenshotRequestSchema.partial().parse(req.body);

    const screenshot = await updateScreenshot(id, screenshotData);

    res.status(200).json({
      success: true,
      message: "Screenshot updated successfully",
      data: screenshot,
    });
  } catch (error) {
    console.error("api-screenshot.ts > PUT /:id > Error :>>", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid screenshot data",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update screenshot",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @openapi
 * /api/v1/screenshot/{id}:
 *   delete:
 *     summary: Delete a screenshot
 *     tags:
 *       - Screenshot
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Screenshot deleted successfully
 *       500:
 *         description: Failed to delete screenshot
 */
apiScreenshotRouter.delete("/:id", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const screenshot = await deleteScreenshot(id);

    res.status(200).json({
      success: true,
      message: "Screenshot deleted successfully",
      data: screenshot,
    });
  } catch (error) {
    console.error("api-screenshot.ts > DELETE /:id > Error :>>", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete screenshot",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
