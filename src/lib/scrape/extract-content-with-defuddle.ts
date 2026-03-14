import { Defuddle } from "defuddle/node";
import type { DefuddleResponse } from "defuddle/node";

/** Metadata extracted by Defuddle deterministically (no LLM cost) */
export interface DefuddleMetadata {
  title?: string;
  author?: string;
  description?: string;
  published?: string;
  domain?: string;
  favicon?: string;
  image?: string;
  language?: string;
  wordCount?: number;
  parseTime?: number;
}

/** Result from Defuddle content extraction */
export interface DefuddleResult {
  /** Clean HTML content (main article only, clutter removed) */
  content: string;
  /** Extracted metadata */
  metadata: DefuddleMetadata;
}

/**
 * Extract main content and metadata from raw HTML using Defuddle.
 * Removes ads, nav, sidebar, footer, and other clutter.
 * Returns clean HTML suitable for LLM processing with significantly fewer tokens.
 *
 * @param html - Raw HTML string from any fetcher
 * @param url - Source URL for context (helps Defuddle with relative links)
 * @returns Clean content + metadata
 * @throws Error if Defuddle fails or extracts empty content
 */
export async function extractContentWithDefuddle(
  html: string,
  url: string
): Promise<DefuddleResult> {
  // Defuddle/node accepts raw HTML string directly
  const result: DefuddleResponse = await Defuddle(html, url, {
    markdown: false, // Keep HTML — downstream LLM handles markdown conversion
    useAsync: false, // No external API calls for predictable behavior
  });

  if (!result.content || result.content.trim().length === 0) {
    throw new Error("Defuddle extracted empty content");
  }

  return {
    content: result.content,
    metadata: {
      title: result.title || undefined,
      author: result.author || undefined,
      description: result.description || undefined,
      published: result.published || undefined,
      domain: result.domain || undefined,
      favicon: result.favicon || undefined,
      image: result.image || undefined,
      language: result.language || undefined,
      wordCount: result.wordCount ?? undefined,
      parseTime: result.parseTime ?? undefined,
    },
  };
}
