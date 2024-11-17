import chalk from "chalk";

import { type AskAiMessage, type AskAiResponse, fetchAi } from ".";

const model = "meta-llama/llama-3.2-11b-vision-instruct";

export type JsonValidatorOptions = {
  parse?: boolean;
  model?: string;
  attempts?: number;
  maxRetries?: number;
  debug?: boolean;
};

export class JsonValidatorError extends Error {
  constructor(public data: { message: string; data: any }) {
    super(data.message);
  }
}

export async function jsonValidator(json: string, options?: JsonValidatorOptions) {
  if (!options) options = { model, attempts: 0, maxRetries: 5, parse: false };
  if (typeof options.attempts === "undefined") options.attempts = 0;
  if (typeof options.maxRetries === "undefined") options.maxRetries = 5;
  if (typeof options.parse === "undefined") options.parse = false;

  // throw error if attempts reached
  options.attempts++;
  if (options.attempts > options.maxRetries)
    throw new JsonValidatorError({
      message: `Unable to validate & fix this json: Maximum number of attempts reached.`,
      data: { json },
    });

  if (options.debug)
    console.log(
      chalk.yellow("jsonValidator"),
      `[${options.attempts}/${options.maxRetries}] :>>`,
      json
    );

  try {
    const parsed = options.parse ? JSON.parse(json) : json;
    return parsed;
  } catch (e: any) {
    const messages: AskAiMessage[] = [
      {
        role: "system",
        content:
          "You are an expert in JSON validating & formatting. You are given a json and a parsing error message, you will need to revise the json to make it valid.",
      },
      {
        role: "user",
        content: `I'm unable to parse this JSON, check the error parsing message and revise the JSON with the following instructions:
            <json>${json}</json>
            <parsing_error_message>${e.message}</parsing_error_message>
            <instructions>
            - only return the json content
            - when formatting the json, carefully escape double quotes, linebreaks, etc.
            - do not escape single quotes
            - do not use markdown format in your response
            - do not include backticks in your response
            - IMPORTANT: do not include any explainations in your response
            </instructions>`,
      },
    ];
    const res = (await fetchAi({ model, messages })) as AskAiResponse;

    let snippet = res.choices?.map((choice) => choice.message.content)?.join("\n");
    if (!snippet) {
      throw new JsonValidatorError({
        message: `Fixed JSON content not found.`,
        data: { json },
      });
    }

    return jsonValidator(snippet, options);
  }
}
