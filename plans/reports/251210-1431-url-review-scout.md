# ReviewWeb.site - Middleware & Schemas Scout Report
**Date:** 2025-12-10 | **Branch:** dev/goon | **Project:** url-review

---

## Executive Summary

Scanned `src/middlewares/`, `src/schemas/`, and root config files for ReviewWeb.site (AI-powered website analysis tool). Found **3 middleware functions**, **1 schema definition file**, and **4 root configuration files**. All files use TypeScript with Express framework, Zod for validation, and modern security patterns.

---

## Directory Structure Overview

```
src/
├── middlewares/
│   ├── csrf.ts                    (CSRF protection)
│   ├── api_key_auth.ts            (API key validation)
│   └── check-plan-limits.ts       (Rate limiting & plan enforcement)
└── schemas/
    └── broken-link-schemas.ts     (Broken link validation schemas)

Root configs:
├── tsconfig.json                  (TypeScript configuration)
├── eslint.config.js               (ESLint rules & formatting)
├── tailwind.config.cjs            (Tailwind CSS theme)
└── Dockerfile                     (Docker build configuration)
```

---

## Middleware Functions Analysis

### 1. CSRF Protection Middleware
**File:** `/Users/duynguyen/www/reviewweb-site/src/middlewares/csrf.ts`

**Purpose:** Double CSRF token protection using `csrf-csrf` library

**Key Details:**
- Uses `doubleCsrf` from npm package `csrf-csrf`
- Secret sourced from `env.APP_SECRET` (environment variable)
- Cookie name: `x-csrf-token`
- Cookie settings: `sameSite: strict`, `secure: true` (production only)
- Token size: 64 bytes
- Ignored methods: GET, HEAD, OPTIONS

**Exports:**
- `doubleCsrfProtection` - middleware function for Express
- `safeGenerateToken` - wrapped token generator with error handling

**Security Features:**
- Strict SameSite cookie policy prevents cross-site request forgery
- Secure flag enabled in production (HTTPS only)
- Safe token generation with fallback error handling
- Proper environment-based security configuration

---

### 2. API Key Authentication Middleware
**File:** `/Users/duynguyen/www/reviewweb-site/src/middlewares/api_key_auth.ts`

**Purpose:** Validate API keys and attach user context to requests

**Request Handler:** `apiKeyAuth` (Express RequestHandler)

**Key Details:**
- Accepts API key from two sources:
  1. `x-api-key` header
  2. Authorization header (Bearer token format)
- Validates key against database using Prisma
- Attaches validated API key and user to `res.locals`
- Allows pass-through if user already authenticated

**Validation Flow:**
1. Extract API key from headers
2. If no key and no logged-in user → return 401 Unauthorized
3. Query Prisma `apiKey` table for key validation
4. If key invalid and no logged-in user → return 401 with "Invalid API key" message
5. Set `res.locals.apiKey` to key object
6. Set `res.locals.user` and `res.locals.userId` from key.user (if not already set)
7. Call `next()`

**Error Handling:**
- Catch all exceptions with 500 Internal Server Error response
- Console error logging for debugging

---

### 3. Plan Limits Middleware (Rate Limiting)
**File:** `/Users/duynguyen/www/reviewweb-site/src/middlewares/check-plan-limits.ts`

**Purpose:** Enforce per-minute and per-month request limits based on user plan

**Middleware Function:** `checkPlanLimits` (async Express handler)

**Dependencies:**
- Redis for distributed rate limiting
- `dayjs` for time calculations
- `getUserPlanLimits()` from `/modules/payment/manage-plans`

**Rate Limiting Strategy:**
- **Per-minute limits:** Sliding window using `rate-limit:{userId}:per-minute:{currentMinute}`
  - Increments counter for current minute
  - Expires after 60 seconds
  - Returns 429 if exceeded: "Rate limit exceeded. Please try again in a minute."
  
- **Per-month limits:** Calendar-based using `rate-limit:{userId}:per-month:{YYYY-MM}`
  - Increments counter for current month
  - Expires after 31 days
  - Returns 429 if exceeded: "Monthly request limit exceeded. Please upgrade your plan."

**Request Validation:**
- Uses Zod schema to validate `res.locals` contains user object with id
- Returns 400 if validation fails

**Error Responses:**
- 400: Invalid request (missing user data)
- 403: No active plan found for user
- 429: Rate limit exceeded (minute or month)
- 500: Internal server error with logging

---

## Zod Schemas Analysis

### Broken Link Schemas
**File:** `/Users/duynguyen/www/reviewweb-site/src/schemas/broken-link-schemas.ts`

**Schemas Defined:**

#### 1. ScanBrokenLinksSchema
```typescript
z.object({
  url: z.string().url()
})
```
- **Purpose:** Input validation for broken link scanning
- **Type Export:** `ScanBrokenLinksInput`
- **Validation:** Strict URL format validation

#### 2. BrokenLinkSchema
```typescript
z.object({
  id: z.string(),
  url: z.string(),
  brokenUrl: z.string(),
  statusCode: z.number().nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})
```
- **Purpose:** Response schema for broken link records
- **Fields:**
  - `id` - Unique identifier (string)
  - `url` - Source URL being scanned
  - `brokenUrl` - Detected broken URL
  - `statusCode` - HTTP response code (nullable, can be null for network errors)
  - `error` - Error message from failed request (nullable)
  - `createdAt` - Timestamp (date object)
  - `updatedAt` - Last update timestamp (date object)

---

## Root Configuration Files Analysis

### 1. TypeScript Configuration
**File:** `/Users/duynguyen/www/reviewweb-site/tsconfig.json`

**Key Compiler Options:**
- **Target:** ESNext (latest ECMAScript features)
- **Module:** ESNext with bundler resolution
- **JSX:** react-jsx (React 17+ automatic JSX)
- **Strict Mode:** Enabled (all strict flags active)
- **Unused Variables:** Errors on unused locals/parameters
- **Module Resolution:** Bundler mode with import extensions

**Path Aliases:**
- `@/*` → `./src/*` (main source files)
- `@/public/*` → `./public/*` (static assets)

**Build Output:**
- `noEmit: true` - TypeScript for type checking only (transpilation handled elsewhere)

**Excluded Files:**
- commitlint.config.cjs
- lint-staged.config.cjs
- tailwind.config.cjs

---

### 2. ESLint Configuration
**File:** `/Users/duynguyen/www/reviewweb-site/eslint.config.js`

**Rules & Plugins:**
- **Parsers:** TypeScript (@typescript-eslint/parser)
- **Plugins:** 
  - Prettier (code formatting)
  - TypeScript ESLint
  - Tailwind CSS linting
  - Unused imports detection
  - Simple import sorting
  - Next.js rules

**Common Rules (JS & TS):**
- Prettier formatting with 2-space tabs, LF line endings
- Import sorting enabled
- No console warnings (permissive)
- No param reassignment warnings
- React destructuring/props spreading allowed
- Tailwind arbitrary values allowed

**TypeScript-Specific Rules:**
- `@typescript-eslint/consistent-type-imports: error` - Enforce `import type` syntax
- Comma-dangle disabled
- Naming convention enforcement disabled
- No-throw-literal disabled

**Ignored Paths:**
- node_modules, build, dist, coverage, .yarn, .out, .turbo, .temp, public/

---

### 3. Tailwind CSS Configuration
**File:** `/Users/duynguyen/www/reviewweb-site/tailwind.config.cjs`

**Content Paths:**
- `./src/**/*.{html,ejs,ts,js}` - Scans source files for Tailwind classes

**Theme Extensions:**
- **Font Family:**
  - heading: Fraunces, sans-serif
  - body: Fraunces, sans-serif

- **Custom Colors:**
  - Brand Primary: #FE8009 (orange)
  - Brand Primary 2: #FD9272 (lighter orange)
  - Brand Secondary: #8B1763 (magenta/purple)
  - Brand Secondary 2: #B25D99 (lighter magenta)
  - Brand Secondary 3: #F2F2F8 (light lavender)
  - CSS variable-based colors for secondary-2, secondary-3, pricing-single-bg

**Dark Mode:** Class-based selector (manual toggle)

---

### 4. Docker Configuration
**File:** `/Users/duynguyen/www/reviewweb-site/Dockerfile`

**Base Image:** Node.js 20.15.1

**Installed System Dependencies:**
- Python 3 (build/runtime requirement)
- iputils-ping
- GStreamer libraries (multimedia support)
- Playwright browser dependencies (Firefox, Chromium support)
- Audio/video codecs (libopus, libvpx, libx264)

**Build Steps:**
1. Install system dependencies (apt-get)
2. Download & install pnpm package manager
3. Install Bun package manager globally
4. Copy package.json and Prisma schema
5. Install npm dependencies via Bun
6. Install Playwright browsers with native dependencies
7. Copy source files (src/, bin/, public/)
8. Generate Prisma client (`bun run db`)
9. Expose port 3000
10. Start application with `npm run start`

**Key Notes:**
- Uses Bun for package installation (faster than npm)
- Playwright installed for browser automation/scraping
- Firefox ESR browser included for web analysis
- Comprehensive multimedia library support for media processing

---

## Middleware Chain & Request Flow

```
Incoming Request
    ↓
[CSRF Protection] (if POST/PUT/DELETE)
    ↓
[API Key Authentication]
    ├─ Extract key from headers
    ├─ Validate in database
    └─ Attach user to res.locals
    ↓
[Plan Limits Check]
    ├─ Fetch user plan limits from Prisma
    ├─ Check per-minute rate limit (Redis)
    ├─ Check per-month rate limit (Redis)
    └─ Return 429 if exceeded
    ↓
Route Handler
```

---

## Security Measures Summary

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **CSRF** | Double CSRF tokens | Strict SameSite, secure cookies in production |
| **Auth** | API Key validation | Database lookup, Bearer token support |
| **Rate Limiting** | Redis-based | Per-minute (sliding window) + per-month (calendar) |
| **Input Validation** | Zod schemas | Type-safe request parsing |
| **TypeScript** | Strict mode | Type safety, unused variable detection |

---

## Build & Deployment Configuration

| Aspect | Configuration |
|--------|---------------|
| **TypeScript Target** | ESNext (no transpilation, toolchain handles) |
| **Package Manager** | Bun (primary), pnpm (fallback), npm (scripts) |
| **Node Version** | 20.15.1 (Docker), v22.20.0 (local development) |
| **Browser Automation** | Playwright with Firefox ESR |
| **Styling** | Tailwind CSS (class-based dark mode) |
| **Linting** | ESLint + Prettier (2-space indent) |

---

## File Inventory

**Absolute File Paths:**

### Middleware Files
- `/Users/duynguyen/www/reviewweb-site/src/middlewares/csrf.ts`
- `/Users/duynguyen/www/reviewweb-site/src/middlewares/api_key_auth.ts`
- `/Users/duynguyen/www/reviewweb-site/src/middlewares/check-plan-limits.ts`

### Schema Files
- `/Users/duynguyen/www/reviewweb-site/src/schemas/broken-link-schemas.ts`

### Configuration Files
- `/Users/duynguyen/www/reviewweb-site/tsconfig.json`
- `/Users/duynguyen/www/reviewweb-site/eslint.config.js`
- `/Users/duynguyen/www/reviewweb-site/tailwind.config.cjs`
- `/Users/duynguyen/www/reviewweb-site/Dockerfile`

---

## Key Observations

1. **Minimal Schema Coverage:** Only one schema file found (broken-link-schemas.ts). Project likely has additional schemas in other modules (payment, auth, etc.)

2. **Redis Dependency:** Rate limiting relies on Redis for distributed state. Critical for multi-instance deployments.

3. **Plan-Based Access Control:** Middleware enforces per-plan request limits, enabling tiered service model.

4. **TypeScript Best Practices:** Strict mode + unused variable detection ensures code quality.

5. **Docker Optimization:** Includes full browser automation stack (Playwright + Firefox), suitable for web scraping/analysis use case.

6. **Brand Colors:** Custom Fraunces font family and orange/magenta brand palette throughout Tailwind config.

---

## Unresolved Questions

1. Where are additional Zod schemas located? (Search other module directories like /modules/*, /lib/*)
2. Is Redis connection configured via env variables? (Check .env setup)
3. Are there custom error handlers or global middleware orchestration files?
4. What's the request/response logging strategy?

