import axios from "axios";
import axiosRetry from "axios-retry";
import { z } from "zod";

import { env } from "@/env";

import { calculateAiCostByUsage } from "../utils";

// Retry configuration
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

export const OPENROUTER_BASE_API_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_AI_MODELS = [
  "google/gemini-2.5-flash-preview",
  "openai/gpt-4.1-mini",
  "google/gemini-2.0-flash-001",
  "google/gemini-2.0-flash-lite-001",
  "google/gemini-flash-1.5",
  "google/gemini-flash-1.5-8b",
  "google/gemini-pro-1.5",
  "google/gemini-2.5-pro-preview-03-25",
  "openai/chatgpt-4o-latest",
  "openai/gpt-4o-mini",
  "anthropic/claude-3-5-haiku",
  "anthropic/claude-3.5-sonnet",
  "meta-llama/llama-4-maverick",
  "meta-llama/llama-4-scout",
  "meta-llama/llama-3.2-3b-instruct",
  "meta-llama/llama-3.1-70b-instruct:nitro",
  "perplexity/llama-3.1-sonar-large-128k-chat",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "qwen/qwen-turbo",
  "qwen/qwen-2.5-coder-32b-instruct",
  "qwen/qwen-2.5-72b-instruct",
  "eva-unit-01/eva-qwen-2.5-32b",
] as const;
export const TextModelSchema = z.enum(DEFAULT_AI_MODELS);
export type TextModel = z.infer<typeof TextModelSchema>;

export const DEFAULT_VISION_MODELS = [
  "google/gemini-pro-1.5",
  "google/gemini-pro-vision",
  "google/gemini-flash-1.5",
  "google/gemini-flash-1.5-8b",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "openai/chatgpt-4o-latest",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.2-90b-vision-instruct",
  "meta-llama/llama-3.2-11b-vision-instruct",
  "qwen/qwen-2-vl-72b-instruct",
] as const;
export const VisionModelSchema = z.enum(DEFAULT_VISION_MODELS);
export type VisionModel = z.infer<typeof VisionModelSchema>;

export const AskAiMessageContentSchema = z.union([
  z.string(),
  z.object({ type: z.enum(["text"]), text: z.string() }),
  z.object({
    type: z.enum(["image_url"]),
    image_url: z.union([z.string(), z.object({ url: z.string(), detail: z.string().optional() })]),
  }),
  z.array(
    z.union([
      z.object({ type: z.enum(["text"]), text: z.string() }),
      z.object({
        type: z.enum(["image_url"]),
        image_url: z.union([
          z.string(),
          z.object({ url: z.string(), detail: z.string().optional() }),
        ]),
      }),
    ])
  ),
]);
export type AskAiMessageContent = z.infer<typeof AskAiMessageContentSchema>;
export const AskAiMessageSchema = z.object({
  role: z.enum(["system", "assistant", "user"]),
  content: AskAiMessageContentSchema,
});
export type AskAiMessage = z.infer<typeof AskAiMessageSchema>;

export const AskAiParamsSchema = z.object({
  model: TextModelSchema.or(VisionModelSchema)
    .optional()
    .describe(`The model used for completion.`),
  models: z.array(z.string()).optional().describe(`Fallback AI models routing.`),
  messages: z.array(AskAiMessageSchema).describe(`Array of messages.`),
  stream: z.boolean().default(false).optional(),
  // Range: [0, 2]
  temperature: z.number().min(0).max(2).default(1).optional(),
  response_format: z.object({ type: z.string() }).optional(),
  max_tokens: z.number().optional(),
  frequency_penalty: z.number().optional(),
  top_p: z.number().optional(),
});
export type AskAiParams = z.infer<typeof AskAiParamsSchema>;

export const AskAiResponseUsageSchema = z.object({
  /** Including images and tools if any */
  prompt_tokens: z.number(),
  /** The tokens generated */
  completion_tokens: z.number(),
  /** Sum of the above two fields */
  total_tokens: z.number(),
  /** The total cost of the request */
  total_cost: z.number().optional(),
});
export type AskAiResponseUsage = z.infer<typeof AskAiResponseUsageSchema>;

export const AskAiErrorSchema = z.object({
  // See "Error Handling" section
  code: z.number(),
  message: z.string(),
});
export type AskAiError = z.infer<typeof AskAiErrorSchema>;

export const AskAiResponseChoiceSchema = z.object({
  finish_reason: z.string().nullable(),
  message: z.object({
    content: z.string().nullable(),
    role: z.string(),
  }),
  error: AskAiErrorSchema.optional(),
});
export type AskAiResponseChoice = z.infer<typeof AskAiResponseChoiceSchema>;

export const AskAiResponseSchema = z.object({
  id: z.string(),
  // Depending on whether you set "stream" to "true" and
  // whether you passed in "messages" or a "prompt", you
  // will get a different output shape
  choices: z.array(AskAiResponseChoiceSchema),
  created: z.number(), // Unix timestamp
  model: z.string(),
  object: z.enum(["chat.completion", "chat.completion.chunk"]),

  system_fingerprint: z.string(), // Only present if the provider supports it

  // Usage data is always returned for non-streaming.
  // When streaming, you will get one usage object at
  // the end accompanied by an empty choices array.
  usage: AskAiResponseUsageSchema,
});
export type AskAiResponse = z.infer<typeof AskAiResponseSchema>;

export const ParamsResponseSchema = z.object({
  data: z.object({
    model: z.string(),
    supported_parameters: z.array(z.string()),
    frequency_penalty_p10: z.number(),
    frequency_penalty_p50: z.number(),
    frequency_penalty_p90: z.number(),
    min_p_p10: z.number(),
    min_p_p50: z.number(),
    min_p_p90: z.number(),
    presence_penalty_p10: z.number(),
    presence_penalty_p50: z.number(),
    presence_penalty_p90: z.number(),
    repetition_penalty_p10: z.number(),
    repetition_penalty_p50: z.number(),
    repetition_penalty_p90: z.number(),
    temperature_p10: z.number(),
    temperature_p50: z.number(),
    temperature_p90: z.number(),
    top_a_p10: z.number(),
    top_a_p50: z.number(),
    top_a_p90: z.number(),
    top_k_p10: z.number(),
    top_k_p50: z.number(),
    top_k_p90: z.number(),
    top_p_p10: z.number(),
    top_p_p50: z.number(),
    top_p_p90: z.number(),
  }),
});
export type ParamsResponse = z.infer<typeof ParamsResponseSchema>;

/**
 * This API lets you query the top LLM sampling parameter configurations used by users on OpenRouter.
 * @param model - LLM model ID
 */
export async function getParams(model: string) {
  const response = await fetch(`https://openrouter.ai/api/v1/parameters/${model}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_KEY}`,
      "HTTP-Referer": `${env.BASE_URL}`, // Optional, for including your app on openrouter.ai rankings.
      "X-Title": `${env.SITE_NAME} (${env.NODE_ENV})`, // Optional. Shows in rankings on openrouter.ai.
      "Content-Type": "application/json",
    },
  });
  const { data } = (await response.json()) as ParamsResponse;
  return data;
}

export function extractContent(content: AskAiMessageContent): string {
  if (typeof content === "string") {
    return content;
  } else if ("text" in content) {
    return content.text;
  } else if ("image_url" in content) {
    return typeof content.image_url === "string" ? content.image_url : content.image_url.url;
  }
  return "";
}

export interface FetchAiOptions {
  debug?: boolean;
  /**
   * Timeout for the request
   * @default 5 minutes
   */
  timeout?: number;
  /**
   * Number of retries for the request
   * @default 3
   */
  maxRetries?: number;
}

export class FetchAiError extends Error {
  public readonly code: number;
  public readonly status: string;

  constructor(options: { code: number; message: string; status: string }) {
    super(options.message);
    this.name = "FetchAiError";
    this.code = options.code;
    this.status = options.status;
  }
}

export async function fetchAi(params: AskAiParams, options: FetchAiOptions = {}) {
  const { model, models, messages, stream = false, ...otherParams } = params;
  const { debug = false, timeout = 5 * 60 * 1000, maxRetries = 3 } = options;

  // re-configure axios retry if needed
  if (maxRetries !== 3)
    axiosRetry(axios, { retries: maxRetries, retryDelay: axiosRetry.exponentialDelay });

  const url = `${OPENROUTER_BASE_API_URL}/chat/completions`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.OPENROUTER_KEY}`,
    "HTTP-Referer": `${env.BASE_URL}`,
    "X-Title": `${env.SITE_NAME} (${env.NODE_ENV})`,
  };

  const data: any = {
    messages,
    stream,
    ...otherParams,
  };

  // if no model or models provided, use default APP_MODELS
  if (!model && !models) data.models = DEFAULT_AI_MODELS.slice(0, 3);
  if (models) data.models = models;
  if (model) data.models = [model, ...DEFAULT_AI_MODELS.slice(0, 2)];

  if (debug) {
    console.log("Fetch AI Request:", { url, headers });
    console.dir(data, { depth: 10 });
  }

  try {
    // stream response
    if (stream) {
      return await axios({
        method: "POST",
        url,
        headers,
        data,
        timeout,
        responseType: "stream",
      });
    }

    // non-stream response
    const response = await axios({
      method: "POST",
      url,
      headers,
      data,
      timeout,
      responseType: "json",
    });

    if (response.data.error) throw new FetchAiError(JSON.parse(response.data.error.message).error);

    const responseData = response.data as AskAiResponse;

    // calculate total cost
    const totalCost = calculateAiCostByUsage(responseData.model, responseData.usage);
    responseData.usage.total_cost = totalCost;

    return responseData;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") throw new Error("Request timed out");
      console.error(error);
      const errorData = error.response?.data;
      throw new Error(
        `HTTP error! status: ${error.response?.status}, message: ${error.message}, data: ${
          errorData ? JSON.stringify(errorData, null, 2) : "<no data>"
        }`
      );
    }
    throw error;
  }
}

/**
 * @example
 * {
  "model": "meta-llama/llama-3.1-8b-instruct:free",
  "messages": [
    {
      "role": "system",
      "content": "you are a helpful assistant"
    },
    {
      "role": "user",
      "content": "how are you?"
    }
  ],
  "stream": false,
  "temperature": 1
}
 */
