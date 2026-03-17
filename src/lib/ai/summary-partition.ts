import { languages } from "../translate/settings";
import { extractTextBetweenBackticks } from "../utils";
import { type AskAiResponse, fetchAi } from "./fetch-ai";
import { jsonValidator } from "./json-validator";

export type PartitionResponse = {
  name: string;
  description: string;
  parts: {
    title: string;
    from: string;
    to: string;
    second: number;
    url: string;
  }[];
  conclusion: string;
};

type PartitionOptions = {
  model?: string;
  length?: "short" | "medium" | "long";
  toLanguage?: string;
};

export async function summaryPartition(summaryContent: string, options?: PartitionOptions) {
  const prompt = `I will provide the youtube video transcript content, you will summarize it follow strictly to these instructions:
        <instructions>
        - Length: ${options?.length || "any"}
        - Responds in language: ${options?.toLanguage || languages[0]}
        - Starts with a name based on the summary content
        - Splits this summary content into separated parts with title and "from-to" time
        - Generates a quick conclusion at the end
        - Do not wrap your response with tripple backticks
		- Do not include any explanation for your response
        - Formats your summary response follow strictly to this JSON format:
		\`\`\`
		{
		  "name": "<summary_name>",
		  "description": "<summary_description>",
		  "parts": [
			{
			  "title": "<part_title>",
			  "from": "<part_start_time>",
			  "to": "<part_end_time>",
			  "url": "<part_youtube_url>",
			  "second": <part_start_time_in_second>
			}
		  ],
		  "conclusion": "<conclusion_content>"
		}
		\`\`\`
        </instructions>
		
        Here is the youtube video transcript content:
        <transcripted_content>
        ${summaryContent}
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
  const json = extractTextBetweenBackticks(aiAnswer);
  return (await jsonValidator(json, { parse: true })) as PartitionResponse;
}
