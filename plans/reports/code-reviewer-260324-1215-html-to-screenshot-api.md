# Code Review: HTML-to-Screenshot API

## Scope
- **Files reviewed (new):** `extract-zip-to-temp-dir.ts`, `render-html-content.ts`, `api-html-to-screenshot.ts`
- **Files reviewed (modified):** `playwright/index.ts`, `routes/api/index.ts`, `server.ts`
- **LOC (new):** ~200
- **Focus:** Security, resource leaks, error handling, code quality

## Overall Assessment

Solid implementation that follows existing codebase patterns well. ZIP handling, Playwright rendering, and API route structure are consistent with sibling modules (e.g., `api-screenshot.ts`). Zip-slip protection present. However, several security and resource concerns need attention.

---

## Critical Issues

### C1. Static serving of /tmp-render exposes all temp-rendered content (SECURITY)
**File:** `server.ts:72`
**Impact:** Any user (even unauthenticated) can enumerate/access temp files at `/tmp-render/{uuid}/` while they exist on disk. UUIDs are unguessable, but the window between extraction and cleanup is a race condition surface. More critically, this static route is mounted globally with **no auth middleware**.

```ts
// Current (no auth):
app.use("/tmp-render", express.static(path.join(os.tmpdir(), "html-render")));
```

**Recommendation:** This is an inherent tradeoff of the "serve-then-navigate" architecture. Acceptable if:
- Cleanup is immediate (it is)
- UUIDs are crypto-random (they are)
- **Add `dotfiles: 'deny'` and `index: false`** to the static options to prevent directory listing:
```ts
app.use("/tmp-render", express.static(path.join(os.tmpdir(), "html-render"), {
  dotfiles: "deny",
  index: false,
}));
```

### C2. Decompression bomb: no limit on extracted content size
**File:** `extract-zip-to-temp-dir.ts`
**Impact:** The 50MB limit applies to the compressed ZIP buffer, but a ZIP can decompress to orders of magnitude larger. A 50MB zip could extract to gigabytes (zip bomb), exhausting disk space and causing DoS.

**Recommendation:** Track cumulative extracted bytes and abort if they exceed a threshold (e.g., 200MB or 500MB). Also limit total entry count.
```ts
let totalExtracted = 0;
const MAX_EXTRACTED = 200 * 1024 * 1024;
const MAX_ENTRIES = 500;

if (entries.length > MAX_ENTRIES) throw new Error("Too many entries in ZIP");

for (const entry of entries) {
  totalExtracted += entry.header.size;
  if (totalExtracted > MAX_EXTRACTED) {
    fs.rmSync(extractDir, { recursive: true, force: true });
    throw new Error("Extracted content exceeds max size");
  }
  // ...existing zip-slip check...
}
```

---

## High Priority

### H1. Missing rate limiting / plan limits on new endpoint
**File:** `api-html-to-screenshot.ts`
**Impact:** Existing routes use `checkPlanLimits` middleware for usage control. This endpoint spawns a full Playwright browser context per request — expensive. No rate limiting means abuse potential (intentional or accidental).

**Recommendation:** Add `checkPlanLimits` middleware to the middleware chain:
```ts
apiHtmlToScreenshotRouter.post("/", validateSession, apiKeyAuth, checkPlanLimits, upload.single("file"), ...)
```

### H2. `page.close()` in happy path is redundant but error path misses it
**File:** `render-html-content.ts:43-44` and `82-83`
**Impact:** In the `catch` block, only `context.close()` is called, not `page.close()`. While closing a context implicitly closes its pages, the explicit `page.close()` in the try block suggests the author intended explicit cleanup. More importantly, if `page.screenshot()` hangs or throws, the page object holds resources until context close.

**Recommendation:** Use `finally` for consistent cleanup:
```ts
const page = await context.newPage();
try {
  // ... render logic ...
  return buffer;
} finally {
  await page.close().catch(() => {});
  await context.close().catch(() => {});
}
```
This pattern also prevents the current issue where a throw between `page.close()` (line 43) and `context.close()` (line 44) would skip context cleanup.

### H3. `JSON.parse(req.body.viewport)` without try-catch
**File:** `api-html-to-screenshot.ts:233`
**Impact:** If a user sends malformed JSON in the `viewport` multipart field, `JSON.parse` throws a `SyntaxError` which is caught by the outer catch but returns a generic 500 instead of a descriptive 400.

**Recommendation:** Wrap in try-catch or validate:
```ts
let viewport;
try {
  viewport = req.body.viewport ? JSON.parse(req.body.viewport) : undefined;
} catch {
  return res.status(400).json({ success: false, message: "Invalid viewport JSON" });
}
```

### H4. ZIP path form fields not validated with Zod
**File:** `api-html-to-screenshot.ts:233-239`
**Impact:** The JSON body path uses Zod schema validation (`HtmlBodySchema`), but the ZIP multipart path manually parses form fields without schema validation. `parseInt` on bad input returns `NaN` silently. `output` and `type` are unvalidated strings.

**Recommendation:** Create a Zod schema for ZIP form fields too:
```ts
const ZipFormSchema = z.object({
  viewport: z.string().optional(),
  fullPage: z.enum(["true", "false"]).optional().default("false"),
  output: z.enum(["url", "buffer"]).optional().default("url"),
  entryFile: z.string().optional().default("index.html"),
  type: z.enum(["png", "jpeg"]).optional().default("png"),
  quality: z.string().regex(/^\d+$/).optional(),
  delayAfterLoad: z.string().regex(/^\d+$/).optional(),
});
```

---

## Medium Priority

### M1. `application/octet-stream` is too permissive for MIME check
**File:** `api-html-to-screenshot.ts:222`
**Impact:** `application/octet-stream` is the default for any unknown binary. Accepting it means any binary file passes the MIME check. Someone could upload a 50MB binary blob that's not a ZIP; AdmZip would throw, but only after the full buffer is processed.

**Recommendation:** Either remove `application/octet-stream` from allowed types or add magic-byte validation (`PK\x03\x04` header check):
```ts
if (req.file.buffer[0] !== 0x50 || req.file.buffer[1] !== 0x4B) {
  return res.status(400).json({ success: false, message: "File does not appear to be a ZIP" });
}
```

### M2. Orphaned temp directories if server crashes mid-render
**File:** `extract-zip-to-temp-dir.ts`
**Impact:** If the process dies between extraction and cleanup, temp dirs remain in `os.tmpdir()/html-render/`. Over time this accumulates.

**Recommendation:** Add a startup cleanup or periodic sweeper:
```ts
// On server start, clean stale html-render dirs older than 5 minutes
const renderDir = path.join(os.tmpdir(), "html-render");
if (fs.existsSync(renderDir)) {
  const entries = fs.readdirSync(renderDir);
  for (const entry of entries) {
    const stat = fs.statSync(path.join(renderDir, entry));
    if (Date.now() - stat.mtimeMs > 5 * 60 * 1000) {
      fs.rmSync(path.join(renderDir, entry), { recursive: true, force: true });
    }
  }
}
```

### M3. `import os from "os"` at line 71 of `server.ts` — mid-file import
**File:** `server.ts:71`
**Impact:** Imports should be at the top of the file per convention. This works at runtime but breaks linting/readability expectations.

**Recommendation:** Move `import os from "os"` to the import block at the top of `server.ts`.

### M4. Screenshot filename collision risk
**File:** `api-html-to-screenshot.ts:63`
**Impact:** `dayjs().format("YYYY-MM-DD_HH-mm-ss")` has 1-second granularity. Concurrent requests within the same second produce the same filename. The `uploadFileBuffer` function does slug the filename, but depending on its slugging logic, collisions could overwrite.

**Recommendation:** Append a UUID or short random suffix:
```ts
const fileName = `html-screenshots/${dayjs().format("YYYY-MM-DD_HH-mm-ss")}-${randomUUID().slice(0, 8)}.${ext}`;
```

Note: Checked `uploadFileBuffer` — it does create a slug from the name but the slug of a timestamp could be deterministic. Existing `api-screenshot.ts` uses the same pattern, so this is a pre-existing pattern, not introduced here.

---

## Low Priority

### L1. `waitUntil: "load"` may not be sufficient for JS-heavy content
**File:** `render-html-content.ts:33, 69`
**Impact:** `"load"` fires when all resources load, but JS frameworks may still be rendering. `"networkidle"` is more reliable for SPAs but slower.

**Recommendation:** Consider offering `waitUntil` as a configurable option, defaulting to `"load"`. Not a bug, just a usability note.

### L2. `renderHtmlToScreenshot` returns `Buffer` typed from Playwright
**File:** `render-html-content.ts`
**Impact:** Playwright's `page.screenshot()` returns `Buffer` in Node.js but the type annotation relies on ambient typing. This works, but explicit typing would be clearer.

### L3. OpenAPI doc for ZIP path doesn't document max size
**File:** `api-html-to-screenshot.ts` (swagger comments)
**Impact:** API consumers won't know about the 50MB limit until they hit it.

**Recommendation:** Add description: `"ZIP file containing HTML/CSS/JS/assets (max 50MB compressed)"`

---

## Edge Cases Found by Scout

1. **Concurrent cleanup race:** If two requests somehow share a session ID (impossible with UUID but worth noting), cleanup of one request could remove the other's files. UUID makes this theoretical only.

2. **Browser pool exhaustion:** Each render creates a new context on the shared browser. High concurrency without rate limits could exhaust Chromium's context/memory limits, causing cascading failures for ALL screenshot endpoints (not just this one).

3. **`extractAllTo` ignores zip-slip check results for symlinks:** `adm-zip`'s `extractAllTo` doesn't prevent symlink attacks. An entry could be a symlink pointing to `/etc/passwd`. The zip-slip check validates path names but not entry types.

4. **Server restart during render leaves Playwright contexts open:** The `SIGTERM` handler in `server.ts` calls nothing — cleanup comment says `// ... (other cleanup tasks)` but no actual cleanup. Browser pool's `closeBrowsers()` is never called.

---

## Positive Observations

- Zip-slip protection implemented correctly with `path.resolve` + `startsWith` check
- `cleanup` variable pattern with null-check ensures no double-free
- Follows existing codebase patterns (auth middleware chain, Zod, response shape, R2 upload)
- Clean separation: ZIP extraction utility, Playwright render module, route handler
- `extractZipToTempDir` returns cleanup function — good encapsulation
- Multer memory storage with 50MB limit prevents large uploads reaching disk

---

## Recommended Actions (Prioritized)

1. **[Critical]** Add decompression bomb protection (extracted size + entry count limits)
2. **[Critical]** Add `dotfiles: "deny"` and `index: false` to `/tmp-render` static mount
3. **[High]** Add rate limiting / `checkPlanLimits` middleware
4. **[High]** Wrap `JSON.parse(viewport)` in try-catch for proper 400 response
5. **[High]** Use `finally` block for page/context cleanup in render functions
6. **[High]** Validate ZIP form fields with Zod schema
7. **[Medium]** Validate ZIP magic bytes instead of trusting `application/octet-stream`
8. **[Medium]** Move `import os` to top of `server.ts`
9. **[Medium]** Add startup cleanup for stale temp directories
10. **[Low]** Add UUID suffix to screenshot filenames (or document existing slug behavior)

---

## Metrics

- **Type Coverage:** Good — interfaces defined, Zod schemas for validation
- **Test Coverage:** Unknown — no test files reviewed
- **Linting Issues:** 1 (mid-file import in server.ts)

## Unresolved Questions

1. Is `adm-zip`'s `extractAllTo` safe against symlink-based path traversal? The zip-slip check validates path strings but not entry types. May need to iterate and extract entries individually with type checking.
2. Should `checkPlanLimits` be added before or after `upload.single("file")` in the middleware chain? Before is preferred to reject unauthorized requests early (before buffering the upload).
3. Should the SIGTERM handler be updated to call `browserPool.closeBrowsers()`? Currently it's a no-op beyond the comment.
