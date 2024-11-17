import type { LinkMetadata } from "@prisma/client";
import { randomUUID } from "crypto";

import { env } from "@/env";
import { uploadFileBuffer } from "@/lib/cloud-storage";
import { screenshot } from "@/lib/playwright";

import { getTemplateUrl } from "./thumbnail-utils";

export const templateNames = ["share-template-01-random", "share-template-01-01"] as const;
export type TemplateName = (typeof templateNames)[number];

const deviceSizes = {
  desktop: { width: 1400, height: 1000 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
  mobileLandscape: { width: 844, height: 390 },
};

export type CreateWithTemplateResult = {
  shareImageUrl: string;
  websiteScreenshotUrl?: string;
  metadata?: Partial<LinkMetadata>;
};

export async function createThumbnailByImageUrl(
  imageUrl: string,
  options?: {
    template: TemplateName;
    metadata: Partial<LinkMetadata>;
    device: "desktop" | "tablet" | "mobile";
  }
): Promise<CreateWithTemplateResult> {
  const template = options?.template || "share-template-01-random";

  // create thumbnail
  const templateUrl = getTemplateUrl(template, imageUrl);
  const imageBuffer = await screenshot(templateUrl, {
    type: "png",
    size: {
      width: 1200,
      height: 630,
    },
  });

  // upload to cloudflare r2
  const shareImageUrl = await uploadFileBuffer(imageBuffer, `${randomUUID()}.png`);

  return {
    websiteScreenshotUrl: imageUrl,
    shareImageUrl: shareImageUrl.publicUrl,
    metadata: options?.metadata,
  };
}

export async function captureWebsiteScreenshot(
  url: string,
  options?: { device: "desktop" | "tablet" | "mobile" }
) {
  const device = options?.device || "desktop";
  const screenshotFilePath = `public/uploads/${randomUUID()}.png`;
  const screenshotUrl = `${env.BASE_URL}/${screenshotFilePath.split("public/")[1]}`;
  const websiteScreenshot = await screenshot(url, {
    type: "png",
    size: deviceSizes[device],
    path: screenshotFilePath,
    delayAfterLoad: 2000,
  });
  return { url: screenshotUrl, buffer: websiteScreenshot };
}

/**
 * Create a thumbnail with a template
 * @param url - The URL of the website to screenshot
 * @param options - The options
 * @returns The thumbnail
 */
export async function createThumbnailByWebUrl(
  url: string,
  options?: {
    template: TemplateName;
    metadata: Partial<LinkMetadata>;
    device: "desktop" | "tablet" | "mobile";
  }
): Promise<CreateWithTemplateResult> {
  const device = options?.device || "desktop";

  // create website screenshot
  const screenshot = await captureWebsiteScreenshot(url, { device });
  console.log("screenshot.url :>>", screenshot.url);

  // create thumbnail
  return createThumbnailByImageUrl(screenshot.url, options);
}
