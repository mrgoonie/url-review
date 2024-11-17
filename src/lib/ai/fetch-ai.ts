import axios from "axios";
import { z } from "zod";

import { env } from "@/env";

export const OPENROUTER_BASE_API_URL = "https://openrouter.ai/api/v1";
export const APP_MODELS = [
  "google/gemini-flash-1.5",
  "google/gemini-pro-1.5",
  "anthropic/claude-3-haiku",
];

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
  model: z.string().optional().describe(`The model used for completion.`),
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
  timeout?: number;
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
  const { model, models, messages, ...otherParams } = params;
  const { debug = false, timeout = 5 * 60 * 1000 } = options;

  const url = `${OPENROUTER_BASE_API_URL}/chat/completions`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.OPENROUTER_KEY}`,
    "HTTP-Referer": `${env.BASE_URL}`,
    "X-Title": `${env.SITE_NAME} (${env.NODE_ENV})`,
  };

  const data: any = {
    messages,
    stream: params.stream,
    ...otherParams,
  };

  // if no model or models provided, use default APP_MODELS
  if (!model && !models) data.models = APP_MODELS;

  if (debug) {
    console.log("Fetch AI Request:", { url, headers });
    console.dir(data, { depth: 10 });
  }

  try {
    if (params.stream) {
      return await axios({
        method: "POST",
        url,
        headers,
        data,
        timeout,
        responseType: "stream",
      });
    }

    const response = await axios({
      method: "POST",
      url,
      headers,
      data,
      timeout,
      responseType: "json",
    });

    if (response.data.error) throw new FetchAiError(JSON.parse(response.data.error.message).error);

    return response.data as AskAiResponse;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") throw new Error("Request timed out");
      console.error(error);
      throw new Error(`HTTP error! status: ${error.response?.status}, message: ${error.message}`);
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
