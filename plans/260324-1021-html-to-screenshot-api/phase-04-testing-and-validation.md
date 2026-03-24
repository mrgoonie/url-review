# Phase 4: Testing & Validation

## Overview
- **Priority**: Medium
- **Status**: Pending
- **Description**: Manual testing and validation of HTML-to-Screenshot API

## Context Links
- [Phase 3: API Route](./phase-03-api-route-and-integration.md)

## Requirements

### Test Cases

1. **HTML string → URL output**
   ```bash
   curl -X POST http://localhost:3000/api/v1/html-to-screenshot \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_KEY" \
     -d '{"html": "<html><body><h1>Hello World</h1></body></html>", "output": "url"}'
   ```
   Expected: `{ success: true, data: { imageUrl: "https://..." } }`

2. **HTML string → buffer output**
   ```bash
   curl -X POST http://localhost:3000/api/v1/html-to-screenshot \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_KEY" \
     -d '{"html": "<html><body><h1>Hello</h1></body></html>", "output": "buffer"}' \
     --output test.png
   ```
   Expected: PNG file saved

3. **HTML with CSS + JS**
   ```bash
   curl -X POST http://localhost:3000/api/v1/html-to-screenshot \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_KEY" \
     -d '{"html": "<html><head><style>body{background:blue;color:white;font-size:48px}</style></head><body><h1 id=\"msg\">Loading...</h1><script>document.getElementById(\"msg\").textContent=\"Done!\"</script></body></html>", "viewport": {"width": 800, "height": 600}}'
   ```
   Expected: Blue background, white "Done!" text (JS executed)

4. **ZIP file upload**
   ```bash
   # Create test zip first
   mkdir -p /tmp/test-html && echo '<html><body><h1>From ZIP</h1></body></html>' > /tmp/test-html/index.html
   cd /tmp/test-html && zip -r /tmp/test.zip . && cd -

   curl -X POST http://localhost:3000/api/v1/html-to-screenshot \
     -H "x-api-key: YOUR_KEY" \
     -F "file=@/tmp/test.zip" \
     -F "output=url"
   ```
   Expected: Screenshot of "From ZIP" heading

5. **ZIP with custom entryFile**
   Test with `entryFile=page.html` pointing to non-index.html file

6. **Error cases**
   - No `html` field and no file → 400
   - Invalid file type (not ZIP) → 400
   - ZIP > 50MB → 400 (multer limit)
   - Malformed HTML → should still render (browser is forgiving)
   - Zip-slip attack → 400 with error message

7. **Viewport options**
   - Custom width/height
   - fullPage=true vs false
   - JPEG output with quality

## Validation Checklist
- [ ] HTML string renders correctly
- [ ] ZIP file extracts and renders correctly
- [ ] URL output uploads to R2 and returns valid URL
- [ ] Buffer output returns valid image
- [ ] JS executes in rendered HTML
- [ ] CSS styles applied correctly
- [ ] Viewport options work
- [ ] Auth required (401 without API key)
- [ ] Temp files cleaned up (check `/tmp/html-render/` is empty after requests)
- [ ] Error responses have correct status codes and messages

## Success Criteria
- All 7 test case categories pass
- No temp file leaks after requests
- Auth middleware blocks unauthorized requests
- Response format matches existing API patterns
