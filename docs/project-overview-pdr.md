# ReviewWeb.site - Project Overview & Product Development Requirements

## Executive Summary

ReviewWeb.site is an AI-powered website analysis platform that leverages advanced web scraping, computer vision, and large language models to provide comprehensive website reviews and insights. The platform enables users to analyze websites, extract data, generate content, and monitor website performance at scale.

**Project Status:** Active Development
**Repository:** git@github.com:mrgoonie/url-review.git
**Current Branch:** dev/goon
**Demo:** https://reviewweb.site

---

## Product Vision

### Mission Statement
Democratize website analysis by making advanced AI-powered content extraction and review capabilities accessible to everyone - from individual developers to enterprise teams.

### Core Value Proposition
- **Speed:** Analyze websites in seconds instead of hours
- **Intelligence:** AI-driven insights beyond basic metrics
- **Flexibility:** Multiple analysis modes and output formats
- **Scale:** Batch processing and high-throughput API access
- **Integration:** RESTful API with webhook support

---

## Target Audience

### Primary Users
1. **Web Developers & Designers** - Analyze website quality, UX, accessibility
2. **Content Creators** - Extract and repurpose content, generate summaries
3. **SEO Professionals** - Analyze on-page SEO, meta tags, structure
4. **Digital Marketers** - Competitive analysis, content research
5. **Business Analysts** - Website performance monitoring, AI insights

### Secondary Users
- Enterprise teams requiring API access and workspace management
- Agencies managing multiple client websites
- Researchers analyzing web content at scale

---

## Key Features

### Core Capabilities

#### 1. Website Analysis (Review Module)
- **10-step analysis workflow:**
  1. URL validation and categorization
  2. Screenshot capture (multiple viewport sizes)
  3. HTML extraction with fallback methods
  4. Metadata extraction (OG, Twitter, SEO)
  5. Image discovery and analysis
  6. Link mapping and extraction
  7. AI-powered HTML analysis (LLM)
  8. Vision analysis of screenshot (vision model)
  9. Per-image analysis (parallel processing)
  10. Per-link analysis (parallel processing)

#### 2. Web Scraping (Scrape Module)
- **Intelligent fallback chain:**
  - Axios (lightweight HTTP)
  - Firecrawl (JS rendering)
  - Playwright (full browser automation)
  - Scrapedo (anti-detection)
  - Scrappey (proxy rotation)
- **Link extraction and validation**
- **Status code verification**
- **Internal/external link filtering**
- **Blocked website detection**

#### 3. Content Processing
- **HTML-to-Markdown conversion** with AI enhancement
- **AI-powered summarization** (single URL, full website, batch)
- **Data extraction** with JSON template support
- **Batch processing** with controlled concurrency
- **Token usage tracking** and cost calculation

#### 4. Media Handling
- **Screenshot capture** - Desktop, mobile, tablet viewports
- **Shareable thumbnails** - Multiple templates
- **Image extraction** - Bulk image discovery
- **Vision analysis** - AI understanding of images

#### 5. User & Workspace Management
- **Multi-tenant architecture** - Teams and workspaces
- **Role-based access control** (RBAC)
- **API key management** - Per-user API access
- **User balance tracking** - Credit/token management

#### 6. Subscription & Billing
- **Tiered subscription plans** - Free, Pro, Enterprise
- **Usage-based billing** - Per-request and per-month limits
- **Payment integration** - Polar (primary), SePay, LemonSqueezy
- **Rate limiting** - Per-minute and per-month enforcement
- **Email notifications** - Order and subscription updates

#### 7. Analytics & Monitoring
- **Link performance metrics** - Clicks, referrers, devices
- **QR code analytics** - Scan tracking
- **User statistics** - Usage patterns, popular features
- **API monitoring** - Request tracking and usage stats

### Data Services
- **SEO insights** - Backlinks, keyword research, traffic analysis
- **Meta tag generation** - AI-powered SEO optimization
- **YouTube integration** - Video data extraction, transcription
- **Content categorization** - Automatic URL categorization
- **Brand asset detection** - Logo and brand image recognition

---

## Success Metrics

### Quantitative Metrics
1. **Performance**
   - API response time: <5s for single URL analysis
   - Screenshot capture: <10s per page
   - Batch processing: 10+ URLs/minute
   - Uptime: 99.5% SLA

2. **Adoption**
   - User signups: Track MoM growth
   - API requests: Monthly request volume
   - Subscription conversion: Free-to-paid ratio
   - Workspace adoption: Team size growth

3. **Usage**
   - Daily active users (DAU)
   - API key adoption rate
   - Average requests per user per day
   - Feature usage distribution

4. **Business
   - Monthly recurring revenue (MRR)
   - Customer acquisition cost (CAC)
   - Lifetime value (LTV)
   - Churn rate

### Qualitative Metrics
- User satisfaction (NPS)
- API documentation clarity
- Support response time
- Feature request frequency

---

## Core Requirements

### Functional Requirements

#### FR-1: Website Analysis
- Accept URL input from authenticated users
- Execute 10-step analysis workflow
- Return comprehensive analysis results
- Support custom AI model selection
- Enable/disable specific analysis steps
- Store results in database with 30-day retention

#### FR-2: Web Scraping
- Support 5-layer fallback scraping strategy
- Detect and skip blocked websites
- Extract HTML content preserving structure
- Simplify HTML for LLM processing
- Handle JavaScript-heavy sites

#### FR-3: Authentication & Authorization
- OAuth2 integration (GitHub, Google)
- API key-based authentication
- CSRF protection for web forms
- Session management with 7-day expiration
- Role-based access control (Admin, User, Viewer)

#### FR-4: Subscription Management
- Define subscription tiers (Free, Pro, Enterprise)
- Enforce per-minute and per-month limits
- Track user balance and credits
- Support plan upgrades/downgrades
- Handle subscription lifecycle

#### FR-5: API Access
- RESTful API with JSON responses
- Consistent response format
- Error handling with descriptive messages
- Rate limiting per API key
- Usage statistics tracking

### Non-Functional Requirements

#### NFR-1: Performance
- API response time: <5s (p95) for single URL
- Batch processing: 10+ URLs/minute sustained
- Screenshot capture: <10s per page
- Database queries: <500ms (p95)
- Cache hit ratio: >70%

#### NFR-2: Scalability
- Support 1000+ concurrent users
- Handle 10,000+ requests/hour
- Multi-tenant isolation with database-level enforcement
- Horizontal scaling via Redis for caching/messaging
- Connection pooling (5-20 PostgreSQL connections)

#### NFR-3: Security
- HTTPS-only communication
- TLS 1.2+ for data transport
- Password hashing with bcrypt
- CSRF token validation
- XSS protection via template escaping
- SQL injection protection via ORM
- API key rotation support
- Rate limiting to prevent abuse

#### NFR-4: Reliability
- 99.5% uptime SLA
- Graceful degradation with fallback methods
- Comprehensive error logging
- Transaction rollback on failure
- Database connection retry logic
- Cache invalidation handling

#### NFR-5: Maintainability
- TypeScript strict mode for type safety
- Zod validation on all inputs
- Comprehensive error handling
- Modular architecture (18 business modules)
- Clear separation of concerns
- Code documentation via comments
- Linting with ESLint + Prettier

---

## Technical Constraints

### Technology Stack
- **Runtime:** Node.js v20+ (TypeScript)
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (ioredis)
- **Auth:** Lucia (session-based)
- **Validation:** Zod schemas
- **Browser Automation:** Playwright

### External Dependencies
- **AI:** OpenRouter API (25+ model providers)
- **Payments:** Polar, SePay, LemonSqueezy
- **Email:** Elastic Email, Resend
- **Storage:** Cloudflare R2, Upfile Best CDN
- **Web Scraping:** Firecrawl, Scrapedo, Scrappey APIs

### Environment Requirements
- PostgreSQL 12+ with connection pooling
- Redis 6+ for caching and pub/sub
- Node.js 20.15.1+ (Docker)
- Bun package manager (optional, compatible with npm)
- 4GB RAM minimum (8GB+ recommended)
- Docker & Docker Compose for containerization

---

## Implementation Roadmap

### Phase 1: MVP (Completed)
- Core website analysis (10-step workflow)
- Web scraping with fallbacks
- User authentication (GitHub/Google OAuth)
- Basic subscription plans
- RESTful API

### Phase 2: Expansion (In Progress)
- Batch processing capabilities
- Advanced analytics dashboard
- Team/workspace management
- API key management
- Rate limiting enforcement

### Phase 3: Enterprise (Planned)
- WebhookNotifications
- Advanced RBAC
- Custom AI model support
- SLA monitoring
- Dedicated support tier

### Phase 4: Platform (Future)
- Marketplace for extensions
- Custom analysis workflows
- Workflow builder UI
- Event-driven architecture
- Multi-region deployment

---

## Database Schema Highlights

### Core Entity Groups

**Authentication & Users**
- User, Session, Key, Account, PasswordResetToken
- UserRole, Role, Permission

**Billing & Subscriptions**
- Plan, UserPlan, WorkspacePlan, Order, Payment, CashTransaction

**Content & Analysis**
- Review, Screenshot, Category, WebUrl, BrokenLink, ScanLinkResult

**Management**
- ApiKey, MetaFile, Workspace, UserWorkspace

**Analytics**
- Link, LinkView, QrCodeScan, Metadata

### Key Relationships
- 1:N User → Review (one user, many reviews)
- 1:N User → ApiKey (one user, multiple API keys)
- 1:N User → Workspace (one user, multiple workspaces)
- 1:N Review → Screenshot (one review, multiple screenshots)
- M:N WebUrl ↔ Category (many URLs, many categories)

---

## API Overview

### Primary Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/review` | POST | Start website review |
| `/api/v1/scrape` | POST | Scrape website HTML |
| `/api/v1/scrape/extract` | POST | Extract data with AI |
| `/api/v1/screenshot` | POST | Capture screenshot |
| `/api/v1/convert` | POST | HTML-to-Markdown conversion |
| `/api/v1/summarize/url` | POST | Summarize single URL |
| `/api/v1/summarize/website` | POST | Summarize full website |
| `/api/v1/profile` | GET | User profile |
| `/api/v1/api_key` | GET/POST | API key management |

### Response Format
```json
{
  "status": 200,
  "data": { ... },
  "messages": ["optional", "messages"]
}
```

---

## Security & Compliance

### Security Measures
- HTTPS-only (TLS 1.2+)
- CSRF protection (double CSRF tokens)
- API key authentication (header/bearer token)
- SQL injection prevention (Prisma ORM)
- XSS protection (template escaping)
- Rate limiting (per-minute, per-month)
- CORS configuration for web clients
- Session security (HttpOnly, Secure cookies)

### Data Privacy
- User data isolation by workspace
- Encrypted API keys in database
- Optional data retention policies
- GDPR compliance considerations
- User data export capabilities

---

## Deployment & Ops

### Deployment Targets
- Docker containerization
- GitHub Actions CI/CD
- DXUP (production deployment)
- Preview environments for PRs

### Monitoring & Logging
- Error logging with context
- Request/response logging
- Database query logging
- Redis operation logging
- Email delivery tracking

### Configuration Management
- Environment variables via .env
- TypeScript strict mode
- ESLint + Prettier formatting
- Commitlint for conventional commits

---

## Product Roadmap (Next 6 Months)

### Q1 2025
- [ ] Webhook notifications for completed reviews
- [ ] Advanced filtering in analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Custom AI prompt templates

### Q2 2025
- [ ] Workflow builder UI
- [ ] Scheduled analysis runs
- [ ] Export to multiple formats (PDF, CSV)
- [ ] Team collaboration features

### Q3 2025
- [ ] Multi-region deployment
- [ ] Enhanced SEO insights
- [ ] Competitive website tracking
- [ ] Custom branding for agencies

---

## Dependencies & Integrations

### Critical Dependencies
- Prisma ORM (database)
- Lucia (authentication)
- OpenRouter (LLM access)
- Polar (payments)
- Redis (caching/messaging)

### Optional Integrations
- Google OAuth (authentication)
- GitHub OAuth (authentication)
- YouTube API (content extraction)
- SEO tools API (external insights)
- Email services (notifications)

---

## Known Limitations & Future Improvements

### Current Limitations
1. Single-region deployment (no global CDN)
2. Limited to Express.js (no microservices yet)
3. Redis dependency for distributed features
4. Synchronous analysis workflow (no async jobs)
5. Fixed AI model provider (OpenRouter)

### Planned Improvements
1. Async job queue (Bull or similar)
2. Multi-region support
3. Webhook notifications
4. Custom workflow builder
5. Plugin/extension system
6. GraphQL API option
7. Real-time collaboration features

---

## Getting Started for Developers

### Prerequisites
- Node.js v20.15.1+
- PostgreSQL 12+
- Redis 6+
- Bun (optional, or use npm)

### Setup
```bash
# Clone and setup
git clone git@github.com:mrgoonie/url-review.git
cd url-review
cp .env.example .env
bun i

# Database
bun run db:push

# Development
bun dev
```

### Documentation
- See `/docs/code-standards.md` for coding guidelines
- See `/docs/system-architecture.md` for architecture overview
- See `/docs/codebase-summary.md` for detailed module reference

---

## Contact & Support

**Project Owner:** Goon Nguyen ([@goon_nguyen](https://x.com/goon_nguyen))
**Organization:** TOP GROUP, DIGITOP, XinChao Live Music
**Contributing:** Contributions welcome! See CONTRIBUTING.md

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2024-01 | Initial MVP release |
| 1.1.0 | 2024-06 | Batch processing, analytics |
| 1.2.0 | 2024-12 | Team management, RBAC |
| 2.0.0 | 2025-Q2 | Webhooks, advanced features (planned) |

---

**Last Updated:** 2025-12-10
**Documentation Version:** 1.0
**Maintained By:** Development Team
