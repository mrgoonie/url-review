/**
 * Twitter/X Content to Markdown Converter
 * Converts structured FxTwitter API data directly to Markdown,
 * bypassing Defuddle which strips tweet content incorrectly.
 *
 * Supports: regular tweets, X Articles (DraftJS long-form), media, polls, replies.
 * Adopted from: https://github.com/thieung/defuddle
 */

import type { TwitterArticle, TwitterContent } from "./get-twitter-content";
import type { TwitterReply } from "./get-twitter-replies";

/** Result from converting a tweet to Markdown */
export interface TwitterMarkdownResult {
  markdown: string;
  metadata: {
    title: string;
    author: string;
    description: string;
    published: string;
    domain: string;
    image?: string;
    wordCount: number;
  };
}

/**
 * Convert TwitterContent (from FxTwitter/VxTwitter APIs) to rich Markdown.
 * Handles: tweet text, X Articles (DraftJS), media, stats, replies.
 */
export function twitterContentToMarkdown(content: TwitterContent): TwitterMarkdownResult {
  const parts: string[] = [];
  let title = "";
  let description = "";

  // X Article (long-form DraftJS content) takes priority over tweet text
  if (content.article?.blocks?.length) {
    title = content.article.title || "";
    description = content.article.previewText || "";

    // Article cover image
    if (content.article.coverImageUrl) {
      parts.push(`![Cover](${content.article.coverImageUrl})`);
    }

    // Convert DraftJS blocks to Markdown
    parts.push(articleBlocksToMarkdown(content.article));
  } else if (content.text) {
    // Regular tweet text
    parts.push(content.text);
    description = content.text.slice(0, 200);
  }

  // Media attachments
  const mediaMarkdown = renderMedia(content.media);
  if (mediaMarkdown) {
    parts.push(mediaMarkdown);
  }

  // Engagement stats
  const statsMarkdown = renderStats(content.stats);
  if (statsMarkdown) {
    parts.push(statsMarkdown);
  }

  // Replies section
  if (content.replies?.length) {
    parts.push(renderReplies(content.replies));
  }

  const markdown = parts.join("\n\n");
  const authorDisplay = `${content.author.name} (@${content.author.username})`;

  return {
    markdown,
    metadata: {
      title: title || authorDisplay,
      author: authorDisplay,
      description,
      published: content.createdAt || "",
      domain: "x.com",
      image: content.article?.coverImageUrl || content.author.avatar,
      wordCount: markdown.split(/\s+/).filter(Boolean).length,
    },
  };
}

// ─── DraftJS Article Blocks → Markdown ──────────────────────────────────────

/** Convert X Article DraftJS blocks to Markdown */
function articleBlocksToMarkdown(article: TwitterArticle): string {
  const { blocks, entityMap, mediaEntities } = article;
  const lines: string[] = [];

  for (const block of blocks) {
    let text = applyEntityLinks(block.text || "", block.entityRanges || [], entityMap);
    text = applyInlineStyles(text, block.inlineStyleRanges || []);

    switch (block.type) {
      case "header-one":
        lines.push(`# ${text}`);
        break;
      case "header-two":
        lines.push(`## ${text}`);
        break;
      case "header-three":
        lines.push(`### ${text}`);
        break;
      case "unordered-list-item":
        lines.push(`- ${text}`);
        break;
      case "ordered-list-item":
        lines.push(`1. ${text}`);
        break;
      case "blockquote":
        lines.push(`> ${text}`);
        break;
      case "code-block":
        lines.push("```\n" + block.text + "\n```");
        break;
      case "atomic":
        lines.push(renderAtomicBlock(block.entityRanges || [], entityMap, mediaEntities));
        break;
      default:
        // "unstyled" and others
        lines.push(text);
        break;
    }
  }

  return lines.join("\n\n");
}

/** Apply bold/italic/code/strikethrough inline styles (process end→start to preserve offsets) */
function applyInlineStyles(
  text: string,
  ranges: Array<{ offset: number; length: number; style: string }>
): string {
  if (!ranges.length) return text;

  const sorted = [...ranges].sort((a, b) => b.offset - a.offset);
  let result = text;

  for (const range of sorted) {
    const before = result.slice(0, range.offset);
    const segment = result.slice(range.offset, range.offset + range.length);
    const after = result.slice(range.offset + range.length);

    const style = range.style.toUpperCase();
    if (style === "BOLD") result = before + `**${segment}**` + after;
    else if (style === "ITALIC") result = before + `*${segment}*` + after;
    else if (style === "CODE") result = before + `\`${segment}\`` + after;
    else if (style === "STRIKETHROUGH") result = before + `~~${segment}~~` + after;
    else result = before + segment + after;
  }

  return result;
}

/**
 * Apply entity links/mentions within a block's text (process end→start to preserve offsets).
 * Normalizes FxTwitter's nested {value: {type, data}} format.
 */
function applyEntityLinks(
  text: string,
  entityRanges: Array<{ offset: number; length: number; key: number }>,
  entityMap: Record<string, any>
): string {
  if (!entityRanges.length) return text;

  const sorted = [...entityRanges].sort((a, b) => b.offset - a.offset);
  let result = text;

  for (const range of sorted) {
    const entity = entityMap[range.key];
    if (!entity) continue;

    const before = result.slice(0, range.offset);
    const segment = result.slice(range.offset, range.offset + range.length);
    const after = result.slice(range.offset + range.length);

    // Normalize: FxTwitter wraps entity data under .value
    const entityType = (entity.value?.type || entity.type || "").toUpperCase();
    const data = entity.value?.data || entity.data || {};

    if (entityType === "LINK" || entityType === "URL") {
      const url = data.url || data.href || "";
      if (url) result = before + `[${segment}](${url})` + after;
    } else if (entityType === "MENTION" || entityType === "AT_MENTION") {
      const screenName = data.screenName || data.screen_name || segment.replace("@", "");
      result = before + `[@${screenName}](https://x.com/${screenName})` + after;
    } else if (entityType === "HASHTAG") {
      const tag = data.hashtag || segment.replace("#", "");
      result = before + `[#${tag}](https://x.com/hashtag/${tag})` + after;
    }
  }

  return result;
}

/** Render atomic blocks (images, videos, embedded tweets, code via markdown entity) */
function renderAtomicBlock(
  entityRanges: Array<{ offset: number; length: number; key: number }>,
  entityMap: Record<string, any>,
  mediaEntities: any[]
): string {
  const parts: string[] = [];

  for (const range of entityRanges) {
    const entity = entityMap[range.key];
    if (!entity) continue;

    const entityType = (entity.value?.type || entity.type || "").toUpperCase();
    const data = entity.value?.data || entity.data || {};

    // Markdown code block entity
    if (data.markdown) {
      parts.push(data.markdown);
      continue;
    }

    // MEDIA entity — article images/videos stored via mediaItems[].mediaId
    if (entityType === "MEDIA") {
      const mediaItems: any[] = data.mediaItems || [];
      for (const item of mediaItems) {
        const mediaId = item.mediaId || item.media_id || "";
        if (!mediaId) continue;
        const resolved = resolveArticleMediaUrl(mediaId, mediaEntities);
        if (resolved) {
          parts.push(
            resolved.type === "image" ? `![](${resolved.url})` : `[Video](${resolved.url})`
          );
        }
      }
      continue;
    }

    // TWEET entity — embedded tweet
    if (entityType === "TWEET" || entityType === "EMBEDDED_TWEET") {
      const tweetId = data.id || data.tweetId || "";
      if (tweetId) parts.push(`> [Embedded Tweet](https://x.com/i/status/${tweetId})`);
      continue;
    }

    // IMAGE / PHOTO entity (direct)
    if (entityType === "IMAGE" || entityType === "PHOTO") {
      const url = data.src || data.url || "";
      const alt = data.alt || data.altText || "";
      if (url) parts.push(`![${alt}](${url})`);
      continue;
    }

    // VIDEO entity (direct)
    if (entityType === "VIDEO") {
      const url = data.src || data.url || "";
      if (url) parts.push(`[Video](${url})`);
      continue;
    }
  }

  return parts.join("\n\n");
}

/** Resolve a media entity's actual URL from its mediaId using article media_entities */
function resolveArticleMediaUrl(
  mediaId: string,
  mediaEntities: any[]
): { url: string; type: "image" | "video" } | null {
  const entity = mediaEntities.find(
    (m: any) => m.media_id === mediaId || m.media_key === mediaId
  );
  if (!entity) return null;

  const info = entity.media_info;
  if (!info) {
    if (entity.url) return { url: entity.url, type: entity.type === "video" ? "video" : "image" };
    return null;
  }

  // ApiImage
  if (info.__typename === "ApiImage" || info.original_img_url) {
    return { url: info.original_img_url, type: "image" };
  }

  // ApiVideo — pick highest bitrate MP4 variant
  if (info.__typename === "ApiVideo" || info.video_info) {
    const variants = info.video_info?.variants || [];
    const mp4s = variants.filter((v: any) => v.content_type === "video/mp4" && v.url);
    const best = mp4s.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    if (best?.url) return { url: best.url, type: "video" };
    const any = variants.find((v: any) => v.url);
    if (any?.url) return { url: any.url, type: "video" };
  }

  return null;
}

// ─── Simple Renderers ───────────────────────────────────────────────────────

/** Render media attachments as Markdown */
function renderMedia(
  media?: Array<{ type: "photo" | "video" | "gif"; url: string; thumbnail?: string }>
): string {
  if (!media?.length) return "";

  return media
    .map((m) => {
      if (m.type === "photo") return `![Tweet media](${m.url})`;
      const label = m.type === "gif" ? "GIF" : "Video";
      return `[${label}](${m.url})`;
    })
    .join("\n\n");
}

/** Render engagement stats */
function renderStats(stats?: {
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
}): string {
  if (!stats) return "";

  const parts: string[] = [];
  parts.push(`❤️ ${stats.likes.toLocaleString()}`);
  parts.push(`🔁 ${stats.retweets.toLocaleString()}`);
  parts.push(`💬 ${stats.replies.toLocaleString()}`);
  if (stats.views != null) parts.push(`👁 ${stats.views.toLocaleString()}`);

  return "---\n" + parts.join(" · ");
}

/** Render replies as Markdown */
function renderReplies(replies: TwitterReply[]): string {
  if (!replies.length) return "";

  const header = `## Replies (${replies.length})`;
  const repliesMarkdown = replies
    .map((r) => {
      const author = `**${r.author.name}** (@${r.author.username})`;
      const stats = `❤️ ${r.stats.likes} · 💬 ${r.stats.replies}`;
      return `${author}\n\n${r.text}\n\n*${stats}*`;
    })
    .join("\n\n---\n\n");

  return `${header}\n\n${repliesMarkdown}`;
}
