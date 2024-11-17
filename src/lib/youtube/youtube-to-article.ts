import { type AskAiResponse } from "../ai";
import { fetchAi } from "../ai/fetch-ai";
import { usagePurposes } from "../ai/summarize";
import { getLanguageCodeByName, languages } from "../translate/settings";
import { getYoutubeVideoUrl } from "./youtube-summary";
import { getYoutubeTranscript } from "./youtube-transcript";

export type TranscriptToArticleOptions = {
  /**
   * AI Model in string.
   * @example "mistralai/mixtral-8x7b-instruct:nitro"
   */
  model?: string;
  length?: string | number;
  purpose?: string;
  toLanguage?: string | null;
  additionalPrompt?: string;
};

export async function aiYoutubeToArticle(content: string, options: TranscriptToArticleOptions) {
  const prompt = `I will provide the youtube video transcript content, you will rewrite it to an article it follow strictly to these instructions:
        <instructions>
        - Length: ${options.length || "500-1000 words"}
        - Usage purpose: ${options.purpose || usagePurposes[0]}
        - Responds in language: ${options.toLanguage || languages[0]}
        - Formats the article content in markdown
        - Starts with a title based on the summary content
        - Splits a content into separated parts with your suggested titles for each part
        - Generates a quick conclusion at the end
        - Do not wrap your response with tripple backticks
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

  const msgs = result.choices.map((msg) => msg.message.content);
  return msgs.join("");
}

export async function youtubeToArticle(urlOrID: string, options?: TranscriptToArticleOptions) {
  const videoUrl = urlOrID.startsWith("http") ? urlOrID : getYoutubeVideoUrl(urlOrID);
  console.log("Write article from Youtube video :>> ", videoUrl);

  const locale = getLanguageCodeByName(options?.toLanguage || "English");
  const transcript = await getYoutubeTranscript(videoUrl, { ext: "vtt", locale });
  console.log("Youtube transcript content :>> ", transcript);
  if (!transcript) throw new Error("Unable to transcript video.");

  const article = (await aiYoutubeToArticle(transcript, {
    ...options,
  })) as string;

  return article;
}
