# ReviewWeb.site - Complete File Inventory
**Generated:** 2025-12-10 02:31 UTC

## API Routes Directory: src/routes/api/

### Core Feature Endpoints
1. **api-review.ts** (15.8 KB)
   - POST   /api/v1/review              - Create review
   - GET    /api/v1/review              - List reviews (paginated)
   - GET    /api/v1/review/{reviewId}   - Get single review
   - PATCH  /api/v1/review/{reviewId}   - Update review
   - DELETE /api/v1/review/{reviewId}   - Delete review
   - Status tracking: PENDING, IN_PROGRESS, COMPLETED, FAILED

2. **api-scrape.ts** (16.1 KB)
   - POST /api/v1/scrape                - Scrape single URL
   - POST /api/v1/scrape/urls           - Batch scrape (max 10)
   - POST /api/v1/scrape/links-map      - Extract & analyze links
   - Features: proxy support, CSS selectors, HTML simplification, status code checking

3. **api-extract.ts** (24.2 KB)
   - POST /api/v1/extract               - AI-powered structured data extraction
   - Features: Vision model integration, JSON schema validation, recursive scraping

4. **api-screenshot.ts** (13.7 KB)
   - Website screenshot capture
   - Device types: DESKTOP, MOBILE, TABLET
   - Viewport configuration support

5. **api-seo-insights.ts**
   - SEO metrics extraction & analysis
   - Metadata analysis endpoints

6. **api-summarize.ts** (14.6 KB)
   - AI-powered content summarization
   - Text model integration

7. **api-url.ts** (8.2 KB)
   - URL management & caching
   - WebUrl & WebUrlCategory models
   - Category tagging system

8. **api-convert.ts** (7.9 KB)
   - URL conversion & transformation utilities
   - Format conversion endpoints

9. **api-ai.ts** (1.8 KB)
   - GET /api/v1/ai/models              - Retrieve available AI models
   - Returns: textModels[], visionModels[]
   - Default: google/gemini-2.5-flash

### Management Endpoints
10. **api-key.ts** (2.8 KB)
    - GET    /api/v1/api_key            - List API keys
    - POST   /api/v1/api_key            - Create new API key
    - DELETE /api/v1/api_key/{id}       - Delete API key
    - Features: random key generation, optional expiration

11. **api-profile.ts** (1.2 KB)
    - GET /api/v1/profile               - Get user profile (masked)
    - Session + API key auth required

12. **api-payment.ts** (1.6 KB)
    - Payment & order processing
    - Models: Order, Payment, CashTransaction, UserBalance
    - Methods: CREDIT_CARD, MOMO, BANK_TRANSFER, LEMON_SQUEEZY, POLAR

13. **api-upload.ts** (2.7 KB)
    - File upload management
    - MetaFile model: mimetype, url, blurBase64, dimensions

14. **api-order.ts** (1.2 KB)
    - Order lifecycle management
    - Status: UNPAID, PAID, CANCELLED

15. **api-healthz.ts** (240 B)
    - Health check endpoint
    - Minimal endpoint for monitoring

### Utilities & Combined
16. **api-combined.ts** (3.2 KB)
    - Combined tooling endpoints
    - Multi-feature aggregation

17. **api-toolify.ts** (6.5 KB)
    - Tool aggregation and integration
    - API composition utilities

### Router Configuration
18. **index.ts** (API Router aggregator)
    - Aggregates all API route modules
    - Registers routes under /api/v1/* prefix
    - Middleware: express.json(), express.urlencoded()

---

## Authentication Routes: src/routes/auth/

1. **router.ts** - Auth router (empty placeholder)
2. **index.ts** - Auth route exports
3. **login.ts** - User login handler
4. **logout.ts** - User logout handler
5. **github.ts** - GitHub OAuth integration
6. **google.ts** - Google OAuth integration

---

## Page Routes: src/routes/pages/

1. **router.ts** - Page router configuration
   - GET /404 route
2. **index.ts** - Page exports
3. **home.ts** - Homepage route
4. **scan.ts** - Broken links scan results
5. **review.ts** - Website review results page
6. **profile.ts** - User profile page
7. **pricing.ts** - Pricing page
8. **checkout.ts** - Checkout/purchase page
9. **checkout-confirmation.ts** - Checkout confirmation
10. **payment-success.ts** - Payment success page
11. **workspace-select.ts** - Workspace selector

---

## Webhook Routes: src/routes/webhooks/

1. **polar-webhook.ts** - Polar payment webhooks
   - Subscription events
   - Checkout completions

2. **standard-webhook.ts** - Generic webhook handler

---

## Configuration: src/config/

1. **index.ts** (5 lines)
   - Central export hub
   - Exports: AppConfig, constants, environment, swagger

2. **AppConfig.ts** (35 lines)
   - Singleton configuration object
   - Properties: environment, siteName, siteDescription, locale, TZ
   - Methods: getBaseUrl(), getAuthCallbackUrl(), getCloudflareCDNUrl()

3. **constants.ts** (36 lines)
   - AppRoleDefault: ADMIN, VIEWER, PRO
   - AppPermissionDefault: FULL_CONTROL, WRITE, READ
   - WorkspacePermissionDefault: FULL_CONTROL, UPDATE, INVITE, VIEW
   - WorkspaceRoleDefault: ADMIN, EDITOR, INVITER, VIEWER
   - TagDefault: MEMBERSHIP, WORKSPACE, PRODUCT, CASH, MONTHLY, ANNUAL
   - BREAKPOINTS: mobile (0), tablet (768), desktop (1280)

4. **swagger.ts** (60 lines)
   - OpenAPI 3.1.0 specification
   - JWT Bearer auth scheme
   - API Key (X-API-Key header) auth scheme
   - Security: Bearer + ApiKey dual auth
   - Contact: Goon Nguyen (goon@wearetopgroup.com)
   - Includes: llms.txt reference

5. **environment.ts**
   - Environment variable type definitions

---

## Database Schema: prisma/

### Main Schema File
**schema.prisma** (624 lines)

#### Auth & Security Models
- **Key** - Session keys (Lucia)
- **Session** - User sessions with expiration
- **Account** - OAuth provider accounts
- **User** - Core user model (id, name, slug, email, image, password, isPremium, balance)
- **PasswordResetToken** - Password reset flows
- **EmailVerificationCode** - Email OTP codes
- **EmailVerificationToken** - Email verification tokens

#### Role-Based Access Control
- **Role** - System roles (many-to-many with users & permissions)
- **Permission** - System permissions
- **UserRole** - User-to-role assignment
- **RolePermission** - Role-to-permission mapping
- **WorkspaceRole** - Workspace-specific roles
- **WorkspaceUserRole** - Workspace user role assignment
- **WorkspacePermission** - Workspace-specific permissions
- **WorkspaceRolePermission** - Workspace role-permission mapping

#### Workspace & Multi-Tenancy
- **Workspace** (id, name, slug, description, isPublic, creatorId)
  - Many users can be members
  - Relationships: roles, plans, reviews, URLs

#### Subscription & Billing
- **Plan** (slug, name, description, type, price, currency, benefits[])
  - Types: FREE, MONTHLY, YEARLY, ONE_TIME, ADDITION
  - Polar integration: polarProductId, polarPriceId, polarYearlyPriceId
  - Rate limits: maxRequestsPerMinute, maxRequestsPerMonth
- **UserPlan** (userId, planId, status, recurring)
  - Status: ACTIVE, INACTIVE
  - Recurring: MONTHLY, YEARLY, ONE_TIME
- **WorkspacePlan** (workspaceId, planId, status, requestPerMinute, requestPerMonth)
  - Polar subscription tracking

#### Orders & Payments
- **Order** (id, total, currency, status, userId)
  - Status: UNPAID, PAID, CANCELLED
  - Polar integration: polarCheckoutId, polarProductId, polarPriceId, polarYearlyPriceId
- **Payment** (userId, amount, currency, status, method, orderId)
  - Status: PAID, CANCELLED, FREE, PENDING_VERIFICATION, REFUNDED, EXPIRED
  - Methods: CREDIT_CARD, MOMO, BANK_TRANSFER, LEMON_SQUEEZY, POLAR
  - Stores: transactionId, transactionDetails (JSON)
- **CashTransaction** (userId, cashType, amount, transactionType)
  - Types: DEPOSIT, REFUND, PAYOUT
- **UserBalance** (userId, balance, cashType)
  - Unique constraint: [userId, cashType]
  - Tracks user credit balance

#### Core Application Models
- **Review** (url, status, userId, workspaceId)
  - Status: PENDING, IN_PROGRESS, COMPLETED, FAILED
  - Analysis data: metadata (JSON), aiAnalysis (JSON), errorMessage
  - Scores: seoScore, securityScore
  - Flags: securityRisk, mobileFriendly, adultContent, gambling
  - AI models: textModel, visionModel
  - Instructions: custom analysis instructions
  - Relationships: screenshots[], categories[]

- **Screenshot** (url, imageUrl, reviewId)
  - Device types: DESKTOP, MOBILE, TABLET
  - Viewport: width, height, scale
  - fullPage flag

- **Category** (name, slug, status, icon, parentId)
  - Hierarchical structure
  - i18n: translations (JSON)
  - Relationships: reviews[], urls[]

- **WebUrl** (url, meta (JSON), thumbnailUrl, userId, workspaceId)
  - Cached website data
  - Relationships: categories[]

- **ReviewCategory**, **WebUrlCategory** - Many-to-many junction tables

#### Link Analysis
- **BrokenLink** (url, brokenUrl, statusCode, error)
  - Indexed on: url
  - Tracks discovered broken links

- **ScanLinkResult** (url, status, links[], statusCodes[])
  - Indexed on: url
  - Scan status: PENDING, IN_PROGRESS, COMPLETED, FAILED
  - Stores array of links and their HTTP status codes

#### API & User Management
- **ApiKey** (id, name, key (unique), userId, workspaceId, expiresAt)
  - User scoped with optional workspace scope
  - Optional expiration dates

- **MetaFile** (mimetype, url, blurBase64, width, height, approved, userId)
  - User-uploaded files and media
  - Blur placeholder for UI

#### Supporting Models
- **Proxy** (url, data (JSON))
  - Proxy configuration storage

### Enums Defined
```
ReviewStatus: PENDING, IN_PROGRESS, COMPLETED, FAILED
ScreenshotDevice: DESKTOP, MOBILE, TABLET
Currency: USD, VND
PaymentStatus: PAID, CANCELLED, FREE, PENDING_VERIFICATION, REFUNDED, EXPIRED
PaymentMethod: CREDIT_CARD, MOMO, BANK_TRANSFER, LEMON_SQUEEZY, POLAR
TransactionType: DEPOSIT, REFUND, PAYOUT
WithdrawalStatus: PENDING, COMPLETED, FAILED
CashType: CREDITS
PlanType: FREE, MONTHLY, YEARLY, ONE_TIME, ADDITION
UserPlanStatus: ACTIVE, INACTIVE
UserPlanRecurring: MONTHLY, YEARLY, ONE_TIME
PlanInterval: MONTH, YEAR
PlanStatus: ACTIVE, ARCHIVED
TrackingCodeType: GA, GTM, FACEBOOK_PIXEL
OrderStatus: UNPAID, PAID, CANCELLED
ScanLinkStatus: PENDING, IN_PROGRESS, COMPLETED, FAILED
```

### Migrations
- **migrations/migration_lock.toml** - Prisma migration lock
- **migrations/20250121082706_add_broken_links/migration.sql** - Broken links feature migration

### Seed Script
- **seed.mjs** - Database seeding script (not analyzed)

---

## View Templates: src/views/

### Master Layouts (3 files)
1. **master.ejs** - Main public layout
2. **master-dashboard.ejs** - Dashboard/authenticated layout
3. **master-template.ejs** - Alternative layout variant

### Page Views: src/views/pages/ (12 files)
1. **home.ejs** - Landing/homepage
2. **login.ejs** - User login form
3. **404.ejs** - 404 error page
4. **privacy.ejs** - Privacy policy
5. **pricing.ejs** - Pricing/plans page
6. **checkout-confirmation.ejs** - Checkout confirmation
7. **checkout-success.ejs** - Purchase success page
8. **payment-success.ejs** - Payment processing result
9. **review.ejs** - Website review results display
10. **scan.ejs** - Broken links scan results
11. **profile.ejs** - User profile page
12. **workspace-select.ejs** - Workspace selector

### Common Components: src/views/common/ (20 files)
**Navigation & Headers:**
- header.ejs - Public site header
- header-dashboard.ejs - Dashboard header with user menu
- mobile-menu.ejs - Mobile navigation menu

**Head & Layout:**
- head.ejs - Page head (meta tags, styles, scripts)
- footer.ejs - Page footer

**Forms & Input Components:**
- input-tags.ejs - Tag input field
- input-upload.ejs - File upload input
- create-link-form.ejs - Link creation form
- product-create-form.ejs - Product creation form
- button.ejs - Reusable button component

**UI Components:**
- logo-horizontal.ejs - Horizontal logo variant
- logo-verticle.ejs - Vertical logo variant (note: typo in filename)
- link-copy.ejs - Copyable link display with copy button
- drawers.ejs - Modal/drawer components

**Social & Preview Components:**
- thumb-twitter.ejs - Twitter share preview thumbnail
- thumb-facebook.ejs - Facebook share preview thumbnail

**Advertising:**
- group-ad-section.ejs - Ad section wrapper
- group-ad-item.ejs - Individual ad item display
- group-ad-preview.ejs - Ad preview component

### Templates: src/views/templates/ (2 files)
1. **share-template-01.ejs** - Share/export template
2. **share-template-01-random.ejs** - Random variant template

---

## Main Router: src/routes/

**main.ts** - Empty main router placeholder

---

## Technology Stack Summary

### Backend Framework
- Express.js (Node.js web framework)
- TypeScript (type safety)
- Zod (request validation)

### Database
- PostgreSQL (relational database)
- Prisma ORM (database abstraction)
- Binary targets: native, linux-musl-openssl-3.0.x

### Authentication
- Lucia (session-based auth)
- OAuth 2.0 (GitHub, Google)
- API Key authentication (custom middleware)

### Frontend
- EJS (server-side templating)
- Tailwind CSS (responsive styling)
- Day.js (date/time manipulation)
- jQuery (DOM manipulation)
- Highlight.js (code syntax highlighting)
- Slick carousel (image carousel)

### External Services
- Polar (subscription payments)
- Cloudflare (CDN for assets)
- Google Gemini (AI models)

### Development
- Swagger/OpenAPI (API documentation)
- Bun (package manager mentioned in environment)

---

## Key Observations

1. **Multi-Tenant Support:** Workspace model enables per-organization data isolation
2. **Subscription Management:** Full billing stack with Polar integration
3. **AI Integration:** Vision & text models for content analysis
4. **Web Scraping:** Comprehensive HTML extraction, link analysis, metadata parsing
5. **RBAC:** Role-based access control at system and workspace levels
6. **RESTful API:** Consistent REST design with OpenAPI documentation
7. **Responsive UI:** Mobile-first design with dark mode support
8. **Security:** Multiple auth methods, password reset flow, email verification

