# ReviewWeb.site Codebase Scout Report
**Date:** 2025-12-10  
**Time:** 02:31 UTC  
**Project:** ReviewWeb.site - AI-powered website analysis tool  
**Scope:** src/routes, src/config, src/views, prisma/ directories  

---

## Executive Summary

ReviewWeb.site is a Node.js/Express REST API application with a PostgreSQL database (Prisma ORM) and EJS templating system. The application provides AI-powered website analysis, scraping, content extraction, and screenshot capabilities. Architecture follows REST conventions with v1 API prefix, session-based + API key authentication via Lucia, and role-based access control.

**Key Stats:**
- **API Routes:** 16 main endpoint modules + webhooks
- **Database Models:** 40+ Prisma models covering users, authentication, workspaces, reviews, payments, and business logic
- **View Templates:** 34+ EJS templates organized by feature
- **Config Files:** 5 configuration modules

---

## API Routes Documentation

### Directory Structure
```
src/routes/
├── main.ts                              # Main router (empty placeholder)
├── auth/                                # Authentication routes
│   ├── router.ts                        # Auth router (empty)
│   ├── index.ts
│   ├── login.ts
│   ├── logout.ts
│   ├── github.ts                        # GitHub OAuth
│   └── google.ts                        # Google OAuth
├── api/                                 # REST API v1 endpoints
│   ├── index.ts                         # API router aggregator
│   ├── api-review.ts                    # Website review CRUD
│   ├── api-scrape.ts                    # Web scraping & link extraction
│   ├── api-extract.ts                   # AI-powered data extraction
│   ├── api-ai.ts                        # AI models endpoint
│   ├── api-profile.ts                   # User profile endpoint
│   ├── api-key.ts                       # API key management
│   ├── api-screenshot.ts                # Screenshot capture
│   ├── api-seo-insights.ts              # SEO analysis
│   ├── api-summarize.ts                 # Content summarization
│   ├── api-url.ts                       # URL management
│   ├── api-convert.ts                   # URL conversion
│   ├── api-payment.ts                   # Payment processing
│   ├── api-upload.ts                    # File upload
│   ├── api-healthz.ts                   # Health check
│   └── api-order.ts                     # Order management
├── webhooks/                            # Webhook handlers
│   ├── polar-webhook.ts                 # Polar payment webhooks
│   └── standard-webhook.ts
└── pages/                               # Page routes (server-rendered)
    ├── router.ts
    └── [individual page handlers]
```

### API Endpoint Modules (src/routes/api/)

#### 1. **api-review.ts** (Core Feature)
**Purpose:** Website review creation, retrieval, update, deletion  
**Endpoints:**
- `POST /api/v1/review` - Create new website review
  - Requires: `url` (string), optional `instructions`, `options`
  - Returns: `reviewId`, `status`, review details
- `GET /api/v1/review` - List user reviews with pagination
  - Query params: `page`, `limit`
  - Returns: array of reviews + pagination metadata
- `GET /api/v1/review/{reviewId}` - Get specific review
  - Returns: full review with metadata, scores, screenshots
- `PATCH /api/v1/review/{reviewId}` - Update review
  - Returns: updated review object
- `DELETE /api/v1/review/{reviewId}` - Delete review

**Authentication:** Session + API Key  
**Key Models Used:**
- Review (status: PENDING|IN_PROGRESS|COMPLETED|FAILED)
- Screenshot, ReviewCategory
- User relationship

---

#### 2. **api-scrape.ts** (Web Scraping)
**Purpose:** HTML scraping, metadata extraction, link analysis  
**Endpoints:**
- `POST /api/v1/scrape` - Scrape single URL
  - Query: `url` (required)
  - Body: `options` (delayAfterLoad, timeout, headers, proxyUrl, selectors, simpleHtml)
  - Returns: `html` content + `metadata`
- `POST /api/v1/scrape/urls` - Scrape multiple URLs (batch)
  - Body: `urls[]` (array, max 10), `options`
  - Returns: array of results with success/failure status
- `POST /api/v1/scrape/links-map` - Extract all links from URL
  - Query: `url`
  - Body: `includeExternal`, `maxLinks`, `delayAfterLoad`, `getStatusCode`, `autoScrapeInternalLinks`
  - Returns: link analysis with healthy/broken counts

**Key Features:**
- Parallel scraping with Promise.all
- Proxy support
- Custom CSS selectors
- HTML simplification (strips scripts/styles)
- Link health status checking
- Saves results to `ScanLinkResult` table

---

#### 3. **api-extract.ts** (AI Data Extraction)
**Purpose:** Structured data extraction using AI vision models  
**Endpoints:**
- `POST /api/v1/extract` - Extract structured data from URL
  - Body: 
    - `url` (required)
    - `options.instructions` (required)
    - `options.jsonTemplate` (required JSON structure)
    - `options.systemPrompt` (optional)
    - `options.model` (default: google/gemini-2.5-flash)
    - `options.recursive` (extract from all internal URLs)
    - `options.delayAfterLoad`
    - `options.debug`
  - Returns: extracted data in requested JSON format

**Key Features:**
- Vision model integration
- JSON schema validation
- Recursive internal link scraping
- AI-powered extraction

---

#### 4. **api-profile.ts** (User Management)
**Purpose:** User profile retrieval  
**Endpoints:**
- `GET /api/v1/profile` - Get current user profile
  - Returns: masked user object (sanitized)

---

#### 5. **api-key.ts** (API Key Management)
**Purpose:** User API key lifecycle management  
**Endpoints:**
- `GET /api/v1/api_key` - List all API keys
  - Returns: array of API keys
- `POST /api/v1/api_key` - Create new API key
  - Body: `name` (optional), `expiresAt` (optional datetime)
  - Returns: generated API key (show once)
- `DELETE /api/v1/api_key/{id}` - Delete API key
  - Returns: deleted key metadata

**Key Features:**
- Random key generation via `generateRandomApiKey()`
- Optional expiration dates
- User-scoped keys

---

#### 6. **api-screenshot.ts** (Website Screenshots)
**Purpose:** Capture website screenshots in various formats  
**Endpoints:** (expected similar CRUD pattern)
- Screenshot capture with device type selection (DESKTOP|MOBILE|TABLET)
- Viewport configuration support

---

#### 7. **api-seo-insights.ts** (SEO Analysis)
**Purpose:** Extract and analyze SEO metrics  
**Endpoints:** (returns SEO scores, metadata analysis)

---

#### 8. **api-summarize.ts** (Content Summarization)
**Purpose:** AI-powered content summarization  
**Endpoints:** (text summarization via AI models)

---

#### 9. **api-url.ts** (URL Management)
**Purpose:** Store and manage analyzed URLs  
**Models:** WebUrl, WebUrlCategory  
**Features:** Category tagging, metadata caching

---

#### 10. **api-convert.ts** (URL Conversion)
**Purpose:** URL transformation/conversion utilities  
**Endpoints:** (URL format conversions, encoding)

---

#### 11. **api-ai.ts** (AI Model Info)
**Purpose:** Retrieve available AI models  
**Endpoints:**
- `GET /api/v1/ai/models` - Get available models
  - Returns: 
    - `textModels[]` (DEFAULT_AI_MODELS)
    - `visionModels[]` (DEFAULT_VISION_MODELS)

---

#### 12. **api-payment.ts** (Payment Processing)
**Purpose:** Payment and order management  
**Models:** Order, Payment, CashTransaction, UserBalance  
**Status Types:** UNPAID, PAID, CANCELLED  
**Methods:** CREDIT_CARD, MOMO, BANK_TRANSFER, LEMON_SQUEEZY, POLAR

---

#### 13. **api-upload.ts** (File Upload)
**Purpose:** Upload and manage user files  
**Model:** MetaFile (stores mimetype, url, blurBase64, dimensions)

---

#### 14. **api-healthz.ts** (Health Check)
**Purpose:** API health monitoring endpoint

---

#### 15. **api-key.ts** → Duplicate name, likely redundant

---

#### 16. **Webhook Handlers**
- **polar-webhook.ts** - Polar payment platform webhooks
- **standard-webhook.ts** - Generic webhook handler

---

## Database Schema (Prisma)

### Authentication & User Models
```
Key                     - Session keys (Lucia auth)
Session                 - User sessions with expiration
Account                 - OAuth provider accounts
User                    - Core user model
├── relationships: keys, sessions, accounts, workspace roles, API keys
├── fields: id, name, slug, email, image, password, validEmail, isPremium, balance
├── activeWorkspaceId   - Current workspace reference
└── timestamps: createdAt, updatedAt
```

### Workspace & Roles
```
Workspace               - Project/organization container
├── id, name, slug, description, isPublic
├── creatorId (User relationship)
└── relationships: users, roles, plans, reviews, URLs

WorkspaceRole           - Roles within workspace (admin, editor, viewer)
WorkspaceUserRole       - User-to-workspace role assignment
WorkspacePermission     - Fine-grained permissions
WorkspaceRolePermission - Role-to-permission mapping
```

### Authentication & Security
```
PasswordResetToken      - Password reset flows
EmailVerificationCode   - Email verification OTP
EmailVerificationToken  - Email verification tokens
```

### Business Models
```
Plan                    - Subscription plans
├── slug, name, description, type (FREE|MONTHLY|YEARLY|ONE_TIME|ADDITION)
├── price, currency, benefits[]
├── maxRequestsPerMinute, maxRequestsPerMonth
├── Polar integration: polarProductId, polarPriceId, polarYearlyPriceId

UserPlan                - User subscription
├── status (ACTIVE|INACTIVE)
├── recurring (MONTHLY|YEARLY|ONE_TIME)
├── polarSubscriptionId

WorkspacePlan           - Workspace-level plan
├── requestPerMinute, requestPerMonth limits
├── polarId, expiresAt

Order                   - Purchase orders
├── status (UNPAID|PAID|CANCELLED)
├── currency (USD|VND)
├── polarCheckoutId, polarProductId

Payment                 - Payment records
├── status (PAID|CANCELLED|FREE|PENDING_VERIFICATION|REFUNDED|EXPIRED)
├── method (CREDIT_CARD|MOMO|BANK_TRANSFER|LEMON_SQUEEZY|POLAR)
├── transactionDetails (JSON)

CashTransaction         - Internal credit transactions
├── type (DEPOSIT|REFUND|PAYOUT)
├── cashType (CREDITS)

UserBalance             - Account balance ledger
├── cashType, balance
├── unique constraint: [userId, cashType]
```

### Core App Models
```
Review                  - Website analysis results
├── url, status (PENDING|IN_PROGRESS|COMPLETED|FAILED)
├── metadata (JSON), aiAnalysis (JSON)
├── scores: seoScore, securityScore
├── flags: securityRisk, mobileFriendly, adultContent, gambling
├── textModel, visionModel, instructions
├── userId, workspaceId relationships
├── screenshots[], categories[] (many-to-many)

Screenshot              - Website screenshots
├── url, imageUrl
├── device (DESKTOP|MOBILE|TABLET)
├── viewport dimensions, scale
├── reviewId relationship

Category                - Content categories
├── id, name, slug, status, icon
├── parentId (hierarchical)
├── translations (JSON)
├── relationships: reviews[], urls[]

WebUrl                  - Cached website data
├── url, meta (JSON), thumbnailUrl
├── userId, workspaceId relationships
├── categories[] (many-to-many)

ReviewCategory, WebUrlCategory - Many-to-many junction tables

BrokenLink              - Broken link tracking
├── url (scanned), brokenUrl (found), statusCode, error
├── indexed on: url

ScanLinkResult          - Link scan results
├── url, status (PENDING|IN_PROGRESS|COMPLETED|FAILED)
├── links[], statusCodes[]
├── indexed on: url
```

### Supporting Models
```
ApiKey                  - User API authentication
├── key (unique), name, expiresAt
├── userId, workspaceId relationships

MetaFile                - User-uploaded files/media
├── mimetype, url, blurBase64, width, height, approved
├── userId relationship

Proxy                   - Proxy configuration
├── url, data (JSON)

Role, Permission        - System-wide roles/permissions
RolePermission          - System-wide role-permission mapping
UserRole                - User-to-role assignment
```

### Enums
- **ReviewStatus:** PENDING, IN_PROGRESS, COMPLETED, FAILED
- **ScreenshotDevice:** DESKTOP, MOBILE, TABLET
- **Currency:** USD, VND
- **PaymentStatus:** PAID, CANCELLED, FREE, PENDING_VERIFICATION, REFUNDED, EXPIRED
- **PaymentMethod:** CREDIT_CARD, MOMO, BANK_TRANSFER, LEMON_SQUEEZY, POLAR
- **TransactionType:** DEPOSIT, REFUND, PAYOUT
- **PlanType:** FREE, MONTHLY, YEARLY, ONE_TIME, ADDITION
- **PlanStatus:** ACTIVE, ARCHIVED
- **UserPlanStatus:** ACTIVE, INACTIVE

---

## Configuration Files

### src/config/index.ts
**Exports:** AppConfig, constants, environment vars, swagger config

### src/config/AppConfig.ts
```typescript
{
  environment: NODE_ENV (development|production)
  siteName: "ReviewWeb.site"
  siteDescription: AI review & analysis tool
  locale: "en"
  TZ: "Asia/Ho_Chi_Minh"
  
  // Methods
  getBaseUrl(path): string
  getAuthCallbackUrl(provider): string
  getCloudflareCDNUrl(url): string
}
```

### src/config/constants.ts
**Enums & Constants:**
- `AppRoleDefault` - ADMIN, VIEWER, PRO
- `AppPermissionDefault` - FULL_CONTROL, WRITE, READ
- `WorkspacePermissionDefault` - FULL_CONTROL, UPDATE, INVITE, VIEW
- `WorkspaceRoleDefault` - ADMIN, EDITOR, INVITER, VIEWER
- `TagDefault` - MEMBERSHIP, WORKSPACE, PRODUCT, CASH, MONTHLY, ANNUAL
- `BREAKPOINTS` - mobile: 0, tablet: 768, desktop: 1280

### src/config/swagger.ts
**Swagger/OpenAPI Configuration**
- OpenAPI 3.1.0 spec
- JWT Bearer + API Key authentication schemes
- API v1 endpoints documented
- Contact: Goon Nguyen (goon@wearetopgroup.com)
- Includes llms.txt reference
- Security schemes support both Bearer JWT and X-API-Key header

### src/config/environment.ts
(Likely environment variable definitions)

---

## View Templates (EJS)

### Master Layouts
```
master.ejs              - Main layout (marketing/public)
master-dashboard.ejs    - Dashboard layout with sidebar/header
master-template.ejs     - Alternative template structure
```

### Page Views (src/views/pages/)
```
home.ejs                - Landing page
login.ejs               - Login page
scan.ejs                - Broken links report display
review.ejs              - Website review results
pricing.ejs             - Pricing page
checkout-confirmation.ejs - Purchase confirmation
checkout-success.ejs    - Payment success
payment-success.ejs     - Payment processing status
profile.ejs             - User profile page
workspace-select.ejs    - Workspace selector
404.ejs                 - 404 error page
privacy.ejs             - Privacy policy
```

### Common Components (src/views/common/)
```
head.ejs                - Page head (meta, styles, scripts)
header.ejs              - Public header navigation
header-dashboard.ejs    - Dashboard header with user menu
footer.ejs              - Footer component
mobile-menu.ejs         - Mobile navigation

Input/Form Components:
  input-tags.ejs        - Tag input field
  input-upload.ejs      - File upload input
  create-link-form.ejs  - Link creation form
  product-create-form.ejs - Product creation form

UI Components:
  button.ejs            - Reusable button component
  logo-horizontal.ejs   - Horizontal logo variant
  logo-verticle.ejs     - Vertical logo variant
  
Display Components:
  link-copy.ejs         - Copyable link display
  thumb-twitter.ejs     - Twitter preview thumbnail
  thumb-facebook.ejs    - Facebook preview thumbnail
  
Drawer/Modals:
  drawers.ejs           - Drawer components
  
Ads:
  group-ad-section.ejs  - Ad section wrapper
  group-ad-item.ejs     - Individual ad item
  group-ad-preview.ejs  - Ad preview display
```

### Templates (src/views/templates/)
```
share-template-01.ejs           - Share/export template v1
share-template-01-random.ejs    - Random variant
```

**Features Observed:**
- Dark mode support (data-mode attribute)
- Responsive design (Tailwind CSS classes)
- Theme switcher with localStorage persistence
- Progress indicator
- Loader/preloader
- Multiple layout variants (public, dashboard)
- Modal/drawer support

---

## Authentication & Middleware

### Auth Methods
1. **Lucia (Session-based)** - `validateSession`, `verifyRequest`
2. **API Key Auth** - Custom middleware `apiKeyAuth`
3. **OAuth** - GitHub, Google (routes present but handlers not detailed)

### Middleware Stack
- `validateSession` - Session validation on protected routes
- `apiKeyAuth` - API key header check (X-API-Key)
- `express.json()` - JSON body parsing
- `express.urlencoded()` - URL-encoded body parsing

---

## Key Integration Points

### External Services
1. **Polar** - Subscription/payment platform
   - Product, price, subscription webhooks
   - Checkout URL integration
2. **Cloudflare** - CDN for asset delivery
   - CDN URL builder in config
3. **AI Models** - Vision & text LLMs
   - Gemini 2.5 Flash (default)
   - Multiple model support via environment config

### Database
- PostgreSQL with Prisma ORM
- Binary targets: native, linux-musl-openssl-3.0.x
- Preview features: driverAdapters

### File Uploads
- S3 or Cloudflare R2 (via upload endpoint)
- MetaFile model tracks: mimetype, url, blurBase64, dimensions

---

## Observations & Patterns

1. **API Design**
   - RESTful /api/v1 prefix
   - Consistent response structure: `{ success, message, data, error }`
   - Comprehensive OpenAPI/Swagger documentation
   - Zod validation for request bodies
   - Detailed error handling with proper HTTP status codes

2. **Database**
   - Comprehensive RBAC (role-based access control)
   - Workspace isolation for multi-tenant features
   - Polar payment platform tight integration
   - Audit timestamps on most models (createdAt, updatedAt)

3. **Security**
   - Session-based + API key dual auth
   - Email verification flow
   - Password reset token flow
   - User balance ledger for credit-based system

4. **Scalability Considerations**
   - Indexed lookups on frequently queried fields
   - Pagination support in list endpoints
   - Batch processing for multiple URLs
   - Parallel promise handling in scraping

5. **Frontend**
   - EJS server-side rendering
   - Dark mode implementation
   - Responsive Tailwind CSS styling
   - Component-based template structure

---

## File Inventory Summary

| Category | Count | Location |
|----------|-------|----------|
| API Route Modules | 16 | src/routes/api/*.ts |
| Authentication Routes | 6 | src/routes/auth/*.ts |
| Page Routes | 9+ | src/routes/pages/*.ts |
| Webhook Handlers | 2 | src/routes/webhooks/*.ts |
| Configuration Files | 5 | src/config/*.ts |
| Database Models | 40+ | prisma/schema.prisma |
| View Templates | 34+ | src/views/**/*.ejs |
| Prisma Migrations | 1 | prisma/migrations/ |

---

## Unresolved Questions

1. **Detailed Implementations**: Auth middleware implementations (login, logout, OAuth callback handlers) not fully analyzed
2. **Module Internals**: @/modules directory structure (review, scrape, metadata, user, etc.) not scoped in this scout
3. **Utility Functions**: Helper functions in @/lib directory not detailed
4. **Middleware Specifics**: Full api_key_auth middleware logic not reviewed
5. **Error Handling**: Global error handler configuration not documented
6. **Database Seed**: prisma/seed.mjs logic not analyzed

