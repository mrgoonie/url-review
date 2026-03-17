# Phase 1: Create Facebook Content Module

**Priority:** High
**Status:** ⬜ Not Started
**Effort:** 1.5h

## Overview

Create `src/lib/scrape/get-facebook-content.ts` mirroring the Twitter module structure (`get-twitter-content.ts`).

## Related Files

- Reference: `src/lib/scrape/get-twitter-content.ts` (pattern to follow)
- Config: `src/env.ts` (RAPID_API_KEY at line 46)

## Implementation Steps

### 1. Define interfaces

```ts
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
```

### 2. URL detection — `isFacebookUrl(url: string): boolean`

Match these hostnames:
- `facebook.com`, `www.facebook.com`
- `m.facebook.com`
- `fb.com`, `www.fb.com`
- `fb.watch`

### 3. API fetch — `getFacebookContent(url, options)`

```
GET https://facebook-scraper3.p.rapidapi.com/post
params: { post_url: url }
headers: {
  "x-rapidapi-key": env.RAPID_API_KEY,
  "x-rapidapi-host": "facebook-scraper3.p.rapidapi.com"
}
timeout: 15000
```

- Check `env.RAPID_API_KEY` exists, throw if not
- Map API response fields to `FacebookContent` interface
- Include ALL photos from `album_preview` array
- Handle video posts (video URL + thumbnail)

### 4. HTML generation — `contentToHtml(content)`

Output semantic HTML matching Twitter pattern:

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Facebook post by {name}</title></head>
<body>
  <article class="facebook-post">
    <header>
      <img src="{avatar}" alt="{name}" class="avatar" />
      <div class="author"><span class="name">{name}</span></div>
    </header>
    <div class="content"><p>{message}</p></div>
    <div class="media">{all images + videos}</div>
    <footer>
      <time datetime="{timestamp}">{timestamp}</time>
      <div class="stats">
        <span class="reactions">{reactions} reactions</span>
        <span class="comments">{comments} comments</span>
        <span class="shares">{shares} shares</span>
      </div>
    </footer>
  </article>
</body>
</html>
```

### 5. Public export — `getFacebookHtml(url, options): Promise<string>`

Wrapper that calls `getFacebookContent()` and returns `.html`.

## TODO

- [ ] Create `src/lib/scrape/get-facebook-content.ts`
- [ ] Implement `isFacebookUrl()` with all URL patterns
- [ ] Implement `getFacebookContent()` with RapidAPI call
- [ ] Implement `contentToHtml()` with full album photos + video support
- [ ] Implement `getFacebookHtml()` public wrapper
- [ ] Compile check: `bun run build` or `bunx tsc --noEmit`

## Success Criteria

- Module exports `isFacebookUrl`, `getFacebookContent`, `getFacebookHtml`
- All Facebook URL patterns correctly detected
- API response mapped to structured HTML with all album photos
- Compiles without errors
