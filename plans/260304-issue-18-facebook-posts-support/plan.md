# Plan: Facebook Posts Support for Convert-to-Markdown API

**Issue:** #18 - feat: to markdown api should support Facebook posts
**Branch:** `dev/goon`
**Status:** Draft
**Effort:** ~2-3h

## Summary

Add Facebook post URL support to the convert-to-markdown API, following the exact same pattern as the existing Twitter/X implementation. Single API provider (RapidAPI `facebook-scraper3`), fallback to generic scrape methods.

## Scope (Confirmed by issue author)

- No comments support (future enhancement)
- `fb.watch` video URLs: included
- Config: rely on existing `RAPID_API_KEY` (no new env var)
- Album photos: include ALL from `album_preview`

## Files

| Action | File | Description |
|--------|------|-------------|
| **New** | `src/lib/scrape/get-facebook-content.ts` | URL detection, API fetch, HTML conversion |
| **Modify** | `src/lib/scrape/get-html-with-fallbacks.ts` | Add Facebook early interception (line ~224) |
| **Modify** | `src/lib/scrape/index.ts` | Add barrel export |

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Create Facebook content module](phase-01-create-facebook-content-module.md) | 1.5h | ⬜ |
| 2 | [Integrate with fallback chain](phase-02-integrate-with-fallback-chain.md) | 30m | ⬜ |
| 3 | [Test & verify](phase-03-test-and-verify.md) | 30m | ⬜ |

## Architecture

```
URL → getHtmlWithFallbacks()
  ├── isTwitterUrl() → getTwitterHtml() → Twitter API chain
  ├── isFacebookUrl() → getFacebookHtml() → RapidAPI facebook-scraper3  ← NEW
  └── generic scrape methods (axios → playwright → scrapling → ...)
```

## Risk

- **Low:** Follows proven Twitter pattern, isolated module, no breaking changes, no DB changes
- **Medium concern:** Single API provider (no free fallbacks like Twitter). If API fails → falls through to generic scrape
