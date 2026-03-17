import { type AskAiResponse, fetchAi } from "../ai";
import { jsonValidator } from "./json-validator";

export type GenerateMetaOptions = {
  model?: string;
  additionalPrompt?: string;
};

export type GeneratedArticleMeta = {
  title: string;
  short_desc: string;
  keywords: string[];
};

export async function generateMeta(
  content: string,
  language: string,
  options?: GenerateMetaOptions
) {
  const prompt = `I will provide the content, you will classify and generate a json follow strictly to these instructions:
        <instructions>
        - Extract title of the content and titles of each paragraphs
        - Generate "short_desc" as a summary of the content (less than 250 characters), make sure it's attractive to make people want to click
        - Classify and generate list of relevant keywords of the content
        - Generated values must be in "${language}" language
        - Respond in JSON format follow the template below
        - Do not use markdown in your response
        - Do not include any explanation in your response
        - Do not wrap your response with tripple backticks
        ${options?.additionalPrompt || ""}
        </instructions>
        <response_json_template>
        { "title": "<title>", "short_desc": "<summary_of_the_content>", "catalogue": [ "<title_of_paragraph_1>", "<title_of_paragraph_2>", ... ], "keywords": [ "<keyword_1>", "<keyword_2>", "<keyword_3>", ... ] }
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

  return (await jsonValidator(jsonContent, { parse: true })) as GeneratedArticleMeta;
}
