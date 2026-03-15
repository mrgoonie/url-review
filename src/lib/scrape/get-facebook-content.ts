/**
 * Facebook Content Fetcher
 * Specialized module for fetching content from Facebook URLs
 * Uses RapidAPI facebook-scraper3 service
 */

import axios from "axios";

import { env } from "@/env";

export interface FacebookContent {
  text: string;
  author: {
    name: string;
    avatar?: string;
    profileUrl?: string;
  };
  media?: Array<{
    type: "photo" | "video";
    url: string;
    thumbnail?: string;
  }>;
  stats?: {
    reactions: number;
    comments: number;
    shares: number;
  };
  createdAt?: string;
  html: string;
}

/**
 * Check if URL is a Facebook URL
 */
export function isFacebookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    return (
      host === "facebook.com" ||
      host === "www.facebook.com" ||
      host === "m.facebook.com" ||
      host === "fb.com" ||
      host === "www.fb.com" ||
      host === "fb.watch"
    );
  } catch {
    return false;
  }
}

/**
 * Convert FacebookContent to HTML string
 */
function contentToHtml(content: FacebookContent): string {
  const mediaHtml = content.media
    ?.map((m) => {
      if (m.type === "photo") {
        return `<img src="${m.url}" alt="Facebook post media" />`;
      } else if (m.type === "video") {
        return `<video src="${m.url}" poster="${m.thumbnail || ""}" controls></video>`;
      }
      return "";
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Facebook post by ${content.author.name}</title>
</head>
<body>
  <article class="facebook-post">
    <header>
      ${content.author.avatar ? `<img src="${content.author.avatar}" alt="${content.author.name}" class="avatar" />` : ""}
      <div class="author">
        <span class="name">${content.author.name}</span>
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
        <span class="reactions">${content.stats.reactions} reactions</span>
        <span class="comments">${content.stats.comments} comments</span>
        <span class="shares">${content.stats.shares} shares</span>
      </div>
      `
          : ""
      }
    </footer>
  </article>
</body>
</html>`;
}

interface FacebookFetchOptions {
  debug?: boolean;
  timeout?: number;
}

/**
 * Fetch Facebook post content via RapidAPI facebook-scraper3
 */
export async function getFacebookContent(
  url: string,
  options?: FacebookFetchOptions
): Promise<FacebookContent> {
  const debug = options?.debug ?? false;

  if (!env.RAPID_API_KEY) {
    throw new Error("RAPID_API_KEY not configured");
  }

  if (debug) console.log(`get-facebook-content.ts > Fetching Facebook post: ${url}`);

  const response = await axios.get("https://facebook-scraper3.p.rapidapi.com/post", {
    params: { post_url: url },
    headers: {
      "x-rapidapi-key": env.RAPID_API_KEY,
      "x-rapidapi-host": "facebook-scraper3.p.rapidapi.com",
    },
    timeout: options?.timeout ?? 15000,
  });

  const post = response.data;
  if (!post) throw new Error("Facebook API: No post data returned");

  // Build media array from album_preview (photos) and video
  const media: FacebookContent["media"] = [];

  if (post.album_preview && Array.isArray(post.album_preview)) {
    for (const photo of post.album_preview) {
      const photoUrl = typeof photo === "string" ? photo : photo?.url || photo?.src;
      if (photoUrl) {
        media.push({ type: "photo", url: photoUrl });
      }
    }
  }

  // Single image fallback if no album
  if (media.length === 0 && post.image) {
    media.push({ type: "photo", url: post.image });
  }

  // Video support
  if (post.video) {
    media.push({
      type: "video",
      url: post.video,
      thumbnail: post.image || post.thumbnail,
    });
  }

  const content: FacebookContent = {
    text: post.text || post.message || post.description || "",
    author: {
      name: post.author?.name || post.user?.name || post.page_name || "",
      avatar: post.author?.avatar || post.user?.profile_picture || post.profile_picture,
      profileUrl: post.author?.url || post.user?.url || post.profile_url,
    },
    media: media.length > 0 ? media : undefined,
    stats: {
      reactions: post.reactions_count ?? post.likes ?? 0,
      comments: post.comments_count ?? post.comments ?? 0,
      shares: post.shares_count ?? post.shares ?? 0,
    },
    createdAt: post.created_at || post.timestamp || post.date,
    html: "",
  };

  content.html = contentToHtml(content);

  if (debug) console.log(`get-facebook-content.ts > Successfully fetched Facebook content`);
  return content;
}

/**
 * Get HTML content from Facebook URL
 * This is the function that integrates with get-html-with-fallbacks
 */
export async function getFacebookHtml(
  url: string,
  options?: FacebookFetchOptions
): Promise<string> {
  const content = await getFacebookContent(url, options);
  return content.html;
}
