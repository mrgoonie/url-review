import axios from "axios";
import { toFloat } from "diginext-utils/dist/object";
import { z } from "zod";

import { redis } from "@/lib/cache";

import { sortToFirst } from "../utils/array";
import { retry } from "../utils/retry";

export const AiModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pricing: z.object({
    prompt: z.string(),
    completion: z.string(),
    image: z.string(),
  }),
  context_length: z.number(),
  architecture: z.object({
    tokenizer: z.string(),
    instruct_type: z.string(),
  }),
  top_provider: z.object({
    max_completion_tokens: z.number(),
  }),
  per_request_limits: z.object({
    prompt_tokens: z.string(),
    completion_tokens: z.string(),
  }),
});

export type AIModel = z.infer<typeof AiModelSchema>;

export const OPENROUTER_BASE_API_URL = "https://openrouter.ai/api/v1";
export let aiModels: AIModel[] = [];
export let aiVisionModels: AIModel[] = [];
export let defaultAiModelName = "google/gemini-flash-1.5";

export const aiProviders = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Azure",
  "Mistral",
  "Perplexity",
  "OctoAI",
  "Fireworks",
  "Cohere",
  "Groq",
  "DeepInfra",
  "Novita",
  "DeepSeek",
  "Lepton",
  "Together",
  "Modal",
  "AnyScale",
  "Replicate",
  "HuggingFace",
  "Featherless",
  "Mancer",
  "Mancer 2",
  "Lynn 2",
  "Lynn",
] as const;
export type AIProvider = (typeof aiProviders)[number];

export async function fetchListAIModels() {
  try {
    // get "aiModels" & "aiVisionModels" from redis (if redis is available)
    if (redis) {
      const aiModelsCache = await redis.get("aiModels");
      const aiVisionModelsCache = await redis.get("aiVisionModels");
      if (aiVisionModelsCache) aiVisionModels = JSON.parse(aiVisionModelsCache);
      if (aiModelsCache) {
        aiModels = JSON.parse(aiModelsCache);
        return aiModels;
      }
    }

    // const cacheFilePath = path.resolve(STORAGE_PATH, 'models.json');
    let res = await retry(() => axios.get(`${OPENROUTER_BASE_API_URL}/models`), 5);

    const { data: responseData } = res;

    /**
     * Need to filter out some models, since Discord only support max. 25 choices
     * - Source: https://openrouter.ai/api/v1/models
     */
    const _list = [...responseData.data].filter(
      (item) =>
        (item.id.indexOf("google/gem") > -1 ||
          item.id.indexOf("meta-llama/llama") > -1 ||
          item.id.indexOf("mistralai/mixtral") > -1 ||
          item.id.indexOf("openai/gpt-3.5-turbo-16k") > -1 ||
          item.id.indexOf("openai/gpt-4-turbo-preview") > -1 ||
          item.id.indexOf("openai/gpt-4-32k") > -1 ||
          item.id.indexOf("openai/gpt-4o") > -1 ||
          item.id.indexOf("gryphe/mythomax") > -1 ||
          item.id.indexOf("databricks/dbrx") > -1 ||
          item.id.indexOf("mistralai/mistral") > -1 ||
          item.id.indexOf("nousresearch/") > -1 ||
          item.id.indexOf("deepseek/") > -1 ||
          item.id.indexOf("perplexity/") > -1 ||
          item.id.indexOf("01-ai/") > -1 ||
          item.id.indexOf("microsoft/wizardlm") > -1 ||
          item.id.indexOf("cohere/command-r") > -1 ||
          item.id.indexOf("qwen/qwen") > -1 ||
          item.id.indexOf("anthropic/claude-3") > -1) &&
        // exclude "free" models
        item.id.indexOf(":free") === -1 &&
        // exclude "beta" models
        item.id.indexOf(":beta") === -1 &&
        // exclude "old" models
        item.id.indexOf("-0314") === -1 &&
        // exclude "vision" models
        item.id.indexOf("vision") === -1
    ) as AIModel[];

    // sort models
    let models = sortToFirst(_list.sort(), "id", "meta");
    models = sortToFirst(_list.sort(), "id", "google");
    models = sortToFirst(_list.sort(), "id", "mistral");
    models = sortToFirst(_list.sort(), "id", "openai");
    models = sortToFirst(_list.sort(), "id", "anthropic");
    // sort a fav model on top! (default)
    models = sortToFirst(_list.sort(), "id", "anthropic/claude-3.5-sonnet");

    // Vision AI models
    const _visionList = [...responseData.data].filter(
      (item) =>
        item.id.indexOf("vision") > -1 ||
        item.id == "google/gemini-pro-1.5" ||
        (item.id.indexOf("openai/gpt-4o") > -1 &&
          item.id.indexOf("openai/gpt-4o-2024-05-13") === -1) ||
        // item.id == 'anthropic/claude-3-haiku:beta'
        // [NEW] All Claude 3 models have vision ability
        item.id.indexOf("anthropic/claude-3") > -1
    );
    let visions = sortToFirst(_visionList.sort(), "id", "openai/"); // <-- sort OpenAI's models on top! (default)
    if (visions.length > 24) visions.splice(24); // <-- Keep max amount of models is 20

    // up-sale
    models = models
      .map((model) => {
        let prompt = toFloat(model.pricing.prompt);
        let completion = toFloat(model.pricing.completion);
        let image = toFloat(model.pricing.image);
        let request = toFloat(model.pricing.request);

        if (prompt < 0) prompt = 0;
        if (completion < 0) completion = 0;
        if (image < 0) image = 0;
        if (request < 0) request = 0;

        model.pricing = {
          prompt: prompt.toString(),
          completion: completion.toString(),
          image: image.toString(),
          request: request.toString(),
        };

        return model;
      })
      .filter((model) => model.pricing.prompt !== "0" && model.pricing.completion !== "0");
    visions = visions.map((model) => {
      let prompt = toFloat(model.pricing.prompt);
      let completion = toFloat(model.pricing.completion);
      let image = toFloat(model.pricing.image);
      let request = toFloat(model.pricing.request);

      if (prompt < 0) prompt = 0;
      if (completion < 0) completion = 0;
      if (image < 0) image = 0;
      if (request < 0) request = 0;

      model.pricing = {
        prompt: prompt.toString(),
        completion: completion.toString(),
        image: image.toString(),
        request: request.toString(),
      };

      return model;
    });

    // assign to global vars
    aiModels = models;
    aiVisionModels = visions;

    // print out
    // console.log(
    //     '[AI] Available AI models :>> ',
    //     aiModels.map((item) => item.id)
    // );
    // console.log(
    //     '[AI] Available vision models :>> ',
    //     aiVisionModels.map((item) => item.id)
    // );
    console.log("[AI] Total AI models :>> ", aiModels.length);
    console.log("[AI] Total AI vision models :>> ", aiVisionModels.length);

    // add to redis (if redis is available) and set expire time to 24 hours
    if (redis) {
      redis.set("aiModels", JSON.stringify(aiModels), "EX", 24 * 60 * 60);
      redis.set("aiVisionModels", JSON.stringify(aiVisionModels), "EX", 24 * 60 * 60);
    }

    // aiModels.push(...models);
    // aiVisionModels.push(...visions);
    return models as AIModel[]; // Trả về danh sách mô hình AI
  } catch (e: any) {
    console.log(`[FETCH_AI_MODELS] e :>> `, e);
    // console.log(`[FETCH_AI_MODELS] e.response :>> `, e.response);
    // console.log(`[FETCH_AI_MODELS] e.message :>> `, e.message);
    // const err = e.response?.data?.error?.message || e.message;
    return []; // Trả về mảng rỗng trong trường hợp có lỗi
  }
}
