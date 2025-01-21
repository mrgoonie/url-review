import { z } from "zod";

import { getHtmlContent } from "@/lib/playwright/get-html";

import { type AskAiResponse, fetchAi, TextModelSchema } from "./fetch-ai";
import { validateJson } from "./json-validator";

export const AnalyzeUrlSchema = z.object({
  url: z.string().url().describe("The website URL to analyze"),
  systemPrompt: z.string().optional().describe("A prompt for the AI to follow"),
  instructions: z.string().optional().describe("Additional instructions for the AI"),
});

export type AnalyzeUrlInput = z.infer<typeof AnalyzeUrlSchema>;

export const AnalyzeUrlOptionsSchema = z
  .object({
    model: TextModelSchema.optional().describe("The AI model to use"),
    jsonResponseFormat: z.string().optional().describe("A JSON response format for the AI"),
    delayAfterLoad: z.number().optional().describe("Delay after loading the website"),
    debug: z.boolean().optional().describe("Print debug logs"),
  })
  .optional();

export type AnalyzeUrlOptions = z.infer<typeof AnalyzeUrlOptionsSchema>;

export const DEFAULT_JSON_RESPONSE_FORMAT = JSON.stringify({
  properties: {
    isAppropriate: {
      type: "boolean",
      description: "Whether the content is appropriate based on the instructions",
    },
    isHarmful: { type: "boolean" },
    reason: { type: "string" },
    score: {
      type: "number",
      minimum: 0,
      maximum: 10,
      description:
        "Appropriateness score based on the scale of 0 to 10, where 0 is not appropriate and 10 is appropriate",
    },
    harmfulContentTypes: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "appropiated_category",
          "sexual_content",
          "hate_speech",
          "violence",
          "discrimination",
          "explicit_language",
          "political_extremism",
          "misinformation",
        ],
      },
    },
  },
});

export async function analyzeUrl(input: AnalyzeUrlInput, options?: AnalyzeUrlOptions) {
  // Validate input
  const validatedInput = AnalyzeUrlSchema.parse(input);
  const validatedOptions = AnalyzeUrlOptionsSchema.parse(options);

  // Fetch website content using Playwright
  let websiteContent = "";
  try {
    const htmlContent = await getHtmlContent(validatedInput.url, {
      delayAfterLoad: validatedOptions?.delayAfterLoad ?? 3000,
    });

    // If htmlContent is an array, join the contents
    websiteContent = Array.isArray(htmlContent) ? htmlContent.join("\n") : htmlContent;

    // Remove HTML tags and trim
    websiteContent = websiteContent.replace(/<[^>]*>/g, "").trim();

    // Limit content length to prevent excessive token usage
    // websiteContent = websiteContent.slice(0, 15000);
  } catch (error) {
    throw new Error(
      `Failed to fetch website content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Set default prompts for harmful content detection
  const systemPrompt = `You are an AI content safety detector specialized in identifying harmful, inappropriate, or dangerous website content.`;
  const instructions = validatedInput.instructions
    ? `${validatedInput.instructions}
  ## JSON Response Format:
  \`\`\`
  ${validatedOptions?.jsonResponseFormat ?? DEFAULT_JSON_RESPONSE_FORMAT}
  \`\`\`
  ## Here is the website content:
  ${websiteContent}`
    : `Carefully analyze the website content and detect any harmful elements:
  
  ## Harmful Content Detection Instructions:
  - Thoroughly scan the content for potentially harmful material
  - Identify specific types of harmful content
  - Provide a comprehensive safety assessment
  - Return a structured JSON object based on this format:
  ## JSON Response Format:
  \`\`\`
  ${validatedOptions?.jsonResponseFormat ?? DEFAULT_JSON_RESPONSE_FORMAT}
  \`\`\`

  ## Specific Areas to Evaluate:
  - Sexual or explicit content
  - Hate speech or discriminatory language
  - Violent or graphic descriptions
  - Political extremism
  - Misinformation or dangerous propaganda
  - Explicit or offensive language
  
  ## Here is the website content:
  ${websiteContent}`;

  // Fetch AI analysis
  const response = (await fetchAi({
    stream: false,
    model: validatedOptions?.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: instructions },
    ],
  })) as AskAiResponse;

  const responseContent = response.choices[0].message.content;
  if (!responseContent)
    throw new Error(response.choices[0].error?.message ?? "No response content found");

  // Validate and parse JSON response
  const jsonResponse = await validateJson(responseContent, {
    model: "google/gemini-flash-1.5-8b",
    maxRetries: 5,
    parse: true,
  });

  return { data: jsonResponse, usage: response.usage, model: response.model };
}
