import dayjs from "dayjs";

import { IsDev } from "@/config";
import type { VisionModel } from "@/lib/ai";
import { analyzeImageBase64 } from "@/lib/ai/analyze-image";
import { uploadFileBuffer } from "@/lib/cloud-storage";
import { screenshot } from "@/lib/playwright";
import { bufferToBase64 } from "@/lib/utils";

import { createScreenshot } from "../screenshot/screenshot-crud";

const jsonResponseFormat = `{
  // Whether the image contains harmful content
  "isHarmful": boolean,
  // The reason why the image is harmful
  "reason": string,
  // The score of the image, from 0 to 100
  "score": number
}`;

export async function reviewUrlByCaptureWebUrl(
  params: { url: string; reviewId?: string },
  options?: {
    debug?: boolean;
    /**
     * @default "google/gemini-flash-1.5-8b"
     */
    model?: VisionModel;
    /**
     * @default 3000
     */
    delayAfterLoad?: number;
    /**
     * Timeout in milliseconds
     * @default 60_000
     */
    timeout?: number;
  }
) {
  const { url } = params;

  // 1. Take screenshot
  const image = await screenshot(url, {
    delayAfterLoad: options?.delayAfterLoad ?? 3000,
    timeout: options?.timeout ?? 60_000,
  });
  const base64 = await bufferToBase64(image);
  // if (options?.debug) console.log("reviewUrlByCaptureWebUrl() > base64 :>> ", base64);

  // 2. Upload to cloud storage & save screenshot to database
  const imageFileName = `screenshots/${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.png`;
  const uploadedImage = await uploadFileBuffer(image, imageFileName, { debug: IsDev() });
  const screenshotRecord = await createScreenshot({
    url,
    imageUrl: uploadedImage.publicUrl,
    reviewId: params.reviewId,
  });
  if (options?.debug)
    console.log("reviewUrlByCaptureWebUrl() > screenshotRecord :>> ", screenshotRecord);

  // 3. Run AI analysis on screenshot
  const systemPrompt = `You are an image checker and detector of harmful content, including sexual content, political, religious, gender, racial discrimination, etc.`;
  const instructions = `Analyze the image and determine if it contains harmful content.`;
  const imageAnalysis = await analyzeImageBase64(
    {
      base64,
      systemPrompt,
      instructions,
    },
    { model: options?.model, jsonResponseFormat }
  );
  if (options?.debug) console.log("imageAnalysis :>> ", imageAnalysis);

  // 3. Return results
  return { ...imageAnalysis, base64, image, screenshot: screenshotRecord };
}
