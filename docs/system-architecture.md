# ReviewWeb.site - System Architecture

## High-Level Architecture Overview

ReviewWeb.site follows a layered architecture with clear separation between presentation, business logic, data access, and external integrations.

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Web Browser   │  │  Mobile App    │  │  API Clients   │   │
│  │  (EJS Views)   │  │  (via API)     │  │  (REST)        │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ CSRF         │→ │ API Key      │→ │ Rate Limit   │          │
│  │ Protection   │  │ Auth         │  │ (per min/mo) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   API LAYER (Routes)                             │
│                  /api/v1/[module]/*                              │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Review   │ │ Scrape   │ │ Summarize│ │ Convert  │          │
│  │ Routes   │ │ Routes   │ │ Routes   │ │ Routes   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Screenshot│ │ Profile  │ │ Analytics│ │ Payment  │          │
│  │ Routes   │ │ Routes   │ │ Routes   │ │ Routes   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                           │
│                    (18 Modules)                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ORCHESTRATION: review module (10-step analysis)         │   │
│  │   ├── screenshot (capture pages)                        │   │
│  │   ├── scrape (extract HTML)                             │   │
│  │   ├── metadata (extract OG/Twitter)                     │   │
│  │   ├── summarize (AI content summary)                    │   │
│  │   ├── convert (HTML-to-Markdown)                        │   │
│  │   ├── thumbnail (social share)                          │   │
│  │   └── analytics (track metrics)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DATA MANAGEMENT:                                         │   │
│  │   ├── user (auth & profiles)                            │   │
│  │   ├── workspace (team organization)                     │   │
│  │   ├── web-url (URL records)                             │   │
│  │   ├── category (categorization)                         │   │
│  │   ├── user-balance (credits)                            │   │
│  │   └── plan (subscriptions)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ INTEGRATIONS:                                            │   │
│  │   ├── payment (Polar/SePay/LemonSqueezy)                │   │
│  │   ├── seo-insights (external APIs)                      │   │
│  │   └── response (standardized API format)                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LIBRARY LAYER                                  │
│                    (97 Files)                                    │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ AI/LLM   │ │ Scraping │ │ Auth     │ │ Payment  │          │
│  │ OpenRouter│ │ (5-layer)│ │ (Lucia)  │ │(Providers)│         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Browser  │ │ Email    │ │ CDN/Store│ │ YouTube  │          │
│  │Automation│ │ (ElasticE)│ │ (Upfile) │ │Integration│         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Redis    │ │ Database │ │ Utils    │ │ Proxy    │          │
│  │ (caching)│ │ (Prisma) │ │ (30+ fn) │ │(WebShare)│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                     │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   PostgreSQL DB      │  │     Redis Cache      │            │
│  │   (40+ models)       │  │   (pub/sub, TTL)     │            │
│  │                      │  │                      │            │
│  │ Users, Reviews,      │  │ Rate limits          │            │
│  │ Payments, Plans,     │  │ Session state        │            │
│  │ Analytics, etc.      │  │ Chat history         │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                EXTERNAL SERVICES                                 │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ OpenRouter   │ │ Polar/SePay  │ │ Cloudflare   │            │
│  │ (25+ LLMs)   │ │ (Payments)   │ │ (R2, CDN)    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ GitHub OAuth │ │ Google OAuth │ │ Firecrawl    │            │
│  │ (Auth)       │ │ (Auth)       │ │ (JS render)  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Elastic Email│ │ Upfile Best  │ │ YouTube API  │            │
│  │ (Email)      │ │ (CDN)        │ │ (Transcripts)│            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Interactions

### Website Review Workflow (Central)

```
User Request: POST /api/v1/review
              ├─ URL validation (Zod schema)
              ├─ Authentication check (API key or session)
              ├─ Rate limit check (Redis)
              │
              ↓
        startReview() ORCHESTRATION
              ├─ Step 1: Create review record (PENDING)
              │   └─ db.review.create()
              │
              ├─ Step 2: Extract images
              │   └─ playwright.getImages() → max 50
              │
              ├─ Step 3: Extract links
              │   └─ scrape.extractAllLinksFromUrl() → max 50
              │
              ├─ Step 4: Scrape HTML content
              │   └─ getHtmlWithFallbacks() [5-method chain]
              │       ├─ axios (lightweight)
              │       ├─ firecrawl (JS render)
              │       ├─ playwright (full browser)
              │       ├─ scrapedo (anti-detect)
              │       └─ scrappey (proxy)
              │
              ├─ Step 5: Extract metadata
              │   └─ metadata.scrapeMetadata()
              │       ├─ Open Graph tags
              │       ├─ Twitter Card
              │       ├─ SEO meta tags
              │       └─ Standard tags
              │
              ├─ Step 6: AI HTML analysis
              │   └─ ai.analyzeUrl(html)
              │       └─ OpenRouter (text model)
              │
              ├─ Step 7: Screenshot analysis
              │   └─ ai.analyzeImageBase64(screenshot)
              │       └─ OpenRouter (vision model)
              │
              ├─ Step 8: Parallel image analysis
              │   └─ Promise.all([...])
              │       └─ ai.analyzeImageBase64() × N
              │
              ├─ Step 9: Parallel link analysis
              │   └─ Promise.all([...])
              │       └─ ai.analyzeUrl() × N
              │
              └─ Step 10: Update review (COMPLETED)
                  └─ db.review.update() with all results

Response: 201 Created
          {
            status: 201,
            data: {
              id: "uuid",
              status: "COMPLETED",
              htmlAnalysis: {...},
              screenshotAnalysis: {...},
              images: [...],
              links: [...]
            }
          }
```

### Content Processing Workflow

```
Input: URL
  │
  ├─ SCRAPING PATH
  │  ├─ getHtmlWithFallbacks()
  │  ├─ HTML simplification (remove scripts/styles)
  │  └─ Blocked website detection
  │
  ├─ SUMMARIZATION PATH
  │  ├─ analyzeUrl() with summarization prompt
  │  └─ Format: bullet or paragraph
  │
  ├─ CONVERSION PATH
  │  ├─ analyzeUrl() with conversion prompt
  │  └─ Output: Markdown format
  │
  └─ EXTRACTION PATH
     ├─ analyzeUrl() with JSON template
     └─ Validate response with json-validator
```

### Authentication Flow

```
Client Request
  │
  ├─ Path 1: Web Form
  │  ├─ CSRF token check (middleware)
  │  ├─ Session lookup in Redis
  │  ├─ Lucia session validation
  │  └─ User attached to res.locals
  │
  ├─ Path 2: API Key
  │  ├─ Extract from x-api-key header
  │  ├─ Database lookup (Prisma)
  │  ├─ Attach user to res.locals
  │  └─ Continue to route handler
  │
  └─ Path 3: OAuth (GitHub/Google)
     ├─ Redirect to OAuth provider
     ├─ Provider returns auth code
     ├─ Exchange for token
     ├─ Create/update user
     └─ Create session (Lucia)
```

### Payment & Subscription Flow

```
User Subscription Request
  │
  ├─ Step 1: Get available plans
  │  └─ db.plan.findMany()
  │
  ├─ Step 2: Create checkout
  │  └─ payment.createCheckout()
  │      └─ Polar SDK
  │
  ├─ Step 3: Redirect to Polar
  │  └─ Customer pays
  │
  ├─ Step 4: Webhook from Polar
  │  ├─ POST /webhooks/polar/completed
  │  ├─ Verify signature
  │  └─ payment.createPaymentAndOrder()
  │
  ├─ Step 5: Create user plan
  │  └─ plan.subscribe(userId, planId)
  │
  ├─ Step 6: Set rate limits
  │  └─ Redis keys for per-minute/per-month
  │
  └─ Step 7: Send confirmation email
     └─ email.sendSubscriptionConfirmation()
```

### Rate Limiting System

```
User Request (Authenticated)
  │
  ├─ Fetch user plan limits
  │  └─ db.userPlan.findUnique()
  │      ├─ RequestsPerMinute (e.g., 100)
  │      └─ RequestsPerMonth (e.g., 10,000)
  │
  ├─ Per-Minute Check (Redis)
  │  ├─ Key: rate-limit:{userId}:per-minute:{YYYY-MM-DD HH:mm}
  │  ├─ Get current count
  │  ├─ Increment by 1
  │  ├─ Set expiry to 60 seconds
  │  └─ Check if exceeded limit
  │      └─ Return 429 if true
  │
  ├─ Per-Month Check (Redis)
  │  ├─ Key: rate-limit:{userId}:per-month:{YYYY-MM}
  │  ├─ Get current count
  │  ├─ Increment by 1
  │  ├─ Set expiry to 31 days
  │  └─ Check if exceeded limit
  │      └─ Return 429 if true
  │
  └─ Proceed to route handler
```

---

## Data Flow Architecture

### Entity Relationship Diagram (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│                      User (Core)                         │
│  ┌─────────────────────────────────────────────────────┤
│  │ id (PK), email, name, createdAt, ...                 │
│  └─────────────────────────────────────────────────────┘
        │ 1:N
        ├──── ┌──────────────────────────┐
        │     │ Session (Auth)           │
        │     │ id, userId (FK), data    │
        │     └──────────────────────────┘
        │
        ├──── ┌──────────────────────────┐
        │     │ ApiKey                   │
        │     │ id, userId (FK), key     │
        │     └──────────────────────────┘
        │
        ├──── ┌──────────────────────────┐
        │     │ UserPlan (Subscription)  │
        │     │ userId (FK), planId (FK) │
        │     │ startDate, endDate       │
        │     └──────────────────────────┘
        │         │ 1:N
        │         └──── ┌──────────────────────────┐
        │               │ Plan                     │
        │               │ id, name, limits        │
        │               └──────────────────────────┘
        │
        ├──── ┌──────────────────────────┐
        │     │ Workspace                │
        │     │ id, name, ownerId (FK)   │
        │     └──────────────────────────┘
        │         │ 1:N
        │         └──── ┌──────────────────────────┐
        │               │ Review (Analysis)        │
        │               │ id, workspaceId (FK)     │
        │               │ url, status, results     │
        │               └──────────────────────────┘
        │                   │ 1:N
        │                   └──── ┌──────────────────────────┐
        │                         │ Screenshot               │
        │                         │ id, reviewId (FK)        │
        │                         │ imageUrl, viewport       │
        │                         └──────────────────────────┘
        │
        ├──── ┌──────────────────────────┐
        │     │ UserBalance              │
        │     │ userId (FK), balance     │
        │     └──────────────────────────┘
        │
        └──── ┌──────────────────────────┐
              │ Order (Payment)          │
              │ userId (FK), status      │
              │ amount, planId (FK)      │
              └──────────────────────────┘
                  │ 1:N
                  └──── ┌──────────────────────────┐
                        │ Payment                  │
                        │ orderId (FK), method     │
                        │ amount, status           │
                        └──────────────────────────┘

WebUrl (Content)
    │ M:N
    └──── Category
              (URL categorization)
```

---

## Caching Strategy

### Redis Key Structure

```
┌─────────────────────────────────────────────────────────┐
│                   Redis Caching                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Session Management:                                     │
│  sessions:{sessionId} → session data (TTL: 7 days)     │
│  user:{userId}:session → active session (TTL: 7 days) │
│                                                          │
│ Rate Limiting:                                          │
│  rate-limit:{userId}:per-minute:{timestamp}            │
│    → count (TTL: 60 seconds)                           │
│  rate-limit:{userId}:per-month:{YYYY-MM}              │
│    → count (TTL: 31 days)                             │
│                                                          │
│ Model Caching:                                          │
│  ai-models:list → available models (TTL: 24 hours)    │
│  ai-models:metadata → model details (TTL: 24 hours)   │
│                                                          │
│ Application Cache:                                      │
│  cache:{key} → any data (TTL: configurable)           │
│                                                          │
│ Chat Features:                                          │
│  chat:{roomId}:messages → message history             │
│  user:{userId}:rooms → room memberships               │
│                                                          │
│ Pub/Sub Channels:                                       │
│  notifications:{userId} → user notifications          │
│  system:broadcasts → system-wide messages             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Cache Invalidation

```
Event: User updates profile
  │
  ├─ Update database
  │  └─ db.user.update()
  │
  └─ Invalidate caches
     ├─ redis.del(`user:${userId}`)
     ├─ redis.del(`user:${userId}:session`)
     └─ Broadcast to pub/sub (optional)
```

---

## Deployment Architecture

### Local Development

```
┌─────────────────────────────────────────────────────────┐
│             Local Development Stack                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Node.js (v22.20.0)                                   │
│  ├─ bun run dev (hot reload)                          │
│  ├─ localhost:3000 (Express server)                   │
│  └─ TypeScript compilation in-memory                  │
│                                                         │
│  PostgreSQL (local)                                   │
│  ├─ docker-compose: postgres:latest                  │
│  ├─ Port 5432                                         │
│  └─ Database: url_review                             │
│                                                         │
│  Redis (local)                                        │
│  ├─ docker-compose: redis:latest                     │
│  ├─ Port 6379                                         │
│  └─ No persistence                                    │
│                                                         │
│  Prisma Studio                                        │
│  ├─ bun run db:studio                                │
│  ├─ Web UI: localhost:5555                           │
│  └─ Visual database inspector                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Docker Production

```
┌─────────────────────────────────────────────────────────┐
│          Docker Container Production Build              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Base Image: node:20.15.1                             │
│                                                         │
│  System Dependencies:                                  │
│  ├─ Python 3 (build tools)                           │
│  ├─ Playwright browsers (Firefox, Chromium)          │
│  ├─ GStreamer (multimedia)                           │
│  ├─ libopus, libvpx, libx264 (codecs)               │
│  └─ iputils-ping (diagnostics)                       │
│                                                         │
│  Package Managers:                                    │
│  ├─ Bun (package installation)                       │
│  └─ Node.js modules (bun:cli)                        │
│                                                         │
│  App Startup:                                         │
│  ├─ npm run start (production mode)                  │
│  ├─ Prisma client generation                        │
│  └─ Port 3000 exposed                               │
│                                                         │
│  Data Volumes:                                        │
│  ├─ /app/src (source code)                           │
│  ├─ /app/node_modules (deps)                         │
│  └─ /app/prisma (schema)                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### DXUP Deployment

```
DXUP Deployment Flow:
  │
  ├─ GitHub Actions CI Trigger
  │  └─ Push to main branch
  │
  ├─ Build Image
  │  ├─ Docker build
  │  ├─ Run tests
  │  └─ Push to registry
  │
  ├─ Deploy to Environment
  │  ├─ Preview (on PR)
  │  └─ Production (on merge)
  │
  └─ Rollback Capability
     └─ Automatic rollback on failure
```

---

## Scalability Architecture

### Horizontal Scaling

```
Request Load Balancer
         │
    ┌────┴────┬────────┬────────┐
    ↓         ↓        ↓        ↓
  App-1    App-2    App-3    App-N
  :3000    :3000    :3000    :3000
    │         │        │        │
    └────┬────┴────┬───┴────┬───┘
         │         │        │
    PostgreSQL (Primary)  Database Replicas
         │
    ┌────┴────┐
    ↓         ↓
  Redis-1  Redis-2 (Replication)
    (Cache & Sessions)
```

### Database Pooling

```
Application Layer
    │ (Prisma connections)
    │
Connection Pool (5-20 connections)
    │
    ├─ Active connections (in-use)
    ├─ Idle connections (ready)
    └─ Queue (waiting for connection)
    │
PostgreSQL Database
```

### Async Processing (Future)

```
Current: Synchronous
  Request → Analysis → Response

Future: Asynchronous (Planned)
  Request → Queue (Bull/BullMQ) → Worker Pool → Webhook Callback
    │
    ├─ Job stored in Redis
    ├─ Multiple workers process jobs
    ├─ Webhook sent on completion
    └─ Client polls job status
```

---

## External Service Integrations

### AI/LLM Integration (OpenRouter)

```
Request to OpenRouter
    │
    ├─ Endpoint: https://openrouter.ai/api/v1/chat/completions
    ├─ Auth: Bearer token (OPENROUTER_KEY)
    ├─ Models: 25+ providers (OpenAI, Anthropic, Google, etc.)
    ├─ Pricing: Per-token (input/output)
    ├─ Timeout: 5 minutes
    ├─ Retry: 3 times with exponential backoff
    └─ Cost tracking: Stored in database
```

### Payment Processing (Polar)

```
User Checkout
    │
    ├─ Create checkout (Polar SDK)
    ├─ Redirect to https://checkout.polar.sh
    ├─ Customer completes payment
    ├─ Polar sends webhook to /webhooks/polar/completed
    ├─ Verify webhook signature
    ├─ Create payment record
    ├─ Create user plan
    ├─ Set rate limits in Redis
    └─ Send confirmation email
```

### OAuth Authentication

```
GitHub/Google OAuth Flow
    │
    ├─ Request: Redirect to provider
    ├─ Provider: Shows login/consent screen
    ├─ User: Grants permission
    ├─ Provider: Returns authorization code
    ├─ Server: Exchange code for token (Arctic library)
    ├─ Server: Fetch user profile
    ├─ Server: Create/update user in database
    ├─ Server: Create session (Lucia)
    └─ Server: Redirect to dashboard
```

### Email Service (Elastic Email)

```
Email Events
    │
    ├─ Forgot password
    ├─ Magic link login
    ├─ Verification code
    ├─ Payment receipt
    └─ Subscription confirmation
    │
    └─ All via lib/email API
```

### CDN & File Storage

```
File Upload Flow
    │
    ├─ Screenshot saved locally
    ├─ Uploaded to Upfile Best CDN
    ├─ Receive public URL
    ├─ Store URL in database
    └─ Serve via Cloudflare edge
```

---

## Security Architecture

### Authentication & Authorization

```
Incoming Request
    │
    ├─ Method 1: Web Session (CSRF Protected)
    │  ├─ Cookie check (session ID)
    │  ├─ Redis lookup
    │  ├─ CSRF token validation
    │  └─ Attach user to res.locals
    │
    ├─ Method 2: API Key
    │  ├─ Header check (x-api-key)
    │  ├─ Database lookup (Prisma)
    │  ├─ Verify not revoked
    │  └─ Attach user to res.locals
    │
    ├─ Method 3: Bearer Token
    │  ├─ Authorization header
    │  ├─ Database lookup
    │  └─ Attach user to res.locals
    │
    └─ Rate limiting (per plan)
```

### Data Protection

```
┌─────────────────────────────────────────────────────────┐
│              Data Protection Layers                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Transport Layer (TLS 1.2+)                             │
│  └─ HTTPS encryption in transit                        │
│                                                         │
│ Database Layer                                         │
│  ├─ Encrypted fields (password hashing)                │
│  ├─ Row-level security (workspace isolation)          │
│  └─ Connection pooling protection                      │
│                                                         │
│ Application Layer                                      │
│  ├─ Input validation (Zod schemas)                     │
│  ├─ SQL injection prevention (Prisma ORM)             │
│  ├─ XSS protection (template escaping)                │
│  └─ CSRF tokens (double-submit cookies)              │
│                                                         │
│ API Security                                           │
│  ├─ API key rotation support                          │
│  ├─ Rate limiting (Redis-based)                       │
│  ├─ Webhook signature verification                    │
│  └─ CORS configuration                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Logging Strategy

```
Application Logs
    │
    ├─ Request logs
    │  ├─ IP, method, path
    │  ├─ Status code, response time
    │  └─ User ID (if authenticated)
    │
    ├─ Database logs
    │  ├─ Slow queries (>500ms)
    │  ├─ Errors and warnings
    │  └─ Connection pool status
    │
    ├─ API logs
    │  ├─ OpenRouter API calls
    │  ├─ Polar webhook receipts
    │  └─ Third-party service calls
    │
    ├─ Error logs
    │  ├─ Stack traces with context
    │  ├─ Timestamp and severity
    │  └─ User/request context
    │
    └─ Performance logs
       ├─ API response times
       ├─ Database query durations
       └─ External service latency
```

### Metrics to Track

```
Application Metrics
    ├─ Active users (concurrent)
    ├─ API requests per minute
    ├─ Average response time
    ├─ Error rate
    ├─ Database connection pool utilization
    └─ Redis memory usage

Business Metrics
    ├─ Signups per day
    ├─ Subscription conversions
    ├─ Monthly recurring revenue (MRR)
    ├─ Churn rate
    ├─ Reviews per day
    └─ API requests per plan tier

Infrastructure Metrics
    ├─ CPU utilization
    ├─ Memory usage
    ├─ Disk I/O
    ├─ Network I/O
    └─ Container health
```

---

## Technology Decisions & Trade-offs

### Why Express.js?
- Lightweight and flexible
- Large ecosystem of middleware
- Good performance for REST APIs
- Familiar to most Node.js developers
- Easy to understand request/response cycle

### Why PostgreSQL?
- Strong ACID guarantees
- Complex queries with joins
- Excellent JSON support
- Prisma ORM integration
- Production-ready reliability

### Why Redis?
- Sub-millisecond latency
- Atomic operations for rate limiting
- Pub/Sub for real-time features
- Session storage
- Caching layer

### Why Lucia for Auth?
- Modern, lightweight framework
- Session-based (not JWT)
- Great OAuth support (Arctic)
- Prisma adapter
- Type-safe

### Why Zod for Validation?
- Type-safe validation
- Runtime checking
- Good error messages
- Tree-shakeable
- No decorators needed

### Why Prisma ORM?
- Type-safe queries
- Migrations support
- Great developer experience
- Query optimization
- Built-in connection pooling

---

## Performance Optimization

### Query Optimization

```
N+1 Problem (Anti-pattern)
    Avoid: SELECT * FROM reviews; SELECT * FROM screenshots WHERE reviewId = ?

Optimized
    SELECT reviews.*, screenshots.* FROM reviews
    LEFT JOIN screenshots ON reviews.id = screenshots.reviewId

    (Prisma: include: { screenshots: true })
```

### Concurrency Control

```
Controlled Batch Processing
    Items: 20 URLs
    Batch size: 5

    ├─ Batch 1: URLs 1-5 (parallel)
    ├─ Batch 2: URLs 6-10 (parallel)
    ├─ Batch 3: URLs 11-15 (parallel)
    └─ Batch 4: URLs 16-20 (parallel)

    Result: 4 sequential batches × 5 parallel
            (vs 20 sequential or unlimited parallel)
```

### HTML Simplification

```
Original HTML: 500KB
    │
    ├─ Remove: <script>, <style>, comments
    ├─ Remove: empty elements
    ├─ Remove: unnecessary attributes
    │
Simplified HTML: 150KB (70% reduction)
    │
    └─ Benefits:
       ├─ 70% fewer tokens for LLM
       ├─ 60% cost reduction
       ├─ Faster LLM processing
       └─ Same information retained
```

---

## Disaster Recovery

### Backup Strategy

```
Database Backups
    ├─ Daily automated (AWS RDS)
    ├─ 30-day retention
    ├─ Point-in-time recovery
    └─ Tested monthly

Application Code
    ├─ Git repository (GitHub)
    ├─ Multiple branches
    ├─ Tagged releases
    └─ GitHub Actions artifacts

User Data
    ├─ Database backups
    ├─ Cloud storage (R2)
    └─ CDN-backed images
```

### Recovery Procedures

```
Database Failure
    ├─ 1. Detect via monitoring alerts
    ├─ 2. Switch to read replica (seconds)
    ├─ 3. Promote replica to primary
    ├─ 4. Update connection strings
    └─ 5. Resume operations

Service Failure
    ├─ 1. Container crash detected
    ├─ 2. Kubernetes restarts pod
    ├─ 3. Load balancer routes away
    ├─ 4. Notify team
    └─ 5. Investigate logs

Data Corruption
    ├─ 1. Backup identified as clean
    ├─ 2. Restore from backup
    ├─ 3. Verify data integrity
    ├─ 4. Resume operations
    └─ 5. Post-mortem analysis
```

---

## Future Architecture Evolution

### Planned Improvements

```
Q1 2025: Async Job Processing
    ├─ Bull/BullMQ for job queue
    ├─ Worker processes on separate pool
    ├─ Webhook callbacks for long operations
    └─ Job progress tracking

Q2 2025: GraphQL API
    ├─ Optional alongside REST
    ├─ Better for complex queries
    ├─ Subscriptions support
    └─ Schema federation

Q3 2025: Microservices
    ├─ Separate services per module
    ├─ Service mesh (Istio)
    ├─ Event-driven communication
    └─ Independent deployments

Q4 2025: Global Deployment
    ├─ Multi-region setup
    ├─ Data replication
    ├─ Edge computing (Cloudflare Workers)
    └─ Geo-location routing
```

---

## Related Documentation

- **Project Overview & PDR:** `/docs/project-overview-pdr.md`
- **Code Standards:** `/docs/code-standards.md`
- **Codebase Summary:** `/docs/codebase-summary.md`

---

**Last Updated:** 2025-12-10
**Version:** 1.0
**Maintained By:** Development Team
