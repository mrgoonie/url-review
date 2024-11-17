import type { VisionModel } from "@/lib/ai";
import { analyzeImageBase64 } from "@/lib/ai/analyze-image";
import { screenshot } from "@/lib/playwright";
import { bufferToBase64 } from "@/lib/utils";

const jsonResponseFormat = `{
  // Whether the image contains harmful content
  "isHarmful": boolean,
  // The reason why the image is harmful
  "reason": string,
  // The score of the image, from 0 to 100
  "score": number
}`;

export async function reviewUrlByCaptureWebUrl(
  params: { url: string },
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
  }
) {
  const { url } = params;

  // 1. Take screenshot
  const image = await screenshot(url, { delayAfterLoad: options?.delayAfterLoad ?? 3000 });
  const base64 = await bufferToBase64(image);

  // 2. Run AI analysis on screenshot
  const systemPrompt = `You are an image checker and detector of harmful content, including sexual content, political, religious, gender, racial discrimination, etc.`;
  const instructions = `Analyze the image and determine if it contains harmful content.`;
  const imageAnalysis = await analyzeImageBase64(
    {
      base64,
      systemPrompt,
      instructions,
    },
    { model: options?.model ?? "google/gemini-flash-1.5-8b", jsonResponseFormat }
  );
  if (options?.debug) console.log("imageAnalysis :>> ", imageAnalysis);

  // 3. Return results
  return { ...imageAnalysis, base64, image };
}
