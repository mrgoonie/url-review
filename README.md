# ReviewWeb.site - AI-Powered Website Analysis Platform

[ReviewWeb.site](https://reviewweb.site) is an intelligent platform that uses AI to analyze websites, extract content, and generate comprehensive reports.

## Key Features

**Analysis & Review**
- 10-step automated website analysis workflow
- AI-powered content summarization
- Screenshot capture (multiple viewports)
- Link extraction and status validation
- Metadata extraction (Open Graph, Twitter, SEO)

**Content Processing**
- HTML-to-Markdown conversion
- Intelligent data extraction with JSON templates
- Batch processing (10+ URLs/minute)
- Multi-language support

**Developer Tools**
- RESTful API with consistent response format
- API key management and OAuth2 (GitHub, Google)
- Webhook support for webhooks
- Token usage tracking and cost calculation

**Subscription & Billing**
- Tiered pricing plans (Free, Pro, Enterprise)
- Per-minute and per-month rate limiting
- Credit-based token tracking
- Payment integration (Polar, SePay, LemonSqueezy)

## Tech Stack

- **Runtime:** Node.js v20+ with TypeScript
- **Framework:** Express.js with EJS templates
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (pub/sub, caching, sessions)
- **Auth:** Lucia (session-based with OAuth2)
- **Validation:** Zod schemas
- **Styling:** TailwindCSS
- **Scraping:** Playwright + 5-method fallback chain
- **AI:** OpenRouter (25+ LLM providers)

## Quick Start

### Prerequisites
- Node.js v20+, PostgreSQL 12+, Redis 6+
- Bun (recommended) or npm/yarn

### Local Development

```bash
# Clone repository
git clone git@github.com:mrgoonie/url-review.git
cd url-review

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Install dependencies
bun i

# Setup database
bun run db:push

# Start development server
bun dev
# Available at http://localhost:3000
```

### Docker

```bash
# Local stack (db + redis)
docker compose up

# Production build
docker build -t reviewweb-site .
docker run -p 3000:3000 reviewweb-site
```

## API Overview

### Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/review` | Analyze a website (10-step workflow) |
| POST | `/api/v1/scrape` | Extract HTML content |
| POST | `/api/v1/scrape/extract` | Extract data with JSON template |
| POST | `/api/v1/screenshot` | Capture webpage screenshot |
| POST | `/api/v1/convert` | Convert URL to Markdown |
| POST | `/api/v1/summarize/url` | Summarize single URL |
| POST | `/api/v1/summarize/website` | Summarize full website |
| GET | `/api/v1/profile` | Get user profile |
| GET | `/api/v1/api_key` | Manage API keys |

### Authentication

**Option 1: API Key**
```bash
curl -H "x-api-key: your-api-key" \
  https://api.reviewweb.site/api/v1/profile
```

**Option 2: Bearer Token**
```bash
curl -H "Authorization: Bearer your-api-key" \
  https://api.reviewweb.site/api/v1/profile
```

### Response Format

All API responses follow this standard:

```json
{
  "status": 200,
  "data": { ... },
  "messages": ["optional", "messages"]
}
```

## Architecture

ReviewWeb.site uses a layered architecture:

1. **Middleware Layer:** CSRF protection, API authentication, rate limiting
2. **API Layer:** RESTful endpoints (/api/v1/*)
3. **Business Logic:** 18 focused modules (review, scrape, summarize, etc.)
4. **Library Layer:** 97 utility files (AI, scraping, auth, payment, etc.)
5. **Data Layer:** PostgreSQL + Redis

See `/docs/system-architecture.md` for detailed architecture diagrams.

## Project Documentation

- **[Project Overview & PDR](/docs/project-overview-pdr.md)** - Vision, goals, requirements, roadmap
- **[Codebase Summary](/docs/codebase-summary.md)** - Directory structure, modules, libraries, database
- **[Code Standards](/docs/code-standards.md)** - Coding conventions, patterns, best practices
- **[System Architecture](/docs/system-architecture.md)** - Architecture diagrams, data flows, integrations

## Deployment

### Production (DXUP)

```bash
# Deploy to production
dx up --prod

# Deploy to preview (on PR)
dx up
```

GitHub Actions automatically deploys on:
- PR merge to `main` → production
- PR creation → preview environment

### Configuration

- **Environment Variables:** See `.env.example`
- **Database:** PostgreSQL connection pooling (5-20 connections)
- **Cache:** Redis with configurable TTL
- **Monitoring:** Comprehensive logging and error tracking

## Development Workflow

### Code Standards

All code must follow:
- TypeScript strict mode
- Zod validation on inputs
- Error handling with context
- Modular structure (one module per directory)
- Conventional commit messages

### Running Tests

```bash
bun run test
bun run lint
bun run lint:fix
```

### Database Migrations

```bash
# Create migration
bun run db:create

# Apply migrations
bun run db:push

# Prisma Studio (visual editor)
bun run db:studio
```

## Contributing

We welcome contributions! Please:
1. Follow the code standards in `/docs/code-standards.md`
2. Create a feature branch from `main`
3. Make focused commits with conventional message format
4. Submit a PR with description of changes

## Performance

- API response time: <5s (p95) for single URL analysis
- Batch processing: 10+ URLs/minute
- Screenshot capture: <10s per page
- 99.5% uptime SLA
- Horizontal scaling support

## Security

- HTTPS-only (TLS 1.2+)
- CSRF protection (double tokens)
- API key authentication
- Rate limiting (per-minute and per-month)
- SQL injection prevention (Prisma ORM)
- XSS protection (template escaping)
- Session management (HttpOnly cookies)

## Rate Limiting

All endpoints enforce rate limits based on subscription plan:

- **Free:** 10 requests/minute, 1,000/month
- **Pro:** 100 requests/minute, 10,000/month
- **Enterprise:** Custom limits

Returns HTTP 429 when exceeded.

## Support & Community

- **Author:** Goon Nguyen ([@goon_nguyen](https://x.com/goon_nguyen))
- **Organization:** TOP GROUP, DIGITOP, XinChao Live Music
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

## Related Projects

- [IndieBoosting.com](https://indieboosting.com) - Feature your indie product
- [DigiCord AI](https://digicord.site) - AI chatbot for Discord
- [TopRanking.ai](https://topranking.ai) - AI product directory
- [ZII.ONE](https://zii.one) - Link shortener
- [VidCap.xyz](https://vidcap.xyz) - YouTube tools

## License

See LICENSE file for details.

---

**Last Updated:** 2025-12-10
**Repository:** git@github.com:mrgoonie/url-review.git
**Demo:** https://reviewweb.site