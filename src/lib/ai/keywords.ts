import { type AskAiResponse, fetchAi } from "../ai";
import { jsonValidator } from "./json-validator";

export type ClassifyKeywordsOptions = {
  model?: string;
  additionalPrompt?: string;
};

export async function classifyKeywords(
  content: string,
  language: string,
  options?: ClassifyKeywordsOptions
) {
  const prompt = `I will provide the content, you will classify it into a list of keywords in "${language}" language follow strictly to these instructions:
        <instructions>
        - Respond in JSON format follow the template below
        - Do not use markdown in your response
        - Do not include any explanation in your response
        - Do not wrap your response with tripple backticks
        ${options?.additionalPrompt || ""}
        </instructions>
        <response_json_template>
        { "keywords": [ "keyword_1", "keyword_2", "keyword_3", ... ] }
        </response_json_template>
        Here is the content:
        <content_tobe_classified>
        ${content}
        </content_tobe_classified>`;

  const result = (await fetchAi({
    // model: options?.model || "google/gemini-flash-1.5",
    // models: ["google/gemini-flash-1.5", "google/gemini-pro-1.5", "anthropic/claude-3-haiku"],
    messages: [
      {
        role: "system",
        content: "You are a professional translator tool",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })) as AskAiResponse;

  const msgs = result.choices.map((msg) => msg.message.content);
  const jsonContent = msgs.join("");

  return (await jsonValidator(jsonContent, { parse: true })) as { keywords: string[] };
}
