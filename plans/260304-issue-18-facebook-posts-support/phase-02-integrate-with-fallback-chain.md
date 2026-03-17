# Phase 2: Integrate with Fallback Chain

**Priority:** High
**Status:** ⬜ Not Started
**Effort:** 30m
**Depends on:** Phase 1

## Overview

Wire the Facebook module into `get-html-with-fallbacks.ts` and barrel exports.

## Implementation Steps

### 1. Update `src/lib/scrape/get-html-with-fallbacks.ts`

Add import at top (line ~13, after Twitter import):
```ts
import { getFacebookHtml, isFacebookUrl } from "./get-facebook-content";
```

Add Facebook check after Twitter block (after line ~236, before generic methods):
```ts
// Special handling for Facebook URLs
if (isFacebookUrl(url)) {
  if (debug) console.log(`get-html-with-fallbacks.ts > Detected Facebook URL, using specialized handler`);
  try {
    const html = await getFacebookHtml(url, { debug });
    if (debug) console.log(`get-html-with-fallbacks.ts > Successfully fetched Facebook content`);
    return opts.simpleHtml ? simplifyHtml(html) : html;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (debug) console.log(`get-html-with-fallbacks.ts > Facebook handler failed: ${errorMsg}, falling back to generic methods`);
  }
}
```

### 2. Update `src/lib/scrape/index.ts`

Add barrel export:
```ts
export * from "./get-facebook-content";
```

## TODO

- [ ] Add Facebook import to `get-html-with-fallbacks.ts`
- [ ] Add Facebook URL early interception block
- [ ] Add barrel export in `index.ts`
- [ ] Compile check

## Success Criteria

- Facebook URLs intercepted before generic scrape methods
- If Facebook API fails, falls through to generic methods
- No regressions on Twitter URL handling
