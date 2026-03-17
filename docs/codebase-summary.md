# ReviewWeb.site - Codebase Summary

## Overview

ReviewWeb.site codebase is a Node.js/TypeScript application organized around Express.js framework with clear separation between business modules (`src/modules/`) and utility libraries (`src/lib/`). The architecture emphasizes modularity, validation, and graceful error handling.

**Language:** TypeScript
**Runtime:** Node.js v20+
**Package Manager:** Bun (primary), npm (compatible)
**Total Files:** 648 (including binary)
**Total Tokens:** ~25.8M (complete codebase)

---

## Directory Structure

```
reviewweb-site/
├── docs/                          # Documentation
│   ├── project-overview-pdr.md    # Vision, goals, requirements
│   ├── code-standards.md          # Coding guidelines
│   ├── system-architecture.md     # Architecture overview
│   └── codebase-summary.md        # This file
├── src/
│   ├── app.ts                     # Express app initialization
│   ├── env.ts                     # Environment variables
│   ├── server.ts                  # Server entry point
│   │
│   ├── middlewares/               # Express middlewares
│   │   ├── csrf.ts                # CSRF protection
│   │   ├── api_key_auth.ts        # API key validation
│   │   └── check-plan-limits.ts   # Rate limiting
│   │
│   ├── modules/                   # Business logic (18 modules)
│   │   ├── analytics/             # Performance metrics, analytics
│   │   ├── category/              # Content categorization
│   │   ├── convert/               # HTML-to-Markdown conversion
│   │   ├── metadata/              # OG/Twitter metadata extraction
│   │   ├── payment/               # Payment processing
│   │   ├── plan/                  # Subscription management
│   │   ├── response/              # API response formatting
│   │   ├── review/                # CORE: Website analysis orchestration
│   │   ├── scrape/                # Web scraping
│   │   ├── screenshot/            # Screenshot capture
│   │   ├── seo-insights/          # SEO analysis
│   │   ├── summarize/             # AI-powered summarization
│   │   ├── thumbnail/             # Social thumbnail generation
│   │   ├── user/                  # User management
│   │   ├── user-balance/          # Credit tracking
│   │   ├── web-url/               # URL management
│   │   └── workspace/             # Team management
│   │
│   ├── lib/                       # Utility libraries (97 files)
│   │   ├── ai/                    # LLM integrations (OpenRouter)
│   │   ├── auth.ts                # Lucia authentication setup
│   │   ├── cdn/                   # CDN providers (Cloudflare, Upfile)
│   │   ├── cloud-storage/         # Cloud storage abstraction
│   │   ├── db.ts                  # Prisma + PostgreSQL
│   │   ├── email/                 # Email services (Elastic Email, Resend)
│   │   ├── google/                # Google OAuth2 & APIs
│   │   ├── network/               # Network utilities
│   │   ├── payment/               # Payment providers
│   │   ├── playwright/            # Browser automation
│   │   ├── proxy/                 # Proxy management
│   │   ├── redis.ts               # Redis caching & pub/sub
│   │   ├── scrape/                # Web scraping methods
│   │   ├── utils/                 # 30+ utility helpers
│   │   ├── validation/            # Input validation
│   │   └── youtube/               # YouTube integration
│   │
│   ├── routes/                    # API routes (16 modules)
│   │   ├── api/                   # /api/v1/* endpoints
│   │   ├── auth/                  # Authentication routes
│   │   ├── pages/                 # Web pages (EJS templates)
│   │   └── webhooks/              # Payment webhooks
│   │
│   ├── schemas/                   # Zod validation schemas
│   │   └── broken-link-schemas.ts # Broken link validation
│   │
│   ├── views/                     # EJS templates
│   │   ├── layouts/               # Layout templates
│   │   ├── pages/                 # Page templates
│   │   └── components/            # Reusable components
│   │
│   ├── public/                    # Static assets
│   │   ├── assets/                # Images, fonts, CSS
│   │   ├── theme/                 # Theme assets
│   │   └── js/                    # Client-side JavaScript
│   │
│   └── types/                     # Global TypeScript types
│
├── prisma/
│   ├── schema.prisma              # Database schema (40+ models)
│   └── migrations/                # Database migrations
│
├── bin/
│   └── yt-dlp                     # YouTube downloader binary
│
├── .github/workflows/             # GitHub Actions CI/CD
├── .env.example                   # Environment template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── eslint.config.js               # Linting rules
├── tailwind.config.cjs            # Tailwind theming
├── Dockerfile                     # Container configuration
└── docker-compose.yml             # Local development stack
```

---

## Core Modules

### 1. Review (CENTRAL HUB)
**Files:** 4 | **Purpose:** Website analysis orchestration

Implements 10-step analysis workflow:
1. Create review record (PENDING)
2. Extract images (max 50)
3. Extract links (max 50)
4. Scrape HTML content
5. Extract metadata (OG, Twitter, SEO)
6. Analyze HTML (text model)
7. Screenshot analysis (vision model)
8. Image analysis (parallel, vision)
9. Link analysis (parallel, text)
10. Update review (COMPLETED)

**Key Exports:**
- `startReview()` - Main orchestration
- `createReview()`, `updateReview()` - CRUD
- `reviewUrlByCaptureWebUrl()` - Screenshot analysis

**Dependencies:** scrape, screenshot, metadata, ai-lib, playwright-lib

---

### 2. Scrape
**Files:** 5 | **Purpose:** Web scraping with intelligent fallbacks

**Fallback Chain:**
1. Axios (HTTP request)
2. Firecrawl (JS rendering)
3. Playwright (browser automation)
4. Scrapedo (anti-detection)
5. Scrappey (proxy rotation)

**Key Exports:**
- `scrapeWebUrl()` - HTML extraction
- `extractAllLinksFromUrl()` - Link discovery
- `checkLinksHttpStatus()` - Status verification

**Features:**
- HTML simplification (removes scripts, styles, comments)
- Blocked website detection
- Configurable timeout/retry
- Token reduction for LLM

---

### 3. Summarize
**Files:** 3 | **Purpose:** AI-powered content summarization

**Key Functions:**
- `summarizeWebUrl()` - Single URL (JSON: title, summary, keyPoints)
- `summarizeWebsite()` - Full website (main + internal links, max 20)
- `summarizeMultipleUrls()` - Batch with comparative analysis

**Features:**
- Format selection (bullet/paragraph)
- Configurable summary length (default 500 words)
- Controlled concurrency (3 links/batch)
- Token usage aggregation
- JSON response format

---

### 4. Convert
**Files:** 3 | **Purpose:** HTML-to-Markdown conversion

**Key Exports:**
- `convertUrlToMarkdown()` - Single URL to Markdown
- `convertMultipleUrlsToMarkdown()` - Batch conversion (5 at a time)

**Features:**
- AI-enhanced Markdown formatting
- Configurable model/instructions
- Debug mode for development
- Rate-limited concurrency

---

### 5. Screenshot
**Files:** 2 | **Purpose:** Webpage screenshot capture & storage

**Validation Schema:**
```typescript
{
  url: string
  imageUrl: string
  fullPage?: boolean (default: false)
  deviceType?: "DESKTOP" | "MOBILE" | "TABLET" (default: "DESKTOP")
  viewportWidth?: 100-3840 (default: 1400)
  viewportHeight?: 100-2160 (default: 800)
  viewportScale?: 0.1-3 (default: 1)
  reviewId?: UUID
}
```

**Key Functions:**
- `createScreenshot()` - Create record with validation
- `getScreenshotById()` - Retrieve screenshot

---

### 6. Metadata
**Files:** 3 | **Purpose:** Extract & store webpage metadata

**Metadata Collected:**
- Open Graph (ogImage, ogDescription, ogTitle, ogUrl, ogType)
- Twitter Card (twitterImage, twitterTitle, twitterDescription)
- Dublin Core (author, publisher, copyright)
- SEO (keywords, robots, canonical, viewport)
- Social (video, tags, location)
- Standard (title, description, favicon, language, charset)

**Key Functions:**
- `createLinkMetadata()` - Scrape and create record
- `scrapeMetadata()` - Extract from HTML

---

### 7. Payment
**Files:** 3 | **Purpose:** Payment processing (Polar integration)

**Key Functions:**
- `createPaymentAndOrder()` - Create payment record from checkout
- `manage-plans.ts` - Plan management
- `manage-checkout.ts` - Checkout flow

**Supported Providers:**
- Polar (primary)
- SePay (secondary)
- LemonSqueezy (tertiary)

---

### 8. Plan
**Files:** 4 | **Purpose:** Subscription lifecycle management

**Key Functions:**
- `subscribe()` - Create user subscription
- `cancel()` - Cancel subscription
- `getUserPlanLimits()` - Get per-minute/per-month limits

**Data Models:**
- Plan (name, tier, limits)
- UserPlan (userId, planId, startDate, endDate)
- WorkspacePlan (workspaceId, planId)

---

### 9. Response
**Files:** 3 | **Purpose:** Standardized API response format

**ApiResponse Schema:**
```typescript
{
  status: number
  data: any
  messages?: string[]
}
```

**Usage:** All API responses follow this consistent structure for predictable client handling.

---

### 10. User
**Files:** 4 | **Purpose:** User management & authentication

**Key Functions:**
- `createUser()` - Create new user
- `getUser()` - Retrieve by ID/email
- `user-mask.ts` - Data sanitization for API responses

**Integration:** Lucia authentication, OAuth2 (GitHub, Google)

---

### 11. Workspace
**Files:** 3 | **Purpose:** Team/workspace management

**Key Functions:**
- `generateWorkspaceByUser()` - Auto-create workspace for new user
- `initWorkspacePermissions()` - Set up initial RBAC

**Features:**
- Multi-tenant isolation
- User-to-workspace association
- Permission inheritance

---

### 12. Web-URL
**Files:** 3 | **Purpose:** URL management and categorization

**Validation Schema:**
```typescript
{
  url: string (required)
  thumbnailUrl?: string
  meta?: Record<string, any>
  userId?: string
  workspaceId?: string
  categories?: string[]
}
```

**Features:**
- Category assignment (M:N)
- Metadata storage (JSON)
- Workspace organization

---

### 13. Category
**Files:** 2 | **Purpose:** Content categorization

**Use Cases:**
- Organize URLs by type (landing page, blog, product, etc.)
- Filter and search by category
- Workspace-level categorization

---

### 14. Thumbnail
**Files:** 3 | **Purpose:** Social-shareable thumbnail generation

**Features:**
- Multiple templates (randomized, fixed)
- Device-specific dimensions
- Cloudflare R2 upload
- Public URL generation

**Device Sizes:**
- Desktop: 1400x1000
- Tablet: 768x1024 / 1024x768
- Mobile: 390x844 / 844x390

---

### 15. Analytics
**Files:** 9 | **Purpose:** Performance metrics & tracking

**Tracked Metrics:**
- Link clicks and referrers
- QR code scans
- Device types and browsers
- Countries and operating systems
- Detailed time-series data

**Key Functions:**
- `getAnalytics()` - Overall analytics
- `getDevices()`, `getBrowsers()`, `getClicks()` - Specific metrics
- `getCountries()`, `getOs()`, `getQrScans()` - Additional dimensions

---

### 16. User-Balance
**Files:** 2 | **Purpose:** Credit/token tracking

**Use Cases:**
- Track available credits per user
- Track token usage per request
- Support multiple cash types (credits, tokens)
- Balance updates and deductions

---

### 17. SEO-Insights
**Files:** 3 | **Purpose:** External SEO service integration

**Functions:**
- `getBacklinksForDomain()` - Backlink analysis
- `getKeywordIdeas()` - Keyword research
- `getKeywordDifficulty()` - SEO difficulty score
- `checkTraffic()` - Traffic estimation

---

### 18. Type.ts (Shared)
**Purpose:** Reusable Prisma selection patterns

**Exports:**
- `imagesType` - Image selection schema
- `profileType` - User profile schema
- `userRolesType` - User roles schema
- `productTagType` - Product tag schema

**Pattern:** Prevents duplication, ensures consistency across modules.

---

## Core Libraries (src/lib/)

### AI Integration (11 files)
**Location:** `src/lib/ai/`

**Primary Provider:** OpenRouter (25+ model providers)

**Key Components:**
- `fetch-ai.ts` - OpenRouter API client with retry/timeout
- `models.ts` - Model discovery, filtering, vision detection
- `analyze-url.ts` - Website content analysis
- `analyze-image.ts` - Image understanding (vision)
- `summarize.ts` - Content summarization
- `extract-code.ts` - Code snippet extraction
- `generate-article-meta.ts` - SEO meta tag generation
- `json-validator.ts` - Response parsing/validation
- `keywords.ts` - Keyword extraction

**Supported Models:**
- Text (default): google/gemini-2.5-flash
- Vision (default): google/gemini-pro-1.5
- Alternative: OpenAI, Anthropic, Meta, Mistral, Perplexity, Groq, DeepSeek

**Features:**
- Retry logic with exponential backoff
- Token-based cost calculation
- Model-specific parameters
- Debug mode for development

---

### Web Scraping (6 files)
**Location:** `src/lib/scrape/`

**Orchestrator:** `get-html-with-fallbacks.ts`

**Methods (in priority order):**
1. `get-html-with-axios.ts` - Lightweight HTTP
2. `get-html-with-firecrawl.ts` - JS rendering
3. `get-html-with-playwright.ts` - Full browser
4. `get-html-with-scrapedo.ts` - Anti-detection
5. `get-html-with-scrappey.ts` - Proxy rotation

**Features:**
- Automatic fallback on failure
- HTML simplification (removes unnecessary DOM)
- Blocked website detection across all methods
- Configurable timeout and retry
- Token reduction for LLM processing

---

### Authentication (auth.ts)
**Framework:** Lucia (session-based)

**Features:**
- OAuth2: GitHub, Google
- Session management (7-day expiration)
- CSRF protection via origin verification
- Express middleware
- PostgreSQL session storage via Prisma

---

### Database (db.ts)
**ORM:** Prisma
**Database:** PostgreSQL

**Configuration:**
- Connection pooling (5-20 connections)
- Statement timeout: 10s
- Query timeout: 10s
- Transaction timeout: 10s (configurable)
- Event logging (queries, errors, warnings)

---

### Redis (redis.ts)
**Client:** ioredis

**Features:**
- Key-value caching with TTL
- Pub/Sub messaging
- Chat history management
- User room management
- Exponential backoff retry

**Key Functions:**
- `addToCache()`, `getFromCache()`, `clearCache()`
- `publishMessage()`, `subscribeToRoom()`
- `getChatHistory()`, `addUserToRoom()`

---

### Browser Automation (4 files)
**Location:** `src/lib/playwright/`

**Components:**
- `browser-pool.ts` - Connection pooling
- `get-html-content.ts` - DOM extraction
- `get-images.ts` - Image scraping
- `screenshot.ts` - Page capture

---

### Payment Processors (4 files)
**Location:** `src/lib/payment/`

**Providers:**
- `polar.ts` - Polar SDK wrapper (primary)
- `sepay.ts` - Vietnamese payments
- `lemonsqueezy.ts` - Alternative provider
- `create-bill.ts` - Invoice generation

---

### Email Services (6 files)
**Location:** `src/lib/email/`

**Providers:**
- Elastic Email (primary)
- Resend (alternative)

**Functions:**
- `sendForgotPassword()`
- `sendLoginViaMagicLink()`
- `sendVerificationCode()`

---

### CDN & Storage
**Locations:** `src/lib/cdn/`, `src/lib/cloud-storage/`, `src/lib/upfile-best/`

**Providers:**
- Cloudflare Workers KV (primary)
- Upfile Best CDN (secondary)

**Key Functions:**
- `uploadFile()` - File upload with CDN
- `transferImageToCDN()` - Image migration
- `uploadMetaFile()` - Metadata handling

---

### Utilities (30+ files)
**Location:** `src/lib/utils/`

**Categories:**
- **String:** code-block, contain, count, extract, format, humanize, random, slug
- **Data:** array, buffer, date, time, price, ai-cost, email, image, upload
- **URL:** get-final-url, is-url-alive
- **Other:** os, retry, wait, country, tz-names, cssVar, mongodb

---

### YouTube Integration (8 files)
**Location:** `src/lib/youtube/`

**Capabilities:**
- `youtube-info.ts` - Video metadata
- `youtube-transcript.ts` - Caption extraction
- `youtube-summary.ts` - AI video summarization
- `youtube-to-article.ts` - Blog post generation
- `youtube-save.ts` - Data persistence

---

### Other Libraries
- **Translation** (3 files): i18n support
- **Proxy** (3 files): WebShare rotating proxies
- **Google** (1 file): OAuth2, Indexing API
- **Sitemap** (2 files): Sitemap submission
- **Validation** (3 files): Password, username strength
- **Network** (1 file): IP detection
- **Pagination** (1 file): Pagination helpers
- **Tracking** (1 file): Analytics integration

---

## Database Schema (40+ Models)

### Authentication & Sessions
- `User` - User account
- `Session` - Active sessions
- `Key` - API keys
- `Account` - OAuth accounts
- `PasswordResetToken` - Password recovery

### Authorization (RBAC)
- `Role` - Roles (Admin, User, Viewer)
- `Permission` - Permissions
- `UserRole` - User-to-role assignment

### Workspaces
- `Workspace` - Team workspace
- `UserWorkspace` - User-to-workspace
- `WorkspacePermission` - Workspace RBAC

### Subscriptions
- `Plan` - Subscription tier definition
- `UserPlan` - User subscription
- `WorkspacePlan` - Workspace subscription
- `Order` - Payment orders
- `Payment` - Payment records
- `CashTransaction` - Balance transactions

### Content & Analysis
- `Review` - Website analysis record
- `Screenshot` - Captured images
- `WebUrl` - URL records
- `WebUrlCategory` - URL categorization
- `Category` - Category definitions
- `BrokenLink` - Broken link tracking
- `ScanLinkResult` - Link scan results
- `MetaFile` - Meta data storage

### Analytics
- `Link` - Link tracking
- `LinkView` - Link click/view
- `QrCodeScan` - QR code analytics
- `Metadata` - Generic metadata storage

### Management
- `ApiKey` - API key records
- `UserBalance` - Credit tracking

---

## Middleware Stack

### 1. CSRF Protection
**File:** `src/middlewares/csrf.ts`

- Uses `csrf-csrf` library
- Double CSRF token pattern
- Strict SameSite cookies
- Production-only secure flag

---

### 2. API Key Authentication
**File:** `src/middlewares/api_key_auth.ts`

- Extract key from header or Bearer token
- Database validation via Prisma
- Attach user to res.locals
- 401 on invalid key

---

### 3. Plan Limits (Rate Limiting)
**File:** `src/middlewares/check-plan-limits.ts`

- Per-minute sliding window (Redis)
- Per-month calendar-based (Redis)
- Plan-based limit enforcement
- 429 on rate limit exceeded

---

## API Routes (16 modules)

### Core Endpoints
- `/api/v1/review` - Website review CRUD
- `/api/v1/scrape` - Web scraping & extraction
- `/api/v1/screenshot` - Screenshot capture
- `/api/v1/convert` - URL-to-Markdown
- `/api/v1/summarize` - Content summarization
- `/api/v1/profile` - User profile
- `/api/v1/api_key` - API key management
- `/api/v1/ai/models` - Available AI models

### Additional Routes
- `/auth/*` - OAuth/session management
- `/webhooks/*` - Payment webhooks
- `/*` - Web pages (EJS templates)

---

## Key Design Patterns

### 1. Module Pattern
Each business module follows:
- `[module]-crud.ts` - Database operations
- `[module]-schemas.ts` - Zod validation
- Optional service files for complex logic

### 2. Service Extraction
Complex logic isolated in service files:
- `seo-insights-service.ts` - External API
- `metadata-scrape.ts` - HTML parsing

### 3. Zod Validation
All inputs validated with Zod schemas:
- Request body validation
- Type inference: `z.infer<typeof Schema>`

### 4. Controlled Concurrency
Batch processing with limits:
- Summarize: 3 links/batch
- Convert: 5 URLs/batch
- Prevents resource exhaustion

### 5. Error Handling
- Graceful degradation with fallbacks
- Try-catch with detailed logging
- Status enums (PENDING, COMPLETED, FAILED)

### 6. Type Reusability
`type.ts` defines common Prisma select patterns:
- `imagesType` - Image schema
- `profileType` - User profile
- `userRolesType` - Roles
- Prevents duplication across modules

---

## Configuration & Environment

### Key Environment Variables

**AI & Services:**
- `OPENROUTER_KEY` - LLM API key
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection

**Authentication:**
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Payments:**
- `POLAR_ACCESS_TOKEN`, `POLAR_ORGANIZATION_ID`
- `SEPAY_API_KEY`, `SEPAY_PARTNER_CODE`

**Email & CDN:**
- `ELASTIC_EMAIL_APIKEY`, `ELASTIC_EMAIL_FROM`
- `CLOUDFLARE_CDN_ACCESS_KEY`, `CLOUDFLARE_CDN_SECRET_KEY`

---

## Performance Characteristics

### Timeouts
- AI requests: 5 minutes default
- Database statements: 10 seconds
- Scraping: Configurable per method

### Retry Strategy
- Exponential backoff (3-5 retries)
- Jittered delays to prevent thundering herd

### Caching
- Redis with configurable TTL
- Model caching (24-hour)
- Session storage

### Concurrency
- Database pool: 5-20 connections
- Browser pool: Configurable instances
- API rate limiting: Per-plan, per-minute/month

---

## Testing & Development

### Tools & Frameworks
- TypeScript strict mode
- Zod for runtime validation
- ESLint + Prettier for formatting
- Commitlint for commit messages

### Debug Features
- `debug` option in most functions
- Comprehensive error logging
- Request/response logging

---

## Data Flow Examples

### Website Review Workflow
```
POST /api/v1/review { url, instructions }
  ↓
1. createReview() → PENDING
  ↓
2. Parallel extraction:
   - getAllImages() (Playwright)
   - extractAllLinksFromUrl() (Scraper)
   - getHtmlWithFallbacks() (HTML scraper)
  ↓
3. scrapeMetadataFromHtmlContent()
  ↓
4. Parallel AI analysis:
   - analyzeHtml() (text)
   - reviewUrlByCaptureWebUrl() (vision)
   - analyzeImageBase64() × N (vision)
   - analyzeUrl() × N (text)
  ↓
5. updateReview() → COMPLETED
  ↓
GET /api/v1/review/{id} → Full analysis
```

### Summarization Workflow
```
POST /api/v1/summarize/website { url }
  ↓
1. summarizeWebUrl(url) main page
  ↓
2. extractAllLinksFromUrl() → filter 200 status
  ↓
3. Parallel summarizeWebUrl() (3 links/batch)
  ↓
4. analyzeUrl() combining all summaries
  ↓
5. Response: { pageSummaries, websiteSummary, usage }
```

---

## Dependencies at a Glance

### Runtime Dependencies
- express - HTTP server
- prisma - ORM
- lucia - Authentication
- zod - Validation
- playwright - Browser automation
- ioredis - Redis client
- dayjs - Date handling
- cheerio - HTML parsing

### Development Dependencies
- typescript - Type checking
- eslint - Code quality
- prettier - Code formatting
- @tailwindcss - Styling

---

## Deployment & Docker

### Container Base
- Node.js 20.15.1
- Python 3 (for build tools)
- Playwright browsers (Firefox, Chromium)
- GStreamer libraries (media support)
- Audio/video codecs (multimedia)

### Build Steps
1. System dependencies
2. Package managers (pnpm, Bun)
3. npm/Bun dependencies
4. Playwright browser installation
5. Source code copy
6. Prisma client generation
7. Ready for port 3000

---

## Key Metrics & Stats

| Metric | Value |
|--------|-------|
| Total Files | 648 |
| TypeScript Files | 300+ |
| Business Modules | 18 |
| Library Files | 97 |
| Database Models | 40+ |
| API Endpoints | 16+ |
| Supported AI Providers | 25+ |
| Scraping Methods | 5 |

---

## Notable Implementation Details

1. **Blocked Website Detection** - Across all scraping methods
2. **HTML Simplification** - Reduces tokens by 40-60%
3. **Model Caching** - 24-hour Redis cache
4. **Session Persistence** - Lucia + Prisma
5. **Cost Calculation** - Automatic LLM cost tracking
6. **Proxy Rotation** - WebShare integration
7. **Multi-tenant** - Workspace-based isolation
8. **Real-time** - Redis pub/sub for messaging

---

## Common Tasks

### Add New Module
1. Create `src/modules/[name]/`
2. Add `[name]-crud.ts` (CRUD operations)
3. Add `[name]-schemas.ts` (Zod validation)
4. Add service files if needed
5. Export from `index.ts`

### Add API Endpoint
1. Create route in `src/routes/api/[module]/`
2. Import CRUD functions
3. Add Zod validation
4. Use response module for consistent format
5. Test with curl or API client

### Add Database Model
1. Update `prisma/schema.prisma`
2. Create migration: `bun run db:create`
3. Apply: `bun run db:push`
4. Generate Prisma client: `bun run db`

### Debug Scraping Issue
1. Enable `debug: true` option
2. Check console logs for method used
3. Check fallback chain order
4. Test individual methods separately
5. Consider blocked website detection

---

## Related Documentation

- **Project Overview & PDR:** `/docs/project-overview-pdr.md`
- **Code Standards & Guidelines:** `/docs/code-standards.md`
- **System Architecture:** `/docs/system-architecture.md`

---

**Last Updated:** 2025-12-10
**Version:** 1.0
**Maintained By:** Development Team
