import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";

// Zod schema for screenshot validation
const ScreenshotSchema = z.object({
  url: z.string().url(),
  imageUrl: z.string().url(),
  fullPage: z.boolean().default(false).optional(),
  deviceType: z.enum(["DESKTOP", "MOBILE", "TABLET"]).default("DESKTOP").optional(),
  viewportWidth: z.number().int().min(100).max(3840).default(1400).optional(),
  viewportHeight: z.number().int().min(100).max(2160).default(800).optional(),
  viewportScale: z.number().min(0.1).max(3).default(1).optional(),
  reviewId: z.string().uuid().optional(),
});
// export const ScreenshotCreateDataSchema = ScreenshotSchema.omit({ reviewId: true });
export type ScreenshotCreateData = z.infer<typeof ScreenshotSchema>;

// Create a new screenshot
export async function createScreenshot(data: ScreenshotCreateData) {
  try {
    const validatedData = ScreenshotSchema.parse(data);

    const screenshot = await prisma.screenshot.create({
      data: validatedData,
    });

    console.log("screenshot-crud.ts > createScreenshot() > screenshot :>>", screenshot);
    return screenshot;
  } catch (error) {
    console.error("screenshot-crud.ts > createScreenshot() > Error :>>", error);
    throw error;
  }
}

// Get screenshot by ID
export async function getScreenshotById(id: string) {
  try {
    const screenshot = await prisma.screenshot.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!screenshot) {
      throw new Error("Screenshot not found");
    }

    return screenshot;
  } catch (error) {
    console.error("screenshot-crud.ts > getScreenshotById() > Error :>>", error);
    throw error;
  }
}

// Get screenshots by review ID
export async function getScreenshotsByReviewId(reviewId: string, page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;

    const [screenshots, total] = await Promise.all([
      prisma.screenshot.findMany({
        where: { reviewId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.screenshot.count({ where: { reviewId } }),
    ]);

    return {
      screenshots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("screenshot-crud.ts > getScreenshotsByReviewId() > Error :>>", error);
    throw error;
  }
}

// Get list of screenshots
export async function getListOfScreenshots(
  filter: Prisma.ScreenshotWhereInput,
  page = 1,
  limit = 10
) {
  try {
    const offset = (page - 1) * limit;

    const [screenshots, total] = await Promise.all([
      prisma.screenshot.findMany({
        where: filter,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.screenshot.count({ where: filter }),
    ]);

    return {
      screenshots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("screenshot-crud.ts > getListOfScreenshots() > Error :>>", error);
    throw error;
  }
}

// Update a screenshot
export async function updateScreenshot(
  id: string,
  data: Partial<z.infer<typeof ScreenshotSchema>>
) {
  try {
    const validatedData = ScreenshotSchema.partial().parse(data);

    const screenshot = await prisma.screenshot.update({
      where: { id },
      data: validatedData,
    });

    console.log("screenshot-crud.ts > updateScreenshot() > screenshot :>>", screenshot);
    return screenshot;
  } catch (error) {
    console.error("screenshot-crud.ts > updateScreenshot() > Error :>>", error);
    throw error;
  }
}

// Delete a screenshot
export async function deleteScreenshot(id: string) {
  try {
    const screenshot = await prisma.screenshot.delete({
      where: { id },
    });

    console.log("screenshot-crud.ts > deleteScreenshot() > screenshot :>>", screenshot);
    return screenshot;
  } catch (error) {
    console.error("screenshot-crud.ts > deleteScreenshot() > Error :>>", error);
    throw error;
  }
}
