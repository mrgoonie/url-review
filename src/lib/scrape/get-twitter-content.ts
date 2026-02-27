/**
 * Twitter/X Content Fetcher
 * Specialized module for fetching content from Twitter/X URLs
 * Uses free APIs (FxTwitter, VxTwitter) first, then falls back to RapidAPI services
 */

import axios from "axios";

import { env } from "@/env";
import { getTwitterReplies, repliesToHtml, type TwitterReply } from "./get-twitter-replies";

export interface TwitterContent {
  text: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  media?: Array<{
    type: "photo" | "video" | "gif";
    url: string;
    thumbnail?: string;
  }>;
  stats?: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
  createdAt?: string;
  replies?: TwitterReply[];
  html: string; // Generated HTML representation
}

/**
 * Check if URL is a Twitter/X URL
 */
export function isTwitterUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    return host === "twitter.com" || host === "x.com" || host === "www.twitter.com" || host === "www.x.com";
  } catch {
    return false;
  }
}

/**
 * Extract tweet ID from Twitter/X URL
 */
export function extractTweetId(url: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
    /(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Convert TwitterContent to HTML string
 */
function contentToHtml(content: TwitterContent): string {
  const mediaHtml = content.media
    ?.map((m) => {
      if (m.type === "photo") {
        return `<img src="${m.url}" alt="Tweet media" />`;
      } else if (m.type === "video" || m.type === "gif") {
        return `<video src="${m.url}" poster="${m.thumbnail || ""}" controls></video>`;
      }
      return "";
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tweet by @${content.author.username}</title>
</head>
<body>
  <article class="tweet">
    <header>
      <img src="${content.author.avatar || ""}" alt="${content.author.name}" class="avatar" />
      <div class="author">
        <span class="name">${content.author.name}</span>
        <span class="username">@${content.author.username}</span>
      </div>
    </header>
    <div class="content">
      <p>${content.text}</p>
      ${mediaHtml ? `<div class="media">${mediaHtml}</div>` : ""}
    </div>
    <footer>
      <time datetime="${content.createdAt || ""}">${content.createdAt || ""}</time>
      ${
        content.stats
          ? `
      <div class="stats">
        <span class="likes">${content.stats.likes} likes</span>
        <span class="retweets">${content.stats.retweets} retweets</span>
        <span class="replies">${content.stats.replies} replies</span>
        ${content.stats.views ? `<span class="views">${content.stats.views} views</span>` : ""}
      </div>
      `
          : ""
      }
    </footer>
    ${content.replies?.length ? repliesToHtml(content.replies) : ""}
  </article>
</body>
</html>`;
}

/**
 * Fetch tweet using FxTwitter API (FREE)
 */
async function fetchWithFxTwitter(tweetId: string, debug?: boolean): Promise<TwitterContent> {
  if (debug) console.log(`get-twitter-content.ts > Trying FxTwitter for tweet ${tweetId}`);

  const response = await axios.get(`https://api.fxtwitter.com/status/${tweetId}`, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const tweet = response.data?.tweet;
  if (!tweet) throw new Error("FxTwitter: No tweet data returned");

  const content: TwitterContent = {
    text: tweet.text || "",
    author: {
      name: tweet.author?.name || "",
      username: tweet.author?.screen_name || "",
      avatar: tweet.author?.avatar_url,
    },
    media: tweet.media?.all?.map((m: any) => ({
      type: m.type === "photo" ? "photo" : m.type === "gif" ? "gif" : "video",
      url: m.url || m.thumbnail_url,
      thumbnail: m.thumbnail_url,
    })),
    stats: {
      likes: tweet.likes || 0,
      retweets: tweet.retweets || 0,
      replies: tweet.replies || 0,
      views: tweet.views,
    },
    createdAt: tweet.created_at,
    html: "",
  };

  content.html = contentToHtml(content);
  return content;
}

/**
 * Fetch tweet using VxTwitter API (FREE)
 */
async function fetchWithVxTwitter(tweetId: string, debug?: boolean): Promise<TwitterContent> {
  if (debug) console.log(`get-twitter-content.ts > Trying VxTwitter for tweet ${tweetId}`);

  const response = await axios.get(`https://api.vxtwitter.com/status/${tweetId}`, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const tweet = response.data;
  if (!tweet?.text) throw new Error("VxTwitter: No tweet data returned");

  const content: TwitterContent = {
    text: tweet.text || "",
    author: {
      name: tweet.user_name || "",
      username: tweet.user_screen_name || "",
      avatar: tweet.user_profile_image_url,
    },
    media: tweet.media_extended?.map((m: any) => ({
      type: m.type === "image" ? "photo" : m.type === "gif" ? "gif" : "video",
      url: m.url,
      thumbnail: m.thumbnail_url,
    })),
    stats: {
      likes: tweet.likes || 0,
      retweets: tweet.retweets || 0,
      replies: tweet.replies || 0,
    },
    createdAt: tweet.date,
    html: "",
  };

  content.html = contentToHtml(content);
  return content;
}

/**
 * Fetch tweet using Twitter API45 via RapidAPI
 */
async function fetchWithTwitterApi45(tweetId: string, debug?: boolean): Promise<TwitterContent> {
  if (debug) console.log(`get-twitter-content.ts > Trying TwitterAPI45 for tweet ${tweetId}`);

  if (!env.RAPID_API_KEY) throw new Error("RAPID_API_KEY not configured");

  const response = await axios.get("https://twitter-api45.p.rapidapi.com/tweet.php", {
    params: { id: tweetId },
    headers: {
      "x-rapidapi-key": env.RAPID_API_KEY,
      "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
    },
    timeout: 15000,
  });

  const tweet = response.data;
  if (!tweet?.text) throw new Error("TwitterAPI45: No tweet data returned");

  const content: TwitterContent = {
    text: tweet.text || "",
    author: {
      name: tweet.author?.name || "",
      username: tweet.author?.screen_name || tweet.author?.username || "",
      avatar: tweet.author?.avatar,
    },
    media: tweet.media?.map((m: any) => ({
      type: m.type || "photo",
      url: m.url || m.media_url_https,
      thumbnail: m.thumbnail_url,
    })),
    stats: {
      likes: tweet.favorite_count || tweet.likes || 0,
      retweets: tweet.retweet_count || tweet.retweets || 0,
      replies: tweet.reply_count || tweet.replies || 0,
      views: tweet.views,
    },
    createdAt: tweet.created_at,
    html: "",
  };

  content.html = contentToHtml(content);
  return content;
}

/**
 * Fetch tweet using Twitter135 via RapidAPI
 */
async function fetchWithTwitter135(tweetId: string, debug?: boolean): Promise<TwitterContent> {
  if (debug) console.log(`get-twitter-content.ts > Trying Twitter135 for tweet ${tweetId}`);

  if (!env.RAPID_API_KEY) throw new Error("RAPID_API_KEY not configured");

  const response = await axios.get("https://twitter135.p.rapidapi.com/v2/TweetDetail/", {
    params: { id: tweetId },
    headers: {
      "x-rapidapi-key": env.RAPID_API_KEY,
      "x-rapidapi-host": "twitter135.p.rapidapi.com",
    },
    timeout: 15000,
  });

  // Twitter135 returns complex nested structure
  const instructions = response.data?.data?.tweetResult?.result;
  const legacy = instructions?.legacy || instructions?.tweet?.legacy;
  const user = instructions?.core?.user_results?.result?.legacy || instructions?.tweet?.core?.user_results?.result?.legacy;

  if (!legacy?.full_text && !legacy?.text) throw new Error("Twitter135: No tweet data returned");

  const mediaEntities = legacy?.extended_entities?.media || legacy?.entities?.media || [];

  const content: TwitterContent = {
    text: legacy.full_text || legacy.text || "",
    author: {
      name: user?.name || "",
      username: user?.screen_name || "",
      avatar: user?.profile_image_url_https,
    },
    media: mediaEntities.map((m: any) => ({
      type: m.type === "photo" ? "photo" : m.type === "animated_gif" ? "gif" : "video",
      url: m.media_url_https || m.video_info?.variants?.[0]?.url,
      thumbnail: m.media_url_https,
    })),
    stats: {
      likes: legacy.favorite_count || 0,
      retweets: legacy.retweet_count || 0,
      replies: legacy.reply_count || 0,
      views: instructions?.views?.count,
    },
    createdAt: legacy.created_at,
    html: "",
  };

  content.html = contentToHtml(content);
  return content;
}

interface TwitterFetchOptions {
  debug?: boolean;
  timeout?: number;
  /** Fetch replies using TwitterAPI.io (requires TWITTER_API_IO_KEY) */
  includeReplies?: boolean;
  /** Max replies to fetch (default: 20) */
  repliesLimit?: number;
}

/**
 * Main function to fetch Twitter content with fallbacks
 * Order: FxTwitter (free) → VxTwitter (free) → TwitterAPI45 → Twitter135
 */
export async function getTwitterContent(
  url: string,
  options?: TwitterFetchOptions
): Promise<TwitterContent> {
  const debug = options?.debug ?? false;
  const tweetId = extractTweetId(url);

  if (!tweetId) {
    throw new Error(`Invalid Twitter URL: ${url}`);
  }

  const methods = [
    { name: "FxTwitter", fn: fetchWithFxTwitter },
    { name: "VxTwitter", fn: fetchWithVxTwitter },
    { name: "TwitterAPI45", fn: fetchWithTwitterApi45 },
    { name: "Twitter135", fn: fetchWithTwitter135 },
  ];

  const errors: Array<{ method: string; error: string }> = [];

  for (const method of methods) {
    try {
      const content = await method.fn(tweetId, debug);
      if (debug) console.log(`get-twitter-content.ts > Successfully fetched with ${method.name}`);

      // Fetch replies if requested and API key is available
      if (options?.includeReplies && env.TWITTER_API_IO_KEY && tweetId) {
        try {
          const result = await getTwitterReplies(tweetId, {
            limit: options.repliesLimit,
            debug,
          });
          content.replies = result.replies;
          // Re-generate HTML with replies included
          content.html = contentToHtml(content);
          if (debug) console.log(`get-twitter-content.ts > Fetched ${result.replies.length} replies`);
        } catch (repliesError) {
          if (debug) console.log(`get-twitter-content.ts > Failed to fetch replies: ${repliesError}`);
        }
      }

      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ method: method.name, error: errorMsg });
      if (debug) console.log(`get-twitter-content.ts > ${method.name} failed: ${errorMsg}`);
    }
  }

  const methodsTried = errors.map((e) => `${e.method}: ${e.error}`).join("; ");
  throw new Error(`Failed to fetch Twitter content for ${url}. Errors: ${methodsTried}`);
}

/**
 * Get HTML content from Twitter URL
 * This is the function that integrates with get-html-with-fallbacks
 */
export async function getTwitterHtml(url: string, options?: TwitterFetchOptions): Promise<string> {
  const content = await getTwitterContent(url, options);
  return content.html;
}
