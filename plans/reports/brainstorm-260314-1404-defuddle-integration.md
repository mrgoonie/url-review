---
type: brainstorm
date: 2026-03-14
slug: defuddle-integration
status: agreed
---

# Brainstorm: Defuddle Integration as Pre-LLM Content Extractor

## Problem
`simplifyHtml()` only strips tags (scripts, styles, meta) but does NOT identify main content. Nav, sidebar, footer, ads still pass through → LLM processes noise → high token cost, slow, inconsistent quality.

## Agreed Solution: Approach B+C

### Architecture
```
Current:  fetch HTML → simplifyHtml() [strip tags] → LLM [extract + convert]
New:      fetch HTML → Defuddle [extract main + metadata] → LLM [polish only]
                         ↓ fail
                    simplifyHtml() [fallback]
```

### Key Decisions
- **Package**: `defuddle/node` (npm) + `linkedom` for DOM parsing
- **Position**: Pre-LLM filter replacing `simplifyHtml()` with fallback
- **Metadata**: Defuddle extracts title/author/date/OG/schema.org FREE (no LLM)
- **Fallback**: `simplifyHtml()` if Defuddle fails on edge cases

### Expected Impact
| Metric | Before | After |
|--------|--------|-------|
| HTML to LLM | ~30-50% of original | ~5-15% (main content) |
| Token cost/convert | ~2000-8000 | ~500-2000 |
| Metadata | LLM-dependent | Deterministic |
| Speed | 5-30s | 50ms + 2-10s |

### Files to Modify
- `src/lib/scrape/get-html-with-fallbacks.ts` — add defuddle extract, keep simplifyHtml as fallback
- `src/modules/convert/convert-crud.ts` — receive pre-extracted content + metadata
- `package.json` — add `defuddle`, `linkedom`

### Risks
| Risk | Mitigation |
|------|-----------|
| Defuddle fails exotic HTML | Fallback simplifyHtml() |
| linkedom parsing issues | JSDOM alternative |
| Breaking existing behavior | Feature flag during rollout |

### Unresolved
1. Use Defuddle `markdown: true` directly for basic pages (skip LLM)?
2. thieung fork for Twitter-specific enhancements?
3. Persist Defuddle metadata to DB?
