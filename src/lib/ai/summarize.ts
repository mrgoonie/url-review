import { languages } from "../translate/settings";
import { type AskAiResponse, fetchAi, type TextModel } from "./fetch-ai";

// usage purposes of the AI response content
export const usagePurposes = [
  "Any",
  "Twitter post",
  "Facebook post",
  "Blog",
  "News",
  "SEO Article (EEAT Standard)",
  "Tik Tok short video script",
  "Youtube video script",
];
export const usagePurposeLengths = [
  "Any",
  "Less than 280 characters",
  "Any",
  "500-800 words",
  "500-1000 words",
  "500-1000 words",
  "Any",
  "Any",
];

export type SummarizeOptions = {
  /**
   * AI Model in string (if provided, will override the models).
   * @example "mistralai/mixtral-8x7b-instruct:nitro"
   */
  model?: TextModel;
  /**
   * AI Models in array (if provided, will override the model).
   * @example ["mistralai/mixtral-8x7b-instruct:nitro", "anthropic/claude-3-haiku"]
   */
  models?: string[];
  length?: string | number;
  purpose?: string;
  toLanguage?: string | null;
  userPrompt?: string;
  additionalPrompt?: string;
  output?: "string" | "array" | "object";
};

export async function summarize(content: string, options?: SummarizeOptions) {
  const result = (await fetchAi({
    model: options?.model,
    models: options?.models,
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant`,
      },
      {
        role: "user",
        content: `I will provide the content, you will summarize it follow strictly to these requirements:
        - Length: ${options?.length || "any"}
        - Usage purpose: ${options?.purpose || usagePurposes[0]}
        - Responds in language: ${options?.toLanguage || languages[0]}
        ${options?.additionalPrompt || ""}
        Here is the content: ${content}`,
      },
    ],
  })) as AskAiResponse;

  return result;
}

export type SummaryResponse = {
  name: string;
  description: string;
  content: string;
  parts: {
    title: string;
    from: string;
    to: string;
    url: string;
    second: number;
  }[];
  conclusion: string;
};

export async function summarizeYoutubeTranscript(
  content: string,
  options: SummarizeOptions & { webURL: string }
) {
  const prompt = `I will provide the youtube video transcript content, you will summarize it follow strictly to these instructions:
        <instructions>
        - Length: ${options.length || "any"}
        - Usage purpose: ${options.purpose || usagePurposes[0]}
        - Responds in language: ${options.toLanguage || languages[0]}
        - Starts with a name based on the summary content
        - Splits your summary response into separated parts with your suggested title and "from-to" time, give a name for each part
        - Generates Youtube URL links to each part at the according time from this url: "${
          options.webURL
        }",
        - Generates a quick conclusion at the end
        - Do not wrap your response with tripple backticks
        - Formats your summary response in markdown format
        ${options.additionalPrompt || ""}
        </instructions>
		
        Here is the youtube video transcript content:
        <transcripted_content>
        ${content}
        </transcripted_content>`;

  const result = (await fetchAi({
    stream: false,
    // model: options?.model || "google/gemini-flash-1.5",
    // models: ["google/gemini-flash-1.5", "google/gemini-pro-1.5", "anthropic/claude-3-haiku"],
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })) as AskAiResponse;

  const aiAnswer = result.choices.map((msg) => msg.message.content).join("");
  // console.log("aiAnswer :>> ", aiAnswer);

  return aiAnswer;
}
