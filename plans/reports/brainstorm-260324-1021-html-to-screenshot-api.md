# Brainstorm: HTML-to-Screenshot API

## Problem Statement
System has screenshot API (`POST /api/v1/screenshot`) but only accepts URLs. Need API to accept raw HTML string or ZIP file (HTML/CSS/JS/assets) → render in browser → return screenshot image.

## Requirements
- **Input**: HTML string (JSON body) OR ZIP file (multipart form, max 50MB)
- **Output**: R2 URL or direct image buffer (user's choice per request)
- **JS support**: Simple JS (toggles, CSS animations) — no heavy frameworks
- **Use case**: Generic HTML renderer

## Current Infrastructure (Ready to Reuse)
- Playwright browsers (Firefox + Chromium) with browser pool
- Cloudflare R2 storage (`uploadFileBuffer()`)
- Screenshot function (`src/lib/playwright/screenshot.ts`)
- Multer for file upload
- Prisma ORM + PostgreSQL

## Chosen Approach: `page.setContent()` + Temp Static Server

### HTML String Input
- Use Playwright's `page.setContent(html)` — renders HTML directly in browser, no URL needed
- Inline CSS/JS works, external CDN resources also load

### ZIP File Input
- Extract ZIP to temp directory using `adm-zip`
- Serve temp dir via Express static route: `/tmp-render/:sessionId/`
- Navigate Playwright to `http://localhost:PORT/tmp-render/:sessionId/index.html`
- Take screenshot
- Cleanup temp files after response

### Output
- Query param `output=url` → upload to R2, return public URL
- Query param `output=buffer` → return image binary directly
- Default: `url`

## New Endpoint
`POST /api/v1/html-to-screenshot`

### Input Schemas
```
// JSON body (HTML string)
{
  "html": "<html>...</html>",
  "viewport": { "width": 1400, "height": 800 },
  "fullPage": false,
  "output": "url" | "buffer",
  "delayAfterLoad": 0
}

// Multipart form (ZIP file)
file: archive.zip (max 50MB)
viewport: JSON string { "width": 1400, "height": 800 }
fullPage: boolean
output: "url" | "buffer"
entryFile: "index.html" (optional)
delayAfterLoad: number (optional)
```

## Dependencies
- `adm-zip` — ZIP extraction (lightweight, no native deps)
- `multer` — already installed for file upload
- `uuid` or `crypto.randomUUID()` — session ID for temp dirs

## Security Considerations
- Path traversal protection on ZIP extraction (validate file paths)
- Max file size enforcement (50MB)
- Temp directory cleanup (always, even on error)
- Rate limiting (reuse existing API key auth)
- HTML sanitization optional (user's own content)
- Timeout on rendering (prevent infinite loops)

## Risk Assessment
- **Low**: Playwright `page.setContent()` is well-documented, stable API
- **Medium**: ZIP extraction needs careful path validation (zip-slip attack)
- **Low**: Temp file cleanup — use try/finally pattern

## Success Criteria
- API accepts HTML string → returns screenshot
- API accepts ZIP file → extracts, renders, returns screenshot
- Output toggleable between R2 URL and buffer
- Temp files cleaned up after each request
- Existing screenshot infra (browser pool, R2) reused
- No breaking changes to existing APIs

## Files to Create/Modify
- NEW: `src/routes/api/api-html-to-screenshot.ts` — new API route
- NEW: `src/lib/playwright/render-html-content.ts` — HTML rendering logic
- NEW: `src/lib/utils/extract-zip.ts` — ZIP extraction utility
- MODIFY: `src/routes/api/index.ts` — mount new route
- MODIFY: `src/server.ts` — add temp static serving route (if needed)

## Next Steps
→ Create detailed implementation plan with phases
