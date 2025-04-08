import chalk from "chalk";
import { z } from "zod";

import { type AskAiMessage, type AskAiResponse, fetchAi, type TextModel, TextModelSchema } from ".";

export const LOW_JSON_VALIDATOR_MODEL: TextModel = "google/gemini-flash-1.5-8b";
export const MEDIUM_JSON_VALIDATOR_MODEL: TextModel = "google/gemini-flash-1.5";
export const HIGH_JSON_VALIDATOR_MODEL: TextModel = "anthropic/claude-3-5-haiku";

export const JsonValidatorOptionsSchema = z.object({
  parse: z.boolean().default(false).optional().describe("Whether to parse the JSON"),
  model: TextModelSchema.default(LOW_JSON_VALIDATOR_MODEL)
    .optional()
    .describe("The AI model to use"),
  attempts: z.number().default(0).optional().describe("The number of attempts to fix the JSON"),
  maxRetries: z
    .number()
    .max(5)
    .default(5)
    .optional()
    .describe("The maximum number of retries to fix the JSON"),
  debug: z.boolean().default(false).optional().describe("Whether to log debug information"),
});

export type JsonValidatorOptions = z.infer<typeof JsonValidatorOptionsSchema>;

export class JsonValidatorError extends Error {
  constructor(public data: { message: string; data: any }) {
    super(data.message);
  }
}

export async function jsonValidator(json: string, options?: JsonValidatorOptions) {
  const validatedOptions = JsonValidatorOptionsSchema.parse(options);

  // throw error if max retries reached
  validatedOptions.attempts = (validatedOptions.attempts || 0) + 1;
  if (validatedOptions.attempts > (validatedOptions.maxRetries || 5))
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
  validatedOptions.model =
    modelSelection[validatedOptions.attempts - 1] || HIGH_JSON_VALIDATOR_MODEL;

  if (validatedOptions.debug)
    console.log(
      chalk.yellow("jsonValidator"),
      `[${validatedOptions.attempts}/${validatedOptions.maxRetries}] Model: ${validatedOptions.model} :>>`,
      json
    );

  try {
    const parsed = JSON.parse(json);
    return validatedOptions.parse ? parsed : json;
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
    const res = (await fetchAi({ model: validatedOptions.model, messages })) as AskAiResponse;

    let snippet = res.choices?.map((choice) => choice.message.content)?.join("\n");
    if (!snippet) {
      throw new JsonValidatorError({
        message: `Fixed JSON content not found.`,
        data: { json },
      });
    }

    // Recursively validate the snippet
    return jsonValidator(snippet, validatedOptions);
  }
}

export const validateJson = jsonValidator;
