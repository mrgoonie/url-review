# Convert to Markdown API - Technical Documentation

## Overview

The Convert to Markdown API transforms web page content into clean, well-formatted Markdown using AI. It employs a multi-layer fallback system for HTML fetching and AI model routing.

---

## API Endpoints

### Single URL Conversion

```
POST /api/v1/convert/markdown
```

**Request:**
```json
{
  "url": "https://example.com/article",
  "options": {
    "model": "google/gemini-2.5-flash",
    "instructions": "Custom conversion instructions",
    "delayAfterLoad": 3000,
    "debug": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully converted URL to Markdown",
  "url": "https://example.com/article",
  "markdown": "# Article Title\n\nContent...",
  "model": "google/gemini-2.5-flash",
  "usage": {
    "prompt_tokens": 1500,
    "completion_tokens": 800,
    "total_tokens": 2300,
    "total_cost": 0.0023
  }
}
```

### Batch URL Conversion

```
POST /api/v1/convert/markdown/urls
```

**Request:**
```json
{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "options": {
    "model": "google/gemini-2.5-flash",
    "maxLinks": 20,
    "delayAfterLoad": 3000
  }
}
```

---

## Architecture Flow

```
POST /api/v1/convert/markdown
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              convertUrlToMarkdown()                      │
│              [convert-crud.ts:11]                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Validate URL is alive (isUrlAlive, 15s timeout)    │
│                    │                                    │
│                    ▼                                    │
│  2. Fetch HTML content                                  │
│     └─ getHtmlWithFallbacks() [5-step chain]           │
│                    │                                    │
│                    ▼                                    │
│  3. Simplify HTML (remove scripts/styles/comments)     │
│                    │                                    │
│                    ▼                                    │
│  4. Strip HTML tags → Plain text                       │
│                    │                                    │
│                    ▼                                    │
│  5. AI Analysis via OpenRouter                         │
│     └─ analyzeHtml() → fetchAi()                       │
│                    │                                    │
│                    ▼                                    │
│  6. Validate JSON response (5 retries)                 │
│                    │                                    │
│                    ▼                                    │
│  7. Return Markdown content                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## HTML Fetching Fallback Chain

The system attempts 5 methods in sequence until one succeeds:

```
┌───────────────────────────────────────────────────────────────────┐
│                  getHtmlWithFallbacks()                           │
│                  [get-html-with-fallbacks.ts:106]                 │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STEP 1: axios (Internal)                                         │
│  ├─ Fastest method, lightweight HTTP request                      │
│  ├─ No JavaScript rendering                                       │
│  ├─ Timeout: 30s (default)                                        │
│  └─ Fails on: JS-heavy sites, bot protection                      │
│           │                                                        │
│           ▼ (on failure)                                          │
│                                                                    │
│  STEP 2: playwright (Internal)                                    │
│  ├─ Full browser automation                                       │
│  ├─ Renders JavaScript                                            │
│  ├─ Supports selectors                                            │
│  ├─ Configurable delay after load                                 │
│  └─ Fails on: Cloudflare, advanced bot protection                 │
│           │                                                        │
│           ▼ (on failure + API key exists)                         │
│                                                                    │
│  STEP 3: scrapedo (External API)                                  │
│  ├─ Requires: SCRAPE_DO_API_KEY                                   │
│  ├─ Anti-detection capabilities                                   │
│  ├─ Proxy rotation                                                │
│  └─ Skipped if no API key                                         │
│           │                                                        │
│           ▼ (on failure + API key exists)                         │
│                                                                    │
│  STEP 4: scrappey (External API via RapidAPI)                     │
│  ├─ Requires: RAPID_API_KEY                                       │
│  ├─ Browser fingerprint spoofing                                  │
│  ├─ CAPTCHA solving support                                       │
│  └─ Skipped if no API key                                         │
│           │                                                        │
│           ▼ (on failure)                                          │
│                                                                    │
│  STEP 5: firecrawl (External API)                                 │
│  ├─ Last resort                                                   │
│  ├─ JavaScript rendering                                          │
│  ├─ Returns structured HTML                                       │
│  └─ Throws error if all methods fail                              │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### Block Detection

Each step checks for common block patterns:
- `"To help us keep this website secure"` (Cloudflare)
- `"You've been blocked"` (Generic WAF)

If detected, the method is considered failed and the next fallback is attempted.

---

## AI Model Fallback (OpenRouter)

```
┌───────────────────────────────────────────────────────────────────┐
│                     fetchAi() Model Routing                        │
│                     [fetch-ai.ts:234]                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Priority Order (OpenRouter auto-routes on failure):              │
│                                                                    │
│  1. User-specified model (if provided)                            │
│     └─ e.g., "google/gemini-2.5-flash"                           │
│                                                                    │
│  2. First fallback: "google/gemini-2.5-flash"                     │
│                                                                    │
│  3. Second fallback: "openai/gpt-4.1-mini"                        │
│                                                                    │
│  4. Third fallback: "google/gemini-2.0-flash-001"                 │
│                                                                    │
│  Logic (fetch-ai.ts:257-259):                                      │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ if (!model && !models)                                    │     │
│  │   data.models = DEFAULT_AI_MODELS.slice(0, 3);           │     │
│  │ if (models) data.models = models;                        │     │
│  │ if (model) data.models = [model, ...DEFAULT_AI_MODELS];  │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## Retry Mechanisms

| Component | Retry Count | Strategy | Timeout |
|-----------|-------------|----------|---------|
| HTTP requests (axios-retry) | 3 | Exponential backoff | - |
| AI model routing | 3 models | OpenRouter auto-failover | 5 min |
| JSON validation | 5 | Sequential with `gemini-2.5-flash-lite` | - |
| URL alive check | 1 | None | 15s |
| HTML fetch (per method) | 1 | Sequential fallback chain | 30s |

---

## HTML Simplification

Before sending to AI, HTML is cleaned to reduce token count:

```
┌─────────────────────────────────────────────────────────────────┐
│                   simplifyHtml() Process                         │
│                   [get-html-with-fallbacks.ts:18]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Removed Elements:                                               │
│  ├─ <script>, <style>, <link rel="stylesheet">                  │
│  ├─ <meta>, <svg>, <iframe>, <noscript>                        │
│  ├─ <head> (entire section)                                     │
│  └─ HTML comments                                                │
│                                                                  │
│  Removed Attributes:                                             │
│  ├─ style, class, id, onclick                                   │
│  ├─ data-*, aria-*, role, tabindex                             │
│  ├─ target, rel, srcset, sizes                                  │
│  └─ loading, crossorigin, integrity                             │
│                                                                  │
│  Result: ~70% size reduction                                     │
│  ├─ Fewer tokens for LLM                                        │
│  ├─ Lower API cost                                              │
│  └─ Same content preserved                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Batch Processing

For multiple URLs, controlled concurrency prevents rate limiting:

```
┌─────────────────────────────────────────────────────────────────┐
│              convertMultipleUrlsToMarkdown()                     │
│              [convert-crud.ts:68]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Configuration:                                                  │
│  ├─ Max URLs: 20 (default) or options.maxLinks                  │
│  └─ Concurrency: 5 parallel requests per batch                  │
│                                                                  │
│  Processing Flow:                                                │
│                                                                  │
│  Input: 20 URLs                                                  │
│           │                                                      │
│           ▼                                                      │
│  Batch 1: URLs 1-5   ──── Promise.all() ────→ Results 1-5      │
│           │                                                      │
│           ▼                                                      │
│  Batch 2: URLs 6-10  ──── Promise.all() ────→ Results 6-10     │
│           │                                                      │
│           ▼                                                      │
│  Batch 3: URLs 11-15 ──── Promise.all() ────→ Results 11-15    │
│           │                                                      │
│           ▼                                                      │
│  Batch 4: URLs 16-20 ──── Promise.all() ────→ Results 16-20    │
│           │                                                      │
│           ▼                                                      │
│  Aggregate usage stats and return all results                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | string | `google/gemini-2.5-flash` | AI model for conversion |
| `instructions` | string | Built-in prompt | Custom AI instructions |
| `delayAfterLoad` | number | 3000 | Wait time after page load (ms) |
| `debug` | boolean | false | Enable verbose logging |
| `maxLinks` | number | 20 | Max URLs for batch processing |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_KEY` | Yes | OpenRouter API key for AI |
| `SCRAPE_DO_API_KEY` | No | Scrapedo API key (Step 3) |
| `RAPID_API_KEY` | No | RapidAPI key for Scrappey (Step 4) |
| `FIRECRAWL_API_KEY` | No | Firecrawl API key (Step 5) |

---

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                     Error Scenarios                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  URL Not Alive (isUrlAlive fails)                               │
│  └─ Error: "URL {url} is not alive"                             │
│                                                                  │
│  All Fetch Methods Fail                                          │
│  └─ Error: "Failed to fetch HTML content for {url} after        │
│            trying all available methods"                         │
│                                                                  │
│  AI Response Empty                                               │
│  └─ Error: "No response content found"                          │
│                                                                  │
│  JSON Validation Fails (after 5 retries)                        │
│  └─ Error: Validation error message                             │
│                                                                  │
│  Request Timeout                                                 │
│  └─ Error: "Request timed out"                                  │
│                                                                  │
│  Zod Validation Error (invalid input)                           │
│  └─ HTTP 400 with validation error details                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/routes/api/api-convert.ts` | API route handlers |
| `src/modules/convert/convert-crud.ts` | Core conversion logic |
| `src/modules/convert/convert-schemas.ts` | Zod schemas |
| `src/lib/ai/analyze-url.ts` | AI analysis functions |
| `src/lib/ai/fetch-ai.ts` | OpenRouter client |
| `src/lib/scrape/get-html-with-fallbacks.ts` | HTML fetching chain |
| `src/lib/scrape/get-html-with-axios.ts` | Axios fetcher |
| `src/lib/scrape/get-html-with-playwright.ts` | Playwright fetcher |
| `src/lib/scrape/get-html-with-scrapedo.ts` | Scrapedo client |
| `src/lib/scrape/get-html-with-scrappey.ts` | Scrappey client |
| `src/lib/scrape/get-html-with-firecrawl.ts` | Firecrawl client |

---

## Performance Considerations

1. **Worst-case latency**: ~2.5 min (5 methods × 30s timeout each)
2. **No circuit breaker**: All external APIs tried sequentially on failures
3. **Silent skip**: Scrapedo/Scrappey skipped without error if API keys missing
4. **JSON validation uses different model**: `gemini-2.5-flash-lite` instead of original model

---

**Last Updated:** 2026-01-28
**Version:** 1.0
