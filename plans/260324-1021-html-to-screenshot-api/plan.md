---
title: "HTML-to-Screenshot API"
description: "API endpoint to render HTML string or ZIP file to screenshot image via Playwright"
status: completed
priority: P2
effort: 4h
branch: claude/pensive-lamport
tags: [feature, api, backend, playwright]
blockedBy: []
blocks: []
created: 2026-03-24
---

# HTML-to-Screenshot API

## Overview

Add `POST /api/v1/html-to-screenshot` endpoint that accepts raw HTML string or ZIP file containing HTML/CSS/JS/assets, renders via Playwright browser, and returns screenshot as R2 URL or direct image buffer.

## Cross-Plan Dependencies

None.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Install Dependencies & ZIP Utility](./phase-01-install-deps-and-zip-utility.md) | Done |
| 2 | [Playwright HTML Rendering Module](./phase-02-playwright-html-rendering.md) | Done |
| 3 | [API Route & Integration](./phase-03-api-route-and-integration.md) | Done |
| 4 | [Testing & Validation](./phase-04-testing-and-validation.md) | Done |

## Dependencies

- Playwright (existing) — browser pool for rendering
- `adm-zip` (new) — ZIP extraction
- Multer (existing) — file upload handling
- Cloudflare R2 (existing) — image storage

## Architecture

```
Client
  │
  ├─ JSON { html: "..." }    ─── page.setContent(html) ──┐
  │                                                        ├─► screenshot ─► R2 URL / buffer
  └─ Multipart { file: .zip } ── extract to /tmp ──┐      │
                                  serve via Express ─┘     │
                                  page.goto(localhost) ────┘
```

## Key Decisions

1. **HTML string**: `page.setContent()` — no temp files, no serving needed
2. **ZIP file**: extract → serve temp dir via Express static → `page.goto()` → cleanup
3. **Output**: field `output` in request body — `"url"` (default, upload to R2) or `"buffer"` (return binary)
4. **Security**: validate ZIP paths (zip-slip), enforce 50MB limit, always cleanup temp files
