# Defuddle Research Report

**Date:** 2026-03-14 | **Scope:** GitHub analysis - thieung/defuddle fork + upstream kepano/defuddle

---

## Executive Summary

**Defuddle** is an open-source web content extraction library created by Steph Ango (@kepano) that removes clutter from web pages and produces clean, standardized output. The **thieung/defuddle** fork is a Cloudflare Worker implementation that adds rich X/Twitter post handling with media, polls, quotes, and long-form articles. It serves as a modern alternative to Mozilla Readability with better forgiving behavior and structured output standardization.

---

## 1. What is Defuddle? Problem Statement

### Definition
Defuddle (verb): *"To remove unnecessary elements from a web page, and make it easily readable."*

### Problem it Solves
1. **Content Extraction Complexity**: Modern websites contain navigational chrome, sidebars, ads, comments—extracting just the main content is non-trivial
2. **Readability Limitations**: Mozilla's Readability is overly conservative, often removing useful content by being too aggressive
3. **Inconsistent HTML Output**: Different websites structure content differently; Readability preserves original DOM structure requiring downstream processing
4. **X/Twitter Content**: Shortened t.co links and dynamic content are difficult to extract server-side
5. **Metadata Loss**: Standard extraction rarely captures rich metadata (author, publish date, schema.org data)

### Origin
Created by Steph Ango for **Obsidian Web Clipper** plugin. Designed as a Readability replacement addressing its shortcomings.

---

## 2. Core Features & Capabilities

### Content Extraction
- **Input**: HTML (browser DOM or parsed strings)
- **Output**: Clean HTML or Markdown with metadata
- **Scope**: Removes ads, comments, sidebars, headers, footers, navigation
- **Multi-pass detection**: Can recover when initial attempts find no content (more forgiving than Readability)

### Output Standardization (Key Differentiator)
Unlike Readability, Defuddle normalizes HTML structure:
- **Headings**: Removes duplicate H1/H2 matching page title; converts H1→H2; strips anchor links from headings
- **Code blocks**: Standardized structure with language preservation in `data-lang` and `class` attributes
- **Footnotes**: Converted to standard format with backlinks
- **Math content**: Converts MathJax/KaTeX to MathML with LaTeX preservation in `data-latex`

### Metadata Extraction
- Page title, author, description
- Publication date, word count
- Domain, favicon URL
- Language (BCP 47 format)
- Open Graph and Twitter Card tags
- schema.org structured data
- Image URLs (primary and all embedded)

### Advanced Features
- **Mobile styles analysis**: Uses CSS media queries to identify hidden elements (elements that disappear on mobile are often nav, not content)
- **Debug mode**: Detailed removal reasons with CSS selectors and scoring info
- **Async processing**: Third-party API fallbacks (e.g., FxTwitter for X posts server-rendered)
- **Markdown conversion**: Full HTML→Markdown pipeline included (defuddle/full, defuddle/node)

### thieung/defuddle (Cloudflare Worker Fork)
Extends upstream Defuddle with:
- **X/Twitter specialization**:
  - t.co link expansion to full URLs
  - Media capture: photos, videos, GIFs with thumbnails & duration
  - Long-form X Articles with inline media
  - Quote tweets with attachments
  - Poll rendering with visual progress indicators
  - Engagement metrics (likes, retweets, replies, views)
  - Community notes and broadcast context
- **REST API**: Append any URL to worker path or use JSON Accept header
- **Public deployment**: Available at `defuddle.thieunv.workers.dev`

---

## 3. API & Usage Patterns

### Three Bundle Variants

| Bundle | Target | Features | Dependencies |
|--------|--------|----------|---|
| `defuddle` | Browser | Core extraction | None (1.18 MB) |
| `defuddle/full` | Browser + CLI | + Math + Markdown | Turndown, etc. |
| `defuddle/node` | Node.js | + Math + Markdown | Accepts linkedom/JSDOM/happy-dom Document |

### Browser Usage
```javascript
import Defuddle from 'defuddle';

const defuddle = new Defuddle(document);
const result = defuddle.parse();

console.log(result.content);      // Clean HTML
console.log(result.title);        // Article title
console.log(result.author);       // Content author
console.log(result.wordCount);    // Integer
console.log(result.published);    // ISO date string
console.log(result.parseTime);    // Milliseconds
```

### Node.js with linkedom
```javascript
import { parseHTML } from 'linkedom';
import { Defuddle } from 'defuddle/node';

const { document } = parseHTML(htmlString);
const result = await Defuddle(document, 'https://example.com', {
  markdown: true,
  debug: false
});
```

### Command Line Interface
```bash
# Parse URL or file
npx defuddle parse https://example.com/article
npx defuddle parse page.html

# Output as Markdown
npx defuddle parse page.html --markdown

# Extract specific property
npx defuddle parse page.html --property title

# Enable debug logging
npx defuddle parse page.html --debug
```

### Response Object Properties

| Property | Type | Description |
|----------|------|---|
| `content` | string | Cleaned HTML or Markdown |
| `title` | string | Article title |
| `author` | string | Content author |
| `description` | string | Article summary/excerpt |
| `domain` | string | Website domain |
| `wordCount` | number | Total words |
| `published` | string | Publication date (ISO) |
| `image` | string | Primary article image URL |
| `favicon` | string | Site favicon URL |
| `language` | string | BCP 47 language code |
| `metaTags` | object | Extracted meta tags |
| `schemaOrgData` | object | Structured data |
| `parseTime` | number | Processing duration (ms) |
| `debug` | object | Debug info (when enabled) |

### Configuration Options

| Option | Type | Default | Purpose |
|--------|------|---------|---|
| `debug` | boolean | false | Enable detailed logging |
| `markdown` | boolean | false | Convert to Markdown |
| `contentSelector` | string | — | CSS selector override |
| `removeLowScoring` | boolean | true | Filter non-content blocks |
| `removeHiddenElements` | boolean | true | Strip CSS-hidden elements |
| `removeSmallImages` | boolean | true | Remove icons/tracking pixels |
| `standardize` | boolean | true | Normalize HTML structure |
| `useAsync` | boolean | true | Allow third-party API fallbacks |
| `url` | string | — | Page URL for context |

### thieung/defuddle REST API
```bash
# Get webpage as Markdown
curl defuddle.thieunv.workers.dev/https://example.com

# Get X/Twitter post
curl defuddle.thieunv.workers.dev/https://x.com/user/status/1234567890

# Get JSON output
curl -H "Accept: application/json" defuddle.thieunv.workers.dev/https://example.com
```

---

## 4. Internal Architecture & How It Works

### Core Processing Pipeline

1. **HTML Parsing & DOM Preparation**
   - Accepts browser `document` or parsed DOM from JSDOM/linkedom/happy-dom
   - Works with SPAs after content loads (parse time = actual state)

2. **Mobile Styles Analysis**
   - Extracts CSS media queries to identify hidden/repositioned elements
   - Heuristic: Elements that disappear on mobile are likely nav/promo, not article content
   - Significantly improves extraction on responsive sites

3. **DOM Scoring Algorithm**
   - Evaluates each block-level element using heuristic scoring
   - Scoring factors (inferred from debug output):
     - Element class/id names (positive/negative signals)
     - Content density (text:element ratio)
     - Element type and semantic role
     - CSS visibility and display properties
   - Multi-pass approach: if no content found, relax thresholds and retry

4. **Element Removal Pipeline**
   - **removeLowScoring**: Eliminate elements below score threshold
   - **removeBySelector**: Strip known nav/ad patterns (classes/IDs)
   - **removeHiddenElements**: Remove CSS-hidden elements (`display:none`, `visibility:hidden`)
   - **removeSmallImages**: Filter icons, tracking pixels
   - Each step recorded in debug output with reasons

5. **Content Isolation**
   - Identifies main content container CSS selector path
   - Extracts subtree as primary content
   - Preserves semantic structure (lists, tables, emphasis)

6. **HTML Standardization** (Optional)
   - Normalizes heading hierarchy
   - Standardizes code blocks with language metadata
   - Converts footnotes to standard format
   - Transforms math notation to MathML
   - Flattens unnecessary wrapper divs

7. **Metadata Extraction**
   - Crawls `<title>`, `<meta>` tags
   - Parses schema.org structured data
   - Extracts Open Graph / Twitter Card tags
   - Analyzes bylines for author/date
   - Counts words in extracted content

8. **Markdown Conversion** (Optional)
   - Uses Turndown library for HTML→Markdown
   - Preserves tables, lists, emphasis
   - Converts media to markdown image syntax

### Key Heuristics

| Signal | Interpretation |
|--------|---|
| Class contains: article, main, content, post | Positive for main content |
| Class contains: nav, sidebar, ad, comment | Negative (removal) |
| `display:none` or `visibility:hidden` | Remove |
| Small images (<100px) | Remove (likely icons) |
| Empty or text-only elements | Evaluate by scoring |
| Mobile-hidden elements | Flag for removal |

### Async Fallback
- When server-rendered HTML lacks content (e.g., X/Twitter with t.co links), Defuddle calls external APIs
- Example: **FxTwitter API** for X post extraction with full link expansion and media
- Can be disabled via `useAsync: false` option

### Debug Mode
When `debug: true`:
- Returns `result.debug.contentSelector`: CSS path of chosen main content
- Returns `result.debug.removals`: Array of removed elements with:
  - Step name (e.g., "removeLowScoring")
  - CSS selector match
  - Reason (e.g., "score: -20", "display:none")
  - Text preview of element

---

## 5. Package Specifications

### Bundle Size & Dependencies

| Metric | Value |
|--------|-------|
| **Core Bundle Size** | ~1.18 MB |
| **Dependencies** | 0 (core bundle) |
| **Build Target** | ES2020 |
| **Module Formats** | CommonJS + ES Modules |

### Browser Support
- **Compatibility**: Works with any modern browser supporting ES2020 (Chrome 80+, Firefox 75+, Safari 13.1+, Edge 80+)
- **SPA-safe**: Processes DOM at parse time, works after content loads
- **No external requests**: Core bundle pure JS (no network calls for standard parsing)

### Node.js Support
- **Minimum Node.js**: 14+
- **DOM Libraries** (pick one):
  - **linkedom**: Minimal/fast, DOM-less environment
  - **JSDOM**: Comprehensive browser emulation, layout support
  - **happy-dom**: Lightweight, high-performance server-side DOM
- **Recommended**: linkedom for server extraction, JSDOM for comprehensive testing

### TypeScript
- Written entirely in TypeScript
- Full type definitions included
- Build tool: Webpack
- Test framework: Vitest

### Installation
```bash
# Core bundle
npm install defuddle

# With Markdown conversion and math
npm install defuddle@latest

# For Node.js, also add DOM library
npm install linkedom  # or jsdom, happy-dom
```

---

## 6. Comparison to Alternatives

### vs. Mozilla Readability
| Aspect | Readability | Defuddle |
|--------|---|---|
| **Behavior** | Conservative (risks removing content) | Forgiving (removes less uncertain content) |
| **Multi-pass** | Single pass | Multi-pass recovery |
| **Output standardization** | Preserves original DOM | Normalizes headings, code, footnotes, math |
| **Metadata** | Limited (title, author) | Rich (schema.org, OG, structured data) |
| **Mobile analysis** | No | Yes (CSS media queries) |
| **Markdown conversion** | Not included | Included (defuddle/full) |
| **Maintenance** | Archived (Mozilla no longer maintains) | Active development |

### vs. Turndown
**Not a direct competitor—complementary tools:**
- **Turndown**: HTML→Markdown converter (focused on structure preservation)
- **Defuddle**: Content extraction + standardization (prepares clean HTML for conversion)
- **Combined**: Defuddle cleans HTML, Turndown converts to Markdown (optimal pipeline)

### vs. Postlight Parser
- **Parser**: Legacy (archived), proprietary API model
- **Defuddle**: Open-source, self-hosted, no external dependencies
- **Defuddle wins on**: Maintenance, cost, customization, privacy

### Emerging Alternatives (as of 2026)
- **htmlcleaner**, **extract-main-content**: Lighter but less sophisticated
- **AI-based extractors**: More accurate but slower, expensive, privacy concerns
- **Defuddle advantages**: Fast, transparent heuristics, zero dependencies, reproducible

---

## 7. Use Cases & Applications

### Ideal For
1. **Web Clipper Tools**: Obsidian, Notion, Roam Research integrations
2. **Content Aggregation**: News readers, RSS-to-Markdown pipelines
3. **AI/ML Preparation**: Feed to LLMs with clean, structured text
4. **Archive Systems**: Long-term readability and preservation
5. **Social Media Processing**: X/Twitter thread extraction (via thieung fork)
6. **Markdown Documentation**: Convert blog posts to static docs
7. **Accessibility**: Remove clutter for accessibility tools

### Deployment Options
- **Browser**: Embed directly in web extensions
- **Node.js CLI**: Command-line tool for batch processing
- **Cloudflare Workers**: Serverless extraction API (thieung fork)
- **Deno**: Compatible with modern runtimes
- **Docker**: Containerize with Node.js

---

## 8. Performance Characteristics

### Speed
- **Parse time**: Typically 20-100ms on modern hardware
- **Bottlenecks**: DOM scoring (heuristic-heavy), metadata extraction
- **Returns**: `parseTime` in milliseconds for monitoring

### Memory
- **Core bundle**: Minimal (1.18 MB, zero deps)
- **Full bundle**: Larger due to Turndown + dependencies
- **Node.js bundle**: Depends on DOM library (linkedom ≈ 50 KB, JSDOM ≈ 500 KB)

### Scalability
- **Stateless**: No server state, can parallel-process unlimited pages
- **Cloudflare Workers**: Auto-scales to global edge locations
- **Cold start**: <50ms on modern runtimes

---

## 9. Security & Privacy Considerations

### Advantages
- **No external calls** (core bundle): Pure JavaScript, no telemetry
- **Async fallback opt-in**: Only calls external APIs if `useAsync: true`
- **Open-source**: Audit-able, no hidden logic
- **Self-hosted**: Full control over data flow

### Considerations
- **Third-party APIs**: FxTwitter fallback sends URLs externally
- **DOM access**: Runs in browser context with full DOM access
- **No sanitization**: Output HTML is not XSS-escaped; sanitize before rendering untrusted content

### Best Practices
```javascript
// If processing user-supplied URLs, disable async
const result = await Defuddle(document, url, { useAsync: false });

// If rendering HTML in browser, sanitize with DOMPurify
import DOMPurify from 'dompurify';
const safe = DOMPurify.sanitize(result.content);
```

---

## 10. Integration Patterns

### Web Clipper Pattern
```javascript
// Inject into extension content script
import Defuddle from 'defuddle';
const result = new Defuddle(document).parse();
chrome.runtime.sendMessage({ action: 'save', data: result });
```

### Node.js Batch Processing
```bash
npm install -g defuddle
defuddle parse urls.txt --markdown > articles.md
```

### Cloudflare Worker Pattern (thieung fork)
```javascript
// Deploy worker
wrangler deploy

// Call from anywhere
fetch('https://your-worker.dev/https://example.com')
```

### Markdown Pipeline
```javascript
import { Defuddle } from 'defuddle/node';
import { parseHTML } from 'linkedom';

const html = await fetch(url).then(r => r.text());
const { document } = parseHTML(html);
const result = await Defuddle(document, url, { markdown: true });
return `# ${result.title}\n\n${result.content}`;
```

---

## 11. Known Limitations & Considerations

### Limitations
1. **JavaScript-dependent sites**: Defuddle parses static HTML; for SPAs, you must wait for DOM to populate before calling parse()
2. **Complex layouts**: May struggle with unusual content structures or multi-column layouts
3. **Byline extraction**: Author/date detection is heuristic-based, not 100% reliable
4. **Non-English**: Language detection works but complex multilingual pages may have issues
5. **Media extraction**: Images are linked but not downloaded; audio/video metadata limited
6. **Real-time content**: Twitter/social media may require auth for full content

### Workarounds
- Use headless browser (Puppeteer, Playwright) to render SPAs before extraction
- Disable async for consistent offline operation
- Provide URL hint for better metadata extraction
- Enable debug mode to diagnose issues

---

## 12. Repository Structure (thieung/defuddle)

```
thieung/defuddle/
├── src/
│   ├── index.ts              # Cloudflare Worker entry point
│   ├── lib/                  # Core Defuddle logic (vendored from kepano)
│   └── services/             # Twitter API integration
├── wrangler.toml             # Cloudflare Workers config
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

### Build & Deploy
```bash
# Install dependencies
npm install

# Local development
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```

---

## Unresolved Questions

1. **Exact DOM scoring formula**: The heuristic weighting (e.g., how many points for "article" class vs. text density) is not fully documented
2. **Mobile styles implementation detail**: How exactly are media queries analyzed—is it CSS rule extraction or computed styles?
3. **Turndown customization**: Can Defuddle output be configured for specific Markdown flavors (GitHub, CommonMark, etc.)?
4. **Performance benchmarks**: No published comparisons with Readability on standard test sets
5. **X/Twitter auth**: Does thieung/defuddle support protected tweets or only public posts?
6. **Rate limiting**: What's the rate limit on defuddle.thieunv.workers.dev public deployment?

---

## Sources

- [GitHub - kepano/defuddle](https://github.com/kepano/defuddle)
- [GitHub - thieung/defuddle](https://github.com/thieung/defuddle)
- [npm - defuddle](https://www.npmjs.com/package/defuddle)
- [Defuddle Documentation](https://defuddle.md/docs)
- [Steph Ango on Defuddle](https://stephango.com/defuddle)
- [Show HN: Defuddle discussion](https://news.ycombinator.com/item?id=44067409)
- [Defuddle Worker deployment](https://defuddle.thieunv.workers.dev/)
- [Cloudflare Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/)
- [Defuddle vs alternatives on BigGo](https://biggo.com/news/202505240122_Defuddle_Web_Content_Extractor)
- [Content extraction comparison](https://jocmp.com/2025/07/12/full-content-extractors-comparing-defuddle/)

