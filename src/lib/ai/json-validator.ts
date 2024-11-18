import chalk from "chalk";
import { z } from "zod";

import { type AskAiMessage, type AskAiResponse, fetchAi, type TextModel, TextModelSchema } from ".";

export const LOW_JSON_VALIDATOR_MODEL: TextModel = "google/gemini-flash-1.5-8b";
export const MEDIUM_JSON_VALIDATOR_MODEL: TextModel = "google/gemini-flash-1.5";
export const HIGH_JSON_VALIDATOR_MODEL: TextModel = "anthropic/claude-3-5-haiku";

export const JsonValidatorOptionsSchema = z.object({
  parse: z.boolean().optional().describe("Whether to parse the JSON"),
  model: TextModelSchema.optional().describe("The AI model to use"),
  attempts: z.number().optional().describe("The number of attempts to fix the JSON"),
  maxRetries: z.number().optional().describe("The maximum number of retries to fix the JSON"),
  debug: z.boolean().optional().describe("Whether to log debug information"),
});

export type JsonValidatorOptions = z.infer<typeof JsonValidatorOptionsSchema>;

export class JsonValidatorError extends Error {
  constructor(public data: { message: string; data: any }) {
    super(data.message);
  }
}

export async function jsonValidator(json: string, options?: JsonValidatorOptions) {
  if (!options) options = {};
  if (typeof options.model === "undefined") options.model = LOW_JSON_VALIDATOR_MODEL;
  if (typeof options.attempts === "undefined") options.attempts = 0;
  if (typeof options.maxRetries === "undefined") options.maxRetries = 5;
  if (typeof options.parse === "undefined") options.parse = false;

  // throw error if max retries is greater than 5
  if (options.maxRetries > 5) throw new Error("Max retries cannot be greater than 5");

  // throw error if attempts reached
  options.attempts++;
  if (options.attempts > options.maxRetries)
    throw new JsonValidatorError({
      message: `Unable to validate & fix this json: Maximum number of attempts reached.`,
      data: { json },
    });

  // Select model based on attempt number
  const modelSelection = [
    LOW_JSON_VALIDATOR_MODEL,
    MEDIUM_JSON_VALIDATOR_MODEL,
    HIGH_JSON_VALIDATOR_MODEL,
    // Repeat high model for additional attempts
    HIGH_JSON_VALIDATOR_MODEL,
    HIGH_JSON_VALIDATOR_MODEL,
  ];
  options.model = modelSelection[options.attempts - 1] || HIGH_JSON_VALIDATOR_MODEL;

  if (options.debug)
    console.log(
      chalk.yellow("jsonValidator"),
      `[${options.attempts}/${options.maxRetries}] Model: ${options.model} :>>`,
      json
    );

  try {
    const parsed = JSON.parse(json);
    return options.parse ? parsed : json;
  } catch (e: any) {
    const messages: AskAiMessage[] = [
      {
        role: "system",
        content: `You are an expert in JSON validating & formatting. 
        You are given a json and a parsing error message, you will need to revise the json to make it valid.`,
      },
      {
        role: "user",
        content: `I'm unable to parse this JSON, check the error parsing message and revise the JSON with the following instructions:
            <current_json>${json}</current_json>
            <parsing_error_message>${e.message}</parsing_error_message>
            <instructions>
            - do not use markdown format in your response
            - only return a text content of the json
            - check values of json fields, carefully escape double quotes, linebreaks, etc.
            - do not use double backslashes when escaping double quotes
            - do not escape single quotes
            - do not include any backticks in your response
            - IMPORTANT: only return the result,do not include any explainations in your response
            </instructions>`,
      },
    ];
    const res = (await fetchAi({ model: options.model, messages })) as AskAiResponse;

    let snippet = res.choices?.map((choice) => choice.message.content)?.join("\n");
    if (!snippet) {
      throw new JsonValidatorError({
        message: `Fixed JSON content not found.`,
        data: { json },
      });
    }

    // Recursively validate the snippet
    return jsonValidator(snippet, options);
  }
}

export const validateJson = jsonValidator;
