# Phase 2: Playwright HTML Rendering Module

## Overview
- **Priority**: High
- **Status**: Pending
- **Description**: Create rendering module that uses Playwright to screenshot HTML content or served ZIP files

## Context Links
- [Brainstorm Report](../reports/brainstorm-260324-1021-html-to-screenshot-api.md)
- Existing screenshot: `src/lib/playwright/screenshot.ts`
- Browser pool: `src/lib/playwright/browser-pool.ts`

## Key Insights
- Existing `screenshot()` only accepts URL via `page.goto(url)`
- `page.setContent(html)` is Playwright native API — renders HTML string directly
- For ZIP, need local HTTP serving since assets require relative URL resolution
- Reuse `browserPool.getBrowser()` for browser instances

## Requirements

### Functional
- Render raw HTML string via `page.setContent()`
- Render extracted ZIP via `page.goto(localhost:PORT/tmp-render/sessionId/entryFile)`
- Support viewport size, fullPage, delay, image type/quality options
- Return `Buffer` (screenshot image)

### Non-functional
- Reuse existing browser pool (no new browser launch)
- Timeout protection (default 30s)
- Context/page cleanup on error

## Related Code Files

### Create
- `src/lib/playwright/render-html-content.ts` — HTML/ZIP rendering logic

### Read (for reference)
- `src/lib/playwright/screenshot.ts` — existing pattern
- `src/lib/playwright/browser-pool.ts` — browser pool API

## Architecture

```
renderHtmlToScreenshot(html, options)
  └─► browserPool.getBrowser("chromium")
      └─► browser.newContext({ viewport })
          └─► page.setContent(html)
              └─► page.screenshot() → Buffer

renderZipToScreenshot(extractDir, options)
  └─► Express serves extractDir as static
      └─► browserPool.getBrowser("chromium")
          └─► page.goto("http://localhost:PORT/tmp-render/sessionId/index.html")
              └─► page.screenshot() → Buffer
```

## Implementation Steps

1. Create `src/lib/playwright/render-html-content.ts`:

   ```typescript
   import { env } from "@/env";
   import { wait } from "@/lib/utils/wait";
   import { browserPool } from "./browser-pool";

   interface RenderOptions {
     viewport?: { width: number; height: number };
     fullPage?: boolean;
     type?: "png" | "jpeg";
     quality?: number;
     delayAfterLoad?: number;
     timeout?: number;
   }

   // Render raw HTML string to screenshot
   export async function renderHtmlToScreenshot(
     html: string,
     options: RenderOptions = {}
   ): Promise<Buffer> {
     const browser = await browserPool.getBrowser("chromium");
     const context = await browser.newContext({
       viewport: options.viewport ?? { width: 1400, height: 800 },
     });

     try {
       const page = await context.newPage();
       page.setDefaultTimeout(options.timeout ?? 30_000);

       await page.setContent(html, { waitUntil: "load" });

       if (options.delayAfterLoad) await wait(options.delayAfterLoad);

       const buffer = await page.screenshot({
         fullPage: options.fullPage,
         type: options.type ?? "png",
         quality: options.type === "jpeg" ? (options.quality ?? 80) : undefined,
       });

       await page.close();
       await context.close();
       return buffer;
     } catch (error) {
       await context.close();
       throw error;
     }
   }

   // Render extracted ZIP directory to screenshot
   // Requires the directory to be served via Express static middleware
   export async function renderServedHtmlToScreenshot(
     serveUrl: string,
     options: RenderOptions = {}
   ): Promise<Buffer> {
     const browser = await browserPool.getBrowser("chromium");
     const context = await browser.newContext({
       viewport: options.viewport ?? { width: 1400, height: 800 },
     });

     try {
       const page = await context.newPage();
       page.setDefaultTimeout(options.timeout ?? 30_000);

       await page.goto(serveUrl, { waitUntil: "load" });

       if (options.delayAfterLoad) await wait(options.delayAfterLoad);

       const buffer = await page.screenshot({
         fullPage: options.fullPage,
         type: options.type ?? "png",
         quality: options.type === "jpeg" ? (options.quality ?? 80) : undefined,
       });

       await page.close();
       await context.close();
       return buffer;
     } catch (error) {
       await context.close();
       throw error;
     }
   }
   ```

2. Export from `src/lib/playwright/index.ts`

3. Verify compilation

## Todo List
- [ ] Create `render-html-content.ts` with both render functions
- [ ] Export from playwright index
- [ ] Verify compilation

## Success Criteria
- `renderHtmlToScreenshot(html)` returns PNG buffer from HTML string
- `renderServedHtmlToScreenshot(url)` returns PNG buffer from served directory
- Browser context and page cleaned up on success/error
- Viewport, fullPage, delay options work

## Risk Assessment
- **Memory**: Browser context per request — mitigated by cleanup in try/finally
- **Timeout**: Infinite render loops — mitigated by 30s default timeout
