# Phase 3: Test & Verify

**Priority:** High
**Status:** ⬜ Not Started
**Effort:** 30m
**Depends on:** Phase 2

## Overview

Verify the implementation works end-to-end with real Facebook URLs via the convert API.

## Verification Steps

### 1. Compile check

```bash
bunx tsc --noEmit
```

### 2. Unit verification — `isFacebookUrl()`

Test these URLs return `true`:
- `https://www.facebook.com/user/posts/123`
- `https://m.facebook.com/story.php?id=123`
- `https://facebook.com/share/p/abc123`
- `https://facebook.com/photo.php?fbid=123`
- `https://facebook.com/watch?v=123`
- `https://fb.com/shortlink`
- `https://fb.watch/abc123`

Test these return `false`:
- `https://google.com`
- `https://twitter.com/user/status/123`
- `https://notfacebook.com`

### 3. Integration test (manual, requires RAPID_API_KEY)

Start dev server and call the convert API:
```bash
curl -X POST http://localhost:3000/api/v1/convert \
  -H "Content-Type: application/json" \
  -H "x-api-key: <key>" \
  -d '{"url": "https://www.facebook.com/some-public-post"}'
```

Verify response contains:
- `<article class="facebook-post">`
- Author name and avatar
- Post text content
- Media (photos/videos if present)
- Stats (reactions, comments, shares)

### 4. Run existing tests

```bash
bun run test
bun run lint
```

Ensure no regressions.

## TODO

- [ ] Compile check passes
- [ ] `isFacebookUrl()` correctly identifies all URL patterns
- [ ] Manual API test with real Facebook URL (if RAPID_API_KEY available)
- [ ] Existing tests pass
- [ ] Lint passes

## Success Criteria

- All Facebook URL patterns detected correctly
- API returns structured HTML for public Facebook posts
- Fallback to generic methods works when API fails
- No regressions in existing functionality
