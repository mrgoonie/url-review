/**
 * Twitter/X Replies Fetcher
 * Uses TwitterAPI.io to fetch replies/comments for a tweet
 */

import axios from "axios";

import { env } from "@/env";

export interface TwitterReply {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
  };
  stats: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
  createdAt?: string;
}

interface FetchRepliesOptions {
  /** Max number of replies to fetch (default: 20, max per page from API) */
  limit?: number;
  /** Pagination cursor for fetching next page */
  cursor?: string;
  debug?: boolean;
}

interface FetchRepliesResult {
  replies: TwitterReply[];
  /** Cursor for next page, null if no more */
  nextCursor: string | null;
  /** Whether there are more replies to fetch */
  hasMore: boolean;
}

/**
 * Fetch replies for a tweet using TwitterAPI.io
 */
export async function getTwitterReplies(
  tweetId: string,
  options?: FetchRepliesOptions
): Promise<FetchRepliesResult> {
  const debug = options?.debug ?? false;
  const apiKey = env.TWITTER_API_IO_KEY;

  if (!apiKey) {
    throw new Error("TWITTER_API_IO_KEY not configured");
  }

  if (debug) console.log(`get-twitter-replies.ts > Fetching replies for tweet ${tweetId}`);

  const params: Record<string, string> = { tweetId };
  if (options?.cursor) params.cursor = options.cursor;

  const response = await axios.get("https://api.twitterapi.io/twitter/tweet/replies", {
    params,
    headers: { "X-API-Key": apiKey },
    timeout: 15000,
  });

  const data = response.data;
  const tweets = data?.tweets || [];

  const replies: TwitterReply[] = tweets.map((tweet: any) => ({
    id: tweet.id,
    text: tweet.text || "",
    author: {
      name: tweet.author?.name || "",
      username: tweet.author?.userName || "",
      avatar: tweet.author?.profilePicture,
      isVerified: tweet.author?.isBlueVerified || false,
    },
    stats: {
      likes: tweet.likeCount || 0,
      retweets: tweet.retweetCount || 0,
      replies: tweet.replyCount || 0,
      views: tweet.viewCount,
    },
    createdAt: tweet.createdAt,
  }));

  // Apply limit if specified
  const limit = options?.limit;
  const limitedReplies = limit ? replies.slice(0, limit) : replies;

  const nextCursor = data?.next_cursor || null;

  if (debug) console.log(`get-twitter-replies.ts > Fetched ${limitedReplies.length} replies`);

  return {
    replies: limitedReplies,
    nextCursor,
    hasMore: !!nextCursor,
  };
}

/**
 * Convert replies to HTML string for embedding in tweet HTML
 */
export function repliesToHtml(replies: TwitterReply[]): string {
  if (!replies.length) return "";

  const repliesHtml = replies
    .map(
      (r) => `
    <div class="reply">
      <div class="reply-author">
        ${r.author.avatar ? `<img src="${r.author.avatar}" alt="${r.author.name}" class="reply-avatar" />` : ""}
        <strong>${r.author.name}</strong>
        <span class="reply-username">@${r.author.username}</span>
      </div>
      <p class="reply-text">${r.text}</p>
      <div class="reply-stats">
        <span>${r.stats.likes} likes</span>
        <span>${r.stats.replies} replies</span>
      </div>
    </div>`
    )
    .join("\n");

  return `
  <section class="replies">
    <h3>Replies (${replies.length})</h3>
    ${repliesHtml}
  </section>`;
}
