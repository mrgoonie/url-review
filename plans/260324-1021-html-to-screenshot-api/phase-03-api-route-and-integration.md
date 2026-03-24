# Phase 3: API Route & Integration

## Overview
- **Priority**: High
- **Status**: Pending
- **Description**: Create `POST /api/v1/html-to-screenshot` endpoint, mount in router, add temp static serving for ZIP files

## Context Links
- [Brainstorm Report](../reports/brainstorm-260324-1021-html-to-screenshot-api.md)
- Existing route pattern: `src/routes/api/api-screenshot.ts`
- API router: `src/routes/api/index.ts`
- Server: `src/server.ts`

## Key Insights
- Follow existing route pattern: Zod validation, `validateSession`, `apiKeyAuth`
- Multer already used in `api-upload.ts` — reuse pattern for ZIP upload
- For ZIP: need Express static middleware on temp dir, mounted dynamically per request
- Use `app.use()` at server level for `/tmp-render` static serving OR use a shared Express app reference

## Requirements

### Functional
- Accept JSON body with `html` string → render → return screenshot
- Accept multipart form with ZIP file → extract → serve → render → return screenshot
- `output` field: `"url"` (upload to R2, return URL) or `"buffer"` (return image binary)
- Support viewport, fullPage, delayAfterLoad, image type/quality, entryFile options
- OpenAPI/Swagger documentation

### Non-functional
- Reuse existing auth middleware (`validateSession` + `apiKeyAuth`)
- 50MB max for ZIP upload
- Cleanup temp files on success AND error
- Input validation via Zod

## Related Code Files

### Create
- `src/routes/api/api-html-to-screenshot.ts` — new API route

### Modify
- `src/routes/api/index.ts` — mount new route
- `src/server.ts` — add `/tmp-render` static serving route

## Architecture

```
POST /api/v1/html-to-screenshot
  ├─ Content-Type: application/json
  │   body: { html, viewport, fullPage, output, delayAfterLoad }
  │   └─► renderHtmlToScreenshot(html, opts)
  │       └─► output=url ? uploadFileBuffer() : return buffer
  │
  └─ Content-Type: multipart/form-data
      file: archive.zip (max 50MB)
      fields: viewport, fullPage, output, entryFile, delayAfterLoad
      └─► extractZipToTempDir(buffer)
          └─► renderServedHtmlToScreenshot(`http://localhost:PORT/tmp-render/sessionId/entryFile`)
              └─► cleanup()
                  └─► output=url ? uploadFileBuffer() : return buffer
```

## Implementation Steps

1. **Add static serving for temp renders in `src/server.ts`**:
   ```typescript
   import path from "path";
   import os from "os";
   // After existing middleware, before routes:
   app.use("/tmp-render", express.static(path.join(os.tmpdir(), "html-render")));
   ```

2. **Create `src/routes/api/api-html-to-screenshot.ts`**:

   ```typescript
   import dayjs from "dayjs";
   import express from "express";
   import multer from "multer";
   import { z } from "zod";

   import { env } from "@/env";
   import { validateSession } from "@/lib/auth";
   import { uploadFileBuffer } from "@/lib/cloud-storage";
   import { renderHtmlToScreenshot, renderServedHtmlToScreenshot } from "@/lib/playwright";
   import { extractZipToTempDir } from "@/lib/utils/extract-zip-to-temp-dir";
   import { apiKeyAuth } from "@/middlewares/api_key_auth";

   export const apiHtmlToScreenshotRouter = express.Router();

   const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

   // Zod schemas
   const ViewportSchema = z.object({
     width: z.number().int().min(100).max(3840).default(1400),
     height: z.number().int().min(100).max(2160).default(800),
   });

   const HtmlBodySchema = z.object({
     html: z.string().min(1),
     viewport: ViewportSchema.optional(),
     fullPage: z.boolean().optional().default(false),
     output: z.enum(["url", "buffer"]).optional().default("url"),
     type: z.enum(["png", "jpeg"]).optional().default("png"),
     quality: z.number().min(1).max(100).optional(),
     delayAfterLoad: z.number().min(0).max(30000).optional().default(0),
   });

   // POST / — HTML string (JSON) or ZIP file (multipart)
   apiHtmlToScreenshotRouter.post(
     "/",
     validateSession,
     apiKeyAuth,
     upload.single("file"),
     async (req, res) => {
       let cleanup: (() => void) | null = null;

       try {
         // Detect input type: ZIP file or HTML string
         if (req.file) {
           // --- ZIP FILE INPUT ---
           const mimeType = req.file.mimetype;
           if (!["application/zip", "application/x-zip-compressed"].includes(mimeType)) {
             return res.status(400).json({
               success: false,
               message: "Invalid file type. Only ZIP files are allowed.",
             });
           }

           // Parse form fields
           const viewport = req.body.viewport ? JSON.parse(req.body.viewport) : undefined;
           const fullPage = req.body.fullPage === "true";
           const output = req.body.output || "url";
           const entryFile = req.body.entryFile || "index.html";
           const type = req.body.type || "png";
           const quality = req.body.quality ? parseInt(req.body.quality) : undefined;
           const delayAfterLoad = req.body.delayAfterLoad
             ? parseInt(req.body.delayAfterLoad) : 0;

           // Extract ZIP
           const extracted = await extractZipToTempDir(req.file.buffer);
           cleanup = extracted.cleanup;

           // Build serve URL — served via Express static at /tmp-render
           const sessionId = extracted.extractDir.split("/").pop();
           const serveUrl = `http://localhost:${env.PORT}/tmp-render/${sessionId}/${entryFile}`;

           // Render
           const imageBuffer = await renderServedHtmlToScreenshot(serveUrl, {
             viewport: viewport ? ViewportSchema.parse(viewport) : undefined,
             fullPage,
             type,
             quality,
             delayAfterLoad,
           });

           // Cleanup temp files immediately after screenshot
           cleanup();
           cleanup = null;

           // Output
           return await sendOutput(res, imageBuffer, output, type);
         } else {
           // --- HTML STRING INPUT ---
           const body = HtmlBodySchema.parse(req.body);

           const imageBuffer = await renderHtmlToScreenshot(body.html, {
             viewport: body.viewport,
             fullPage: body.fullPage,
             type: body.type,
             quality: body.quality,
             delayAfterLoad: body.delayAfterLoad,
           });

           return await sendOutput(res, imageBuffer, body.output, body.type);
         }
       } catch (error) {
         // Always cleanup on error
         if (cleanup) cleanup();

         if (error instanceof z.ZodError) {
           return res.status(400).json({
             success: false,
             message: "Invalid request data",
             errors: error.errors.map((e) => e.message),
           });
         }

         console.error("api-html-to-screenshot > POST / > Error:", error);
         res.status(500).json({
           success: false,
           message: "Failed to render screenshot",
           error: error instanceof Error ? error.message : "Unknown error",
         });
       }
     }
   );

   // Helper: send output as URL or buffer
   async function sendOutput(
     res: express.Response,
     buffer: Buffer,
     output: string,
     type: string
   ) {
     if (output === "buffer") {
       res.set("Content-Type", type === "jpeg" ? "image/jpeg" : "image/png");
       return res.send(buffer);
     }

     // Upload to R2
     const ext = type === "jpeg" ? "jpg" : "png";
     const fileName = `html-screenshots/${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.${ext}`;
     const uploaded = await uploadFileBuffer(buffer, fileName);

     return res.status(201).json({
       success: true,
       message: "Screenshot created successfully",
       data: { imageUrl: uploaded.publicUrl },
     });
   }
   ```

3. **Mount in `src/routes/api/index.ts`**:
   ```typescript
   import { apiHtmlToScreenshotRouter } from "./api-html-to-screenshot";
   // ...
   apiRouter.use("/api/v1/html-to-screenshot", apiHtmlToScreenshotRouter);
   ```

4. Add OpenAPI/Swagger JSDoc comments (follow existing pattern in `api-screenshot.ts`)

5. Verify compilation

## Todo List
- [ ] Add `/tmp-render` static serving in `server.ts`
- [ ] Create `api-html-to-screenshot.ts` with both HTML and ZIP handling
- [ ] Mount route in `index.ts`
- [ ] Add Swagger/OpenAPI docs
- [ ] Verify compilation

## Success Criteria
- `POST /api/v1/html-to-screenshot` with JSON `{ html }` returns screenshot
- `POST /api/v1/html-to-screenshot` with ZIP file returns screenshot
- `output=url` uploads to R2 and returns URL
- `output=buffer` returns image binary directly
- Temp files cleaned up on success and error
- Auth middleware applied (session + API key)
- Zod validation for all inputs

## Risk Assessment
- **Path traversal via entryFile**: Validate entryFile doesn't contain `..` or absolute paths
- **Temp static serving security**: `/tmp-render` route only serves from os.tmpdir()/html-render — no access to other dirs
- **Memory**: Large HTML strings in request body — mitigated by Express body size limit

## Security Considerations
- Auth: `validateSession` + `apiKeyAuth` (same as existing screenshot API)
- ZIP: 50MB multer limit + zip-slip check in extraction
- entryFile: sanitize to prevent directory traversal
- Temp files: always cleaned up via try/finally pattern
- Static serving: scoped to specific temp directory only
