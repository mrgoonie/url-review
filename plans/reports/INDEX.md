# ReviewWeb.site Codebase Scout Reports
**Generated:** 2025-12-10 02:31 UTC  
**Scope:** src/routes, src/config, src/views, prisma/ directories

---

## Report Files

### 1. **scout-ext-251210-0231-summary.txt** (8.7 KB) - START HERE
Quick reference guide with executive summary.

**Contents:**
- Key findings & project overview
- Directory structure breakdown
- Complete API endpoint listing (16 modules)
- Database models inventory (40+)
- Technology stack
- Architecture patterns
- Recommendations for next steps

**Best for:** Quick overview, API reference, architecture understanding

---

### 2. **scout-ext-251210-0231-url-review.md** (19 KB) - DETAILED DOCUMENTATION
Comprehensive technical documentation with in-depth analysis.

**Contents:**
- Executive summary
- API routes directory structure
- Detailed API endpoint modules with:
  - Purpose & description
  - Complete endpoint listing
  - Request/response schemas
  - Authentication requirements
  - Key features & integrations
- Complete Prisma database schema with:
  - All 40+ models documented
  - Relationships & constraints
  - Enum definitions
- Configuration files documentation
- View templates overview
- Authentication & middleware patterns
- External service integrations
- Architecture observations & patterns
- File inventory summary
- Unresolved questions

**Best for:** Deep dive, implementation reference, architecture design

---

### 3. **scout-ext-251210-0231-file-inventory.md** (13 KB) - COMPLETE FILE LISTING
Detailed file-by-file inventory with hierarchical organization.

**Contents:**
- API routes directory with file sizes
- Authentication routes
- Page routes  
- Webhook handlers
- Configuration files with line counts
- Database schema breakdown
- View templates organization
- Technology stack summary
- Key observations

**Best for:** File navigation, dependency tracking, code location reference

---

### 4. **scout-ext-251210-srclib.md** (13 KB) - SRCLIB ANALYSIS
Automated analysis from srclib scanner (supplementary reference).

**Best for:** Machine-readable analysis, automated tooling integration

---

## Quick Navigation

### By Task

**"I need to understand the API structure"**
→ Read: scout-ext-251210-0231-summary.txt (API Endpoints section)
→ Then: scout-ext-251210-0231-url-review.md (API Routes Documentation)

**"I need to find a specific file"**
→ Read: scout-ext-251210-0231-file-inventory.md

**"I need to understand the database"**
→ Read: scout-ext-251210-0231-url-review.md (Database Schema section)

**"I need to understand the architecture"**
→ Read: scout-ext-251210-0231-summary.txt (Architecture Patterns)
→ Then: scout-ext-251210-0231-url-review.md (full documentation)

**"I need to add a new API endpoint"**
→ Read: scout-ext-251210-0231-url-review.md (API Routes section)
→ Reference: scout-ext-251210-0231-file-inventory.md (API routes location)

**"I need to modify the database schema"**
→ Read: scout-ext-251210-0231-url-review.md (Database Schema section)
→ File: /Users/duynguyen/www/reviewweb-site/prisma/schema.prisma

**"I need to understand authentication"**
→ Read: scout-ext-251210-0231-url-review.md (Authentication & Middleware section)

**"I need to modify a view template"**
→ Read: scout-ext-251210-0231-url-review.md (View Templates section)
→ Navigate: /Users/duynguyen/www/reviewweb-site/src/views/

---

## Key Statistics

| Metric | Count | Location |
|--------|-------|----------|
| API Endpoint Modules | 16 | src/routes/api/*.ts |
| API Endpoints | 25+ | /api/v1/* |
| Auth Routes | 6 | src/routes/auth/*.ts |
| Page Routes | 11 | src/routes/pages/*.ts |
| Webhook Handlers | 2 | src/routes/webhooks/*.ts |
| Configuration Files | 5 | src/config/*.ts |
| Database Models | 40+ | prisma/schema.prisma |
| Database Enums | 12 | prisma/schema.prisma |
| View Templates | 34+ | src/views/**/*.ejs |
| Total Report Size | 53 KB | plans/reports/ |

---

## Project Overview

**Name:** ReviewWeb.site  
**Type:** Node.js REST API + Server-Rendered Frontend  
**Framework:** Express.js  
**Language:** TypeScript  
**Database:** PostgreSQL (Prisma ORM)  
**Frontend:** EJS Templates + Tailwind CSS  
**Authentication:** Lucia (sessions) + OAuth (GitHub/Google) + API Keys  

**Core Features:**
- AI-powered website analysis & reviews
- Web scraping & HTML extraction
- Link health checking & broken link detection
- Content extraction & summarization
- Screenshot capture (desktop/mobile/tablet)
- SEO insights & metadata analysis
- Multi-tenant workspaces
- Subscription management (Polar integration)
- User account & API key management

---

## Report Generation Info

**Scout Agent:** claude-haiku-4-5-20251001  
**Date:** 2025-12-10  
**Time:** 02:31 UTC  
**Duration:** ~3 minutes  
**Directories Analyzed:** src/routes, src/config, src/views, prisma/  

**Search Strategy:**
- Parallel file discovery using bash find commands
- Sequential deep-dive file reading using Read tool
- Manual code analysis for routing patterns & schemas

**Data Sources:**
- 40+ TypeScript/JavaScript files analyzed
- 1 Prisma schema file (624 lines)
- 34+ EJS template files reviewed
- 5 configuration files documented

---

## Recommendations for Next Steps

### For New Developers
1. Start with scout-ext-251210-0231-summary.txt
2. Review the API endpoints section
3. Explore src/routes/api/ directory
4. Reference prisma/schema.prisma for data models
5. Check src/views/ for UI templates

### For Feature Development
1. Read the relevant API module documentation
2. Check database models in schema.prisma
3. Review existing similar endpoints as pattern
4. Follow Zod validation pattern from existing code
5. Update OpenAPI documentation (@openapi comments)

### For Database Changes
1. Review Prisma schema structure
2. Understand relationships & constraints
3. Create migration: `npx prisma migrate dev --name <name>`
4. Test with `npx prisma studio`
5. Update this documentation

### For API Integration
1. Review swagger.ts for OpenAPI config
2. Check X-API-Key header auth in apiKeyAuth middleware
3. Reference existing api-*.ts files for patterns
4. Add OpenAPI comments for documentation
5. Test with Swagger UI at /api-docs

---

## Additional Resources

**In this Project:**
- Configuration: `/Users/duynguyen/www/reviewweb-site/src/config/`
- Database Schema: `/Users/duynguyen/www/reviewweb-site/prisma/schema.prisma`
- API Endpoints: `/Users/duynguyen/www/reviewweb-site/src/routes/api/`
- Views: `/Users/duynguyen/www/reviewweb-site/src/views/`
- Swagger Config: `/Users/duynguyen/www/reviewweb-site/src/config/swagger.ts`

**External Documentation:**
- Express.js: https://expressjs.com/
- Prisma: https://www.prisma.io/docs/
- EJS: https://ejs.co/
- Lucia Auth: https://lucia.js.org/
- Zod: https://zod.dev/
- OpenAPI/Swagger: https://swagger.io/

---

## Contact & Support

**Project Owner:** Goon Nguyen  
**Contact:** goon@wearetopgroup.com  
**GitHub:** @goon_nguyen  

**Repository:** /Users/duynguyen/www/reviewweb-site  
**Current Branch:** dev/goon  

---

**Last Updated:** 2025-12-10 02:31 UTC  
**Report Version:** 1.0
