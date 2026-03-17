# Scout Report: src/lib Directory Analysis
**Project:** ReviewWeb.site - AI-powered website analysis tool  
**Date:** 2025-12-10  
**Scope:** Complete src/lib library inventory and analysis

---

## Executive Summary

Comprehensive inventory of 97 TypeScript/JavaScript library files organized across 16 major subsystems. Core functionality spans AI integrations, web scraping, authentication, payments, CDN/storage, and utility helpers.

---

## Directory Structure & File Count

```
src/lib/
├── ai/                  (11 files) - AI model integrations & prompting
├── cdn/                 (7 files)  - CDN storage providers (Cloudflare, Upfile)
├── cloud-storage/       (4 files) - Cloud storage abstractions
├── email/               (6 files) - Email services (Elastic Email, Resend)
├── google/              (1 file)  - Google OAuth2 & API integrations
├── network/             (1 file)  - Network utilities (IP detection)
├── pagination/          (1 file)  - Pagination helpers
├── payment/             (4 files) - Payment providers (Polar, SePay, LemonSqueezy)
├── playwright/          (4 files) - Playwright browser automation
├── polar/               (1 file)  - Polar SDK wrapper
├── proxy/               (3 files) - Proxy management (WebShare)
├── scrape/              (6 files) - Web scraping with fallbacks
├── sitemap/             (2 files) - Sitemap submission
├── tracking/            (1 file)  - Analytics tracking
├── translate/           (3 files) - i18n translation utilities
├── upfile-best/         (3 files) - Upfile CDN integration
├── utils/               (30+ files) - Core utility functions
├── validation/          (3 files) - Input validation
├── youtube/             (8 files) - YouTube data extraction
├── auth.ts              (1 file)  - Lucia auth setup
├── db.ts                (1 file)  - Prisma + PostgreSQL
└── redis.ts             (1 file)  - Redis caching & pub/sub
```

---

## Core Libraries by Category

### 1. AI INTEGRATIONS (src/lib/ai/)
**Purpose:** LLM API interactions via OpenRouter, model management, content analysis

**Key Files:**
- `fetch-ai.ts` - Core OpenRouter API client with retry/timeout logic, cost calculation
- `models.ts` - AI model discovery, filtering, vision model detection, pricing management
- `analyze-url.ts` - Website content analysis & extraction
- `analyze-image.ts` - Image understanding & vision analysis
- `summarize.ts` - Content summarization with usage purpose targeting
- `extract-code.ts` - Code snippet extraction from content
- `generate-article-meta.ts` - Meta tag generation for SEO
- `json-validator.ts` - Response validation & parsing
- `keywords.ts` - Keyword extraction
- `summary-partition.ts` - Chunk-based summarization
- `index.ts` - Barrel export

**Supported Providers:** OpenAI, Anthropic, Google, Meta, Mistral, Perplexity, Groq, DeepSeek, QWen, etc.

**Default Models:**
- Text: google/gemini-2.5-flash (default), gpt-4o-mini, anthropic/claude-3.5-sonnet
- Vision: google/gemini-pro-1.5, openai/gpt-4o, anthropic/claude-3.5-sonnet

---

### 2. WEB SCRAPING (src/lib/scrape/)
**Purpose:** Multi-method HTML extraction with intelligent fallback strategy

**Scraping Methods (Fallback Chain):**
1. `get-html-with-axios.ts` - Lightweight HTTP requests (fastest)
2. `get-html-with-firecrawl.ts` - Advanced JS rendering
3. `get-html-with-playwright.ts` - Full browser automation
4. `get-html-with-scrapedo.ts` - Anti-detection service
5. `get-html-with-scrappey.ts` - Rotation/proxy service
6. `get-html-with-fallbacks.ts` - Orchestrator with HTML simplification

**Key Features:**
- HTML simplification (removes scripts, styles, comments, empty elements)
- Blocked website detection across all methods
- Configurable timeout & retry logic
- Token reduction for LLM processing

---

### 3. AUTHENTICATION (src/lib/auth.ts)
**Framework:** Lucia (session-based)

**Features:**
- OAuth2: GitHub, Google
- Session management with long expiration
- CSRF protection via origin verification
- Express middleware for request validation
- User attributes: email

**Related Files:**
- Uses Prisma adapter for session storage
- Integrates with PostgreSQL database

---

### 4. DATABASE (src/lib/db.ts)
**ORM:** Prisma  
**Database:** PostgreSQL

**Configuration:**
- Connection pooling (max: 20, min: 5 connections)
- Timeout handling (10s statement/query timeout)
- Prisma client singleton pattern
- Transaction timeout wrapper (10s default)
- Event logging for queries, errors, warnings

---

### 5. REDIS CACHING (src/lib/redis.ts)
**Client:** ioredis

**Features:**
- Publisher/subscriber pattern (pub/sub)
- Key-value caching with TTL
- Chat history management
- User room management
- Retry strategy with exponential backoff

**Key Functions:**
- `addToCache()` / `getFromCache()` / `clearCache()` - Basic cache ops
- `publishMessage()` / `subscribeToRoom()` - Real-time messaging
- `getChatHistory()` / `addUserToRoom()` - Chat features

---

### 6. PLAYWRIGHT BROWSER AUTOMATION (src/lib/playwright/)
**Purpose:** Headless browser operations for JS-heavy sites

**Components:**
- `browser-pool.ts` - Connection pool management
- `get-html-content.ts` - DOM extraction
- `get-images.ts` - Image scraping
- `screenshot.ts` - Page capture
- `index.ts` - Exports

---

### 7. PAYMENT PROCESSORS (src/lib/payment/)
**Supported Providers:**

**Polar** (`polar.ts`)
- SDK wrapper with sandbox/production modes
- Product listing
- Subscription management (cancel with reason)
- Cancel reasons: too_expensive, missing_features, switched_service, unused, customer_service, low_quality, too_complex, other

**SePay** (`sepay.ts`)
- Vietnamese payment processor

**LemonSqueezy** (`lemonsqueezy.ts`)
- Subscription & product management

**Bill Creation** (`create-bill.ts`)
- Invoice/billing infrastructure

---

### 8. EMAIL SERVICES (src/lib/email/)

**Elastic Email** (`elastic-email/`)
- HTML email support
- Sender/recipient validation
- Callback-based API

**Services:**
- `sendForgotPassword.ts`
- `sendLoginViaMagicLink.ts`
- `sendVerificationCode.ts`

**Resend** (`resend/`)
- Alternative email provider integration

---

### 9. CDN & STORAGE (src/lib/cdn/ + src/lib/upfile-best/)

**Cloudflare Workers KV** (`cdn/cloudflare/`)
- `transferImageToCDN.ts` - Image migration
- `uploadFile.ts` - File upload

**Upfile Best** (`cdn/upfile-best/` + `upfile-best/`)
- `upfileBestFetchClient.ts` - Client-side uploads
- `upfileBestFetchServer.ts` - Server-side uploads
- `uploadMetaFile.ts` - Metadata handling
- `get-upfile-key.ts` - Key generation

**Cloud Storage Abstraction** (`cloud-storage/`)
- `storage-upload.ts` - Unified upload interface
- `helper.ts` - Helper utilities
- `types.ts` - Type definitions

---

### 10. YOUTUBE INTEGRATION (src/lib/youtube/)
**Capabilities:**
- `youtube-info.ts` - Video metadata extraction
- `youtube-transcript.ts` - Captions/transcript retrieval
- `youtube-transcript-playwright.ts` - JS-based extraction fallback
- `youtube-caption-download.ts` - Caption file downloads
- `youtube-summary.ts` - Video summarization
- `youtube-to-article.ts` - Blog post generation
- `youtube-save.ts` - Video data persistence
- `types.ts` - Type definitions

---

### 11. TRANSLATION (src/lib/translate/)
**Features:**
- `translate.ts` - Multi-language support
- `settings.ts` - Language configuration
- i18n integration
- Supports multiple output languages

---

### 12. PROXY MANAGEMENT (src/lib/proxy/)
**Providers:**
- `webshare-proxy.ts` - WebShare rotating proxy service
- `proxy-utils.ts` - Proxy utilities & validation

---

### 13. GOOGLE SERVICES (src/lib/google/)
**google-oauth2.ts:**
- JWT service account authentication
- Google Indexing API scope
- Token caching with expiry checking
- Requires: GOOGLE_SERVICE_ACCOUNT_CREDENTIALS env var

---

### 14. SITEMAP MANAGEMENT (src/lib/sitemap/)
- `submit-sitemap.ts` - Sitemap submission to search engines
- `submit-index.ts` - URL indexing requests

---

### 15. UTILITIES (src/lib/utils/) - 30+ Files
**Core Helpers:**

**String Operations** (`string/`)
- `code-block.ts` - Code block parsing
- `contain.ts` - String matching
- `count.ts` - Character/word counting
- `extract.ts` - Pattern extraction
- `format.ts` - String formatting
- `humanize.ts` - Human-readable formatting
- `random.ts` - Random string generation
- `slug.ts` - URL slug generation
- `index.ts` - Exports

**Data Utilities:**
- `array.ts` - Array operations (sorting, filtering)
- `buffer.ts` - Buffer manipulations
- `date.ts` - Date handling
- `time.ts` - Time calculations
- `price.ts` - Currency formatting
- `ai-cost.ts` - LLM token cost calculation
- `email.ts` - Email validation
- `image.ts` - Image processing
- `upload.ts` - File upload helpers
- `os.ts` - OS detection
- `retry.ts` - Retry logic
- `wait.ts` - Delay utilities
- `country.ts` - Country data
- `tz-names.ts` - Timezone names
- `cssVar.ts` - CSS variable handling
- `mongodb/mongoObjectId.ts` - MongoDB ID utilities

**URL Utilities** (`url/`)
- `get-final-url.ts` - Redirect resolution
- `is-url-alive.ts` - URL liveness checking
- `index.ts` - Exports

---

### 16. VALIDATION (src/lib/validation/)
- `validatePassword.ts` - Password strength checking
- `validateUsername.ts` - Username validation
- Integration with Zod for schemas

---

### 17. PAGINATION (src/lib/pagination/)
- `helper.ts` - Pagination utilities

---

### 18. NETWORK (src/lib/network/)
- `ip.ts` - IP detection & validation

---

### 19. TRACKING (src/lib/tracking/)
- Analytics integration

---

## Key Architecture Patterns

### Fallback Strategy
Web scraping uses intelligent fallback chain:
```
axios (fast) → firecrawl → playwright → scrapedo → scrappey
```
Each method optimized for different website types.

### Caching Layer
- Redis for distributed caching with TTL
- In-memory model caching (AI models)
- Token-based cost tracking

### Error Handling
- Axios retry with exponential backoff (3-5 retries)
- Timeout management (5min default for AI requests)
- Graceful fallbacks with logging

### Type Safety
- Zod schemas for API responses
- TypeScript throughout
- Enum types for payment reasons, providers

### Database Pooling
- PostgreSQL with connection pooling
- Transaction timeout protection
- Idle connection management

---

## External Dependencies

**AI/LLM:**
- OpenRouter API (default)
- Multiple model providers via routing

**Browsers:**
- Playwright for automation

**Storage:**
- Cloudflare Workers KV
- Upfile Best CDN

**Payments:**
- Polar SDK
- SePay API
- LemonSqueezy

**Auth:**
- Lucia (session framework)
- Arctic (OAuth2)
- GitHub & Google OAuth

**Email:**
- Elastic Email API
- Resend

**Database:**
- Prisma ORM
- PostgreSQL
- Redis (ioredis)

---

## Environment Variables Required

**AI:**
- `OPENROUTER_KEY` - AI API access

**Auth:**
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`

**Database:**
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `REDIS_PREFIX` - Redis key prefix

**Payments:**
- `POLAR_ACCESS_TOKEN`, `POLAR_ORGANIZATION_ID`

**Email:**
- `ELASTIC_EMAIL_APIKEY`, `ELASTIC_EMAIL_FROM`

**CDN:**
- `CLOUDFLARE_CDN_ACCESS_KEY`, `CLOUDFLARE_CDN_SECRET_KEY`

**Google Services:**
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` - Service account JSON

---

## Performance Characteristics

**AI Requests:**
- Default timeout: 5 minutes
- Retry: 3 times with exponential backoff
- Cost tracking per request

**Database:**
- Pool: 5-20 connections
- Statement timeout: 10s
- Transaction timeout: 10s (configurable)

**Redis:**
- Retry strategy: exponential backoff
- Key prefix: configurable

**Web Scraping:**
- Multiple fallback methods
- HTML simplification for token reduction
- Supports proxy rotation via WebShare

---

## Testing & Debug Features

**Available Debug Flags:**
- `debug` option in AI fetching
- `skipCache` option for model listing
- Comprehensive console logging throughout

---

## Notable Implementation Details

1. **Blocked Website Detection** - Implemented across all scraping methods
2. **HTML Simplification** - Reduces token count by removing unnecessary DOM elements
3. **Model Caching** - 24-hour Redis cache for available AI models
4. **Session Persistence** - Lucia adapter with Prisma for reliable session storage
5. **Cost Calculation** - Automatic LLM cost tracking based on model & token usage
6. **Proxy Rotation** - WebShare integration for anti-detection
7. **Chat Features** - Redis-based real-time messaging with history

---

## Unresolved Questions

1. Is the `saveMessage` function in redis.ts actively used? (typo: "historysuwer")
2. Are all payment processors actively maintained and integrated with current flows?
3. What's the usage pattern for the translate module - is it production-ready?
4. Which email service (Elastic Email vs Resend) is primary?
5. Are Playwright and Firecrawl both needed, or can scraping strategy be consolidated?
