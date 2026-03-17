import { type AskAiResponse, fetchAi } from "../ai";

export type TranslateOptions = {
  model?: string;
  additionalPrompt?: string;
};

export async function translate(content: string, toLang: string, options?: TranslateOptions) {
  const prompt = `I will provide the content, you will translate it to ${toLang} follow strictly to these instructions:
        <instructions>
        - Keep the format of the original content
        - Do not include any explanation in your response
        - Do not wrap your response with tripple backticks
        ${options?.additionalPrompt || ""}
        </instructions>
        Here is the content:
        <content_tobe_translated>
        ${content}
        </content_tobe_translated>`;

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
  return msgs.join("");
}
