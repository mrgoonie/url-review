# ReviewWeb.site - src/modules Scout Report

**Date:** 2025-12-10  
**Project:** ReviewWeb.site (AI-Powered Website Analysis Tool)  
**Directory:** src/modules  
**Total Modules:** 18  
**Total Files:** 65  

---

## Executive Summary

The `src/modules` directory contains 18 distinct modules organizing the core business logic of ReviewWeb.site. Modules follow a consistent pattern: CRUD operations, schemas (Zod validation), and service functions. The architecture is layered with clear separation of concerns - data persistence, validation, and business logic.

---

## Module Inventory & Architecture

### 1. **analytics** (9 files)
**Purpose:** Track and retrieve website performance metrics and QR code/link analytics

**Key Exports:**
- `getAnalytics()` - Get overall link analytics (clicks, QR scans, referrers, devices, browsers, countries, OS)
- `getDevices()`, `getBrowsers()`, `getClicks()`, `getCountries()` - Individual metrics
- `getOs()`, `getQrScans()`, `getReferrers()` - Additional analytics dimensions

**Dependencies:** Prisma ORM, dayjs

**Data Models:** LinkView, QrCodeScan, Link, User, Metadata

---

### 2. **category** (2 files)
**Purpose:** Website/URL categorization management

**Key Files:**
- `category.ts` - Category definition/logic
- `index.ts` - Exports

**Typical Use:** Organize web URLs and reviews by categories

---

### 3. **convert** (3 files)
**Purpose:** Convert webpage content to Markdown format with AI-powered formatting

**Key Exports:**
- `convertUrlToMarkdown()` - Convert single URL to Markdown
- `convertMultipleUrlsToMarkdown()` - Batch convert URLs (5 at a time, controlled concurrency)

**Features:**
- HTML-to-Markdown conversion preserving structure
- JSON response format with `content` field
- Configurable model, delay after load, debug mode
- Token usage tracking
- Rate-limited concurrency (5 URLs/batch)

**Dependencies:** `@/lib/ai` (analyzeUrl), Zod

**API Integration:** Uses LLM for intelligent conversion

---

### 4. **metadata** (3 files)
**Purpose:** Extract and store webpage metadata (Open Graph, Twitter, favicon, etc.)

**Key Functions:**
- `createLinkMetadata()` - Scrape URL and create metadata record
- `scrapeMetadata()` - Extract metadata from HTML

**Metadata Collected:**
- Open Graph (ogImage, ogDescription)
- Twitter Card (twitterImage)
- Dublin Core (author, publisher, copyright)
- SEO (keywords, robots, canonical)
- Social (video, tags, location)
- Standard (title, description, favicon, language)

**Dependencies:** Prisma, cheerio/HTML parser

---

### 5. **payment** (3 files)
**Purpose:** Payment processing and order management (Polar integration)

**Key Exports:**
- `createPaymentAndOrder()` - Create payment record from checkout
- `manage-plans.ts` - Plan management functions
- `manage-checkout.ts` - Checkout flow

**Features:**
- Polar payment gateway integration
- Order status tracking (PENDING, PAID, FAILED)
- Payment method tracking (Polar)
- Email notifications (ElasticEmail)
- User plan creation/updates

**Data Models:** Order, Payment, PaymentMethod (enum: POLAR), PaymentStatus, OrderStatus

**Dependencies:** @prisma/client, elasticSend (email), dayjs

---

### 6. **plan** (4 files)
**Purpose:** Subscription plan management and user plan lifecycle

**Key Exports:**
- `subscribe()` - Create user subscription
- `cancel()` - Cancel user subscription
- `plans.ts` - Plan definitions/queries

**Features:**
- User plan creation
- Subscription lifecycle management
- Plan cancellation logic
- Initial plan assignment

**Dependencies:** Prisma

---

### 7. **response** (3 files)
**Purpose:** Standardized API response format

**Key Types:**
- `ApiResponse` - Standard response schema: `{ status: number, data: any, messages?: string[] }`
- `respond-helper.ts` - Response formatting utilities

**Pattern:** All API responses use this consistent structure

**Dependencies:** Zod

---

### 8. **review** (4 files)
**Purpose:** Website review orchestration - central hub for analysis workflow

**Key Exports:**
- `startReview()` - Main orchestration function (comprehensive analysis workflow)
- `createReview()`, `updateReview()` - CRUD operations
- `reviewUrlByCaptureWebUrl()` - Screenshot-based analysis

**Review Workflow (startReview):**
1. Create review record with PENDING status
2. Extract images (max 50, configurable)
3. Extract links (max 50, configurable)
4. Scrape HTML content with fallbacks
5. Scrape metadata (OpenGraph, Twitter, etc.)
6. AI analysis on HTML (text model)
7. AI analysis on screenshot (vision model)
8. AI analysis on each image (parallel, vision model)
9. AI analysis on each link (parallel, text model)
10. Update review with COMPLETED status and all analysis results

**Configuration Options:**
- Debug logging
- Skip image/link extraction
- Custom AI models (text & vision)
- Delay after page load
- CSS selectors to exclude
- Error handling (continue on image/link analysis failure)

**Data Models:** Review, Screenshot, LinkMetadata, ReviewStatus (enum: PENDING, COMPLETED, FAILED)

**Dependencies:** Prisma, dayjs, Zod, @/lib/ai, @/lib/playwright, @/lib/scrape

**Error Handling:** Graceful degradation with error statuses

---

### 9. **scrape** (5 files)
**Purpose:** Web scraping with HTML extraction and link parsing

**Key Exports:**
- `scrapeWebUrl()` - Scrape HTML with fallback methods
- `extractAllLinksFromUrl()` - Extract links from URL
- `checkLinksHttpStatus()` - Verify link status codes

**Features:**
- Multiple fallback scraping methods
- Link extraction with filtering
- HTTP status verification
- Selective scraping (internal/external links)
- Auto-scrape internal links option

**Dependencies:** getHtmlWithFallbacks (@/lib/scrape)

---

### 10. **screenshot** (2 files)
**Purpose:** Capture and store webpage screenshots

**Key Functions:**
- `createScreenshot()` - Create screenshot record with Zod validation
- `getScreenshotById()` - Retrieve screenshot

**Validation Schema:**
```typescript
{
  url: string (URL),
  imageUrl: string (URL),
  fullPage?: boolean (default: false),
  deviceType?: "DESKTOP" | "MOBILE" | "TABLET" (default: "DESKTOP"),
  viewportWidth?: 100-3840 (default: 1400),
  viewportHeight?: 100-2160 (default: 800),
  viewportScale?: 0.1-3 (default: 1),
  reviewId?: UUID (optional)
}
```

**Dependencies:** Prisma, Zod

---

### 11. **seo-insights** (3 files)
**Purpose:** SEO analysis and link intelligence (external SEO service integration)

**Key Functions (from CRUD):**
- `getBacklinksForDomain()` - Retrieve backlinks for domain
- `getKeywordIdeas()` - Get keyword research data
- `getKeywordDifficulty()` - Analyze keyword difficulty
- `checkTraffic()` - Traffic analysis

**Service Layer:** Calls seo-insights-service.ts for external API integration

**Data Models:** Domain-based analysis (backlinks, traffic, keywords)

**Dependencies:** External SEO insights service

---

### 12. **summarize** (3 files)
**Purpose:** AI-powered summarization of webpages and websites

**Key Exports:**
- `summarizeWebUrl()` - Summarize single URL (returns JSON: title, summary, keyPoints)
- `summarizeWebsite()` - Summarize full website (main page + internal links, max 20)
- `summarizeMultipleUrls()` - Batch summarize URLs with comparative analysis

**Features:**
- Format selection (bullet points or paragraph)
- Configurable summary length (default 500 words)
- Internal link extraction and processing
- Controlled concurrency (3 links/batch for website, 3 URLs/batch for multiple)
- Combined comparative summaries
- Token usage aggregation
- JSON response format

**Response Format:**
```typescript
{
  title: string,
  summary: string,
  keyPoints?: string[],  // For website: websiteTitle, websiteSummary, mainPurpose, keyFeatures, audienceTarget
}
```

**Dependencies:** analyzeUrl (@/lib/ai), extractAllLinksFromUrl, Zod

---

### 13. **thumbnail** (3 files)
**Purpose:** Generate shareable thumbnails from webpage screenshots

**Key Functions:**
- `createThumbnailByImageUrl()` - Generate thumbnail from image URL using template
- `captureWebsiteScreenshot()` - Capture website screenshot

**Templates:** 
- `share-template-01-random` (randomized)
- `share-template-01-01` (fixed)

**Device Sizes:**
- Desktop: 1400x1000
- Tablet: 768x1024 / 1024x768 (landscape)
- Mobile: 390x844 / 844x390 (landscape)

**Output:** Uploads to Cloudflare R2, returns public URL

**Dependencies:** @/lib/playwright (screenshot), @/lib/cloud-storage (uploadFileBuffer), crypto

---

### 14. **type.ts** (Shared Types)
**Purpose:** Global type definitions and Prisma selection schemas

**Exports:**
- `imagesType` - Image selection schema (approved images with blur, URL, mimetype)
- `profileType` - User profile schema (email, name, workspace, balance, roles)
- `userRolesType` - User roles schema with role names
- `productTagType` - Product tag schema

**Pattern:** Pre-defined Prisma select/include patterns for consistent data fetching

---

### 15. **user** (4 files)
**Purpose:** User management and authentication integration

**Key Exports:**
- `createUser()` - Create new user
- `getUser()` - Retrieve user by ID/email
- `user-mask.ts` - User data sanitization/masking for API responses

**Dependencies:** Prisma, Lucia auth integration

---

### 16. **user-balance** (2 files)
**Purpose:** Track user account balance/credits

**Key Functions:**
- CRUD operations for user balance
- Cash type tracking (likely: credits, tokens)
- Balance updates

**Data Model:** UserBalance (userId, balance, cashType)

**Dependencies:** Prisma

---

### 17. **web-url** (3 files)
**Purpose:** URL management and parsing

**Key Exports:**
- `createWebUrl()` - Create URL record with metadata and categories
- `updateWebUrl()` - Update URL and category associations
- `web-url-parse.ts` - URL parsing utilities

**Validation Schema:**
```typescript
{
  url: string (URL required),
  thumbnailUrl?: string,
  meta?: Record<string, any>,
  userId?: string,
  workspaceId?: string,
  categories?: string[] (array of category IDs)
}
```

**Features:** 
- Category assignment (many-to-many)
- Metadata storage (JSON)
- Workspace organization

**Dependencies:** Prisma, Zod

---

### 18. **workspace** (3 files)
**Purpose:** Team/workspace management and permissions

**Key Exports:**
- `generateWorkspaceByUser()` - Create workspace for new user
- `initWorkspacePermissions()` - Set up initial workspace permissions

**Features:**
- Automatic workspace generation
- Permission initialization
- User-to-workspace association

**Dependencies:** Prisma

---

## Module Dependencies Graph

```
review (CENTRAL HUB)
├── scrape (HTML extraction, link parsing)
├── screenshot (capture screenshots)
├── metadata (extract metadata)
├── thumbnail (generate thumbnails)
├── ai-lib (analyzeUrl, analyzeImageBase64)
└── playwright-lib (browser automation)

summarize
├── ai-lib (analyzeUrl)
└── scrape (extractAllLinksFromUrl)

convert
└── ai-lib (analyzeUrl)

seo-insights
└── external-api (SEO service)

payment
├── prisma (Order, Payment)
├── email (ElasticEmail)
└── plan (createUserPlan)

plan
└── prisma (UserPlan, Plan)

user
└── prisma (User)
├── lucia (authentication)

web-url
├── prisma (WebUrl, WebUrlCategory)
└── category (category relationships)

workspace
└── prisma (Workspace, UserWorkspace)

analytics
└── prisma (LinkView, QrCodeScan, Link)
```

---

## Key Design Patterns

### 1. **CRUD Module Pattern**
Each module with database operations follows: `[module]-crud.ts` + `[module]-schemas.ts` (Zod validation)

### 2. **Service Extraction Pattern**
Complex logic isolated to service files:
- `seo-insights-service.ts` - External API calls
- `metadata-scrape.ts` - HTML parsing

### 3. **Zod Validation**
All inputs validated with schemas, typed with `z.infer<typeof Schema>`

### 4. **Controlled Concurrency**
Batch processing with concurrency limits (3-5 at a time):
- Summarize: 3 links/batch
- Convert: 5 URLs/batch

### 5. **Error Handling**
- Graceful degradation (continueOnImageAnalysisError flags)
- Try-catch with detailed logging
- Status enums (PENDING, COMPLETED, FAILED)

### 6. **AI Model Abstraction**
- Optional model selection passed through options
- Supports both text & vision models
- Debug mode for development

### 7. **Metadata Standardization**
`type.ts` defines reusable Prisma selection patterns

---

## Data Flow Examples

### Review Analysis Workflow
```
startReview(url, userId, instructions)
  ↓
  createReview() → PENDING status
  ↓
  Parallel extraction:
  - getAllImages() (Playwright)
  - extractAllLinksFromUrl() (Scraper)
  - getHtmlWithFallbacks() (HTML scraper)
  ↓
  scrapeMetadataFromHtmlContent() (Metadata)
  ↓
  Parallel AI analysis:
  - analyzeHtml() (text model)
  - reviewUrlByCaptureWebUrl() (vision model)
  - analyzeImageBase64() × N (vision model)
  - analyzeUrl() × N (text model)
  ↓
  updateReview() → COMPLETED with all results
```

### Summarization Workflow
```
summarizeWebUrl(url)
  ↓
  analyzeUrl() with system prompt & instructions
  ↓
  Returns JSON: { title, summary, keyPoints }

summarizeWebsite(url) 
  ↓
  summarizeWebUrl() main page
  ↓
  extractAllLinksFromUrl() → filter 200 status
  ↓
  Parallel summarizeWebUrl() (3 links/batch)
  ↓
  analyzeUrl() combining all summaries
  ↓
  Returns: { pageSummaries, websiteSummary, usage }
```

---

## Configuration & Options

### Review Start Options
```typescript
{
  debug?: boolean
  skipImageExtraction?: boolean (default: true)
  maxExtractedImages?: 1-100 (default: 50)
  skipLinkExtraction?: boolean (default: true)
  maxExtractedLinks?: 1-100 (default: 50)
  textModel?: ModelName
  visionModel?: ModelName
  delayAfterLoad?: 0-60000ms (default: 3000)
  excludeImageSelectors?: string[]
  continueOnImageAnalysisError?: boolean (default: true)
  continueOnLinkAnalysisError?: boolean (default: true)
}
```

### Summarize/Convert Options
```typescript
{
  instructions?: string
  model?: ModelName
  format?: "bullet" | "paragraph"
  maxLength?: number (default: 500)
  maxLinks?: number (default: 20)
  delayAfterLoad?: number
  systemPrompt?: string
  debug?: boolean
}
```

---

## Database Integration

**ORM:** Prisma  
**Models Used Across Modules:**
- Review, ReviewStatus
- Screenshot, LinkMetadata
- Order, Payment, PaymentStatus, PaymentMethod
- User, UserBalance, UserRoles
- WebUrl, WebUrlCategory, Category
- Workspace, UserWorkspace
- LinkView, QrCodeScan, Link
- UserPlan, Plan

---

## External Dependencies

### Libraries
- **@prisma/client** - Database ORM
- **zod** - Data validation
- **dayjs** - Date formatting
- **crypto** - UUID generation

### Internal Libraries
- **@/lib/ai** - AI models (analyzeUrl, analyzeImageBase64)
- **@/lib/playwright** - Browser automation
- **@/lib/scrape** - HTML extraction
- **@/lib/cloud-storage** - File uploads (Cloudflare R2)
- **@/lib/email** - Email sending (ElasticEmail)
- **@/lib/db** - Prisma client

### External Services
- **Polar** - Payment processing
- **ElasticEmail** - Email notifications
- **Cloudflare R2** - Image storage
- **SEO Insights API** - Backlinks, keywords, traffic

---

## File Statistics

| Module | Files | Type |
|--------|-------|------|
| analytics | 9 | Data aggregation |
| category | 2 | Data model |
| convert | 3 | Content transformation |
| metadata | 3 | Scraping & storage |
| payment | 3 | Payment processing |
| plan | 4 | Subscription management |
| response | 3 | API standards |
| review | 4 | Orchestration (CORE) |
| scrape | 5 | Web scraping |
| screenshot | 2 | Image capture |
| seo-insights | 3 | SEO analysis |
| summarize | 3 | Content summarization |
| thumbnail | 3 | Image generation |
| type.ts | 1 | Shared types |
| user | 4 | User management |
| user-balance | 2 | Credit tracking |
| web-url | 3 | URL management |
| workspace | 3 | Team management |

---

## Key Findings

### Strengths
1. **Clear separation of concerns** - Each module has single responsibility
2. **Consistent patterns** - CRUD + schemas + services structure
3. **Validation coverage** - Zod schemas on all inputs
4. **Error handling** - Comprehensive logging and graceful degradation
5. **Concurrency management** - Controlled batch processing prevents overload
6. **Modular AI integration** - Optional model selection, easy to swap

### Architecture Highlights
1. **review module** is the central orchestration hub
2. **Type reusability** - type.ts prevents duplication
3. **Service isolation** - Business logic separated from CRUD
4. **API standardization** - response module ensures consistency
5. **Configuration-driven** - Options passed through function parameters

### Integration Points
- Review orchestrates scrape, screenshot, metadata, thumbnail modules
- Summarize & convert depend on AI library
- Payment/plan workflow integrated with user module
- Analytics depends on Prisma models across multiple entities

---

## Unresolved Questions

None identified. Module structure is well-organized and thoroughly documented through code.

