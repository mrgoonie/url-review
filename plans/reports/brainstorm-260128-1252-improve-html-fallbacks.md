# Brainstorm: Improve get-html-with-fallbacks.ts

## Problem Statement
File `get-html-with-fallbacks.ts` hiện có các vấn đề sau:
1. **Fallback chain bị dừng sớm** khi gặp network errors hoặc empty response
2. **Block detection quá cứng nhắc** - chỉ check 5 patterns cố định
3. **Không detect được các dạng blocked page khác** như CAPTCHA, JS challenge, rate limiting

## Current State Analysis

### Fallback Order (hiện tại)
1. axios → 2. playwright → 3. scrapedo (nếu có API key) → 4. scrappey (nếu có API key) → 5. firecrawl

### Identified Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Empty string check thiếu | Line 133-141, 209, 248 | HTML rỗng được coi là success |
| Network error không catch đúng | Mỗi try-catch block | Một số errors vẫn throw ra ngoài |
| Block patterns hardcoded | Line 136-140, 178-183... | Miss nhiều blocked patterns |
| Không check HTML validity | Tất cả methods | Partial/broken HTML được accept |
| API key check skip method | Line 201, 241 | Methods bị skip thay vì fallback |

## Proposed Solutions

### Approach 1: Comprehensive Validation Layer (Recommended)

**Tạo validation function tập trung:**

```typescript
interface HtmlValidationResult {
  isValid: boolean;
  reason?: 'empty' | 'blocked' | 'partial' | 'invalid_structure' | 'js_required';
}

function validateHtmlContent(html: string | null | undefined): HtmlValidationResult {
  // 1. Empty/null check
  if (!html || html.trim().length === 0) {
    return { isValid: false, reason: 'empty' };
  }

  // 2. Minimum content length (blocked pages thường <1KB)
  if (html.length < 500) {
    return { isValid: false, reason: 'partial' };
  }

  // 3. Block patterns detection (mở rộng)
  const blockPatterns = [
    // Security blocks
    /To help us keep this website secure/i,
    /You've been blocked/i,
    /Access denied/i,
    /403 Forbidden/i,
    /Request blocked/i,

    // CAPTCHA/challenges
    /captcha/i,
    /verify you are human/i,
    /please complete the security check/i,
    /challenge-platform/i,
    /cf-browser-verification/i,

    // JS required
    /JavaScript is not available/i,
    /JavaScript Not Available/i,
    /enable javascript/i,
    /requires javascript/i,

    // Rate limiting
    /rate limit/i,
    /too many requests/i,
    /slow down/i,

    // Bot detection
    /detected unusual traffic/i,
    /automated access/i,
    /bot detected/i,
  ];

  for (const pattern of blockPatterns) {
    if (pattern.test(html)) {
      return { isValid: false, reason: 'blocked' };
    }
  }

  // 4. Structure validation - check có main content không
  const hasMainContent =
    /<(article|main|section|div[^>]*(?:content|main|body))[^>]*>/i.test(html) ||
    html.includes('<body') && html.length > 2000;

  // 5. Suspicious title check
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    const suspiciousTitles = [
      /blocked/i, /denied/i, /captcha/i, /verify/i,
      /error/i, /forbidden/i, /unauthorized/i
    ];
    if (suspiciousTitles.some(p => p.test(titleMatch[1]))) {
      return { isValid: false, reason: 'blocked' };
    }
  }

  // 6. Missing DOCTYPE or HTML tag (potential partial response)
  const hasDoctype = /<!doctype html>/i.test(html);
  const hasHtmlTag = /<html/i.test(html);
  if (!hasDoctype && !hasHtmlTag && html.length < 5000) {
    return { isValid: false, reason: 'partial' };
  }

  return { isValid: true };
}
```

**Pros:**
- Tập trung logic validation một chỗ → DRY
- Dễ extend thêm patterns
- Consistent check across all methods
- Dễ debug với `reason` field

**Cons:**
- Có thể false positive với legitimate short pages
- Regex patterns cần maintain

---

### Approach 2: Strategy Pattern with Error Accumulation

**Refactor thành strategy pattern:**

```typescript
interface ScrapeMethod {
  name: string;
  execute: (url: string, options: ScrapeOptions) => Promise<string>;
  isAvailable: () => boolean; // Check API key, etc.
}

const methods: ScrapeMethod[] = [
  { name: 'axios', execute: getHtmlWithAxios, isAvailable: () => true },
  { name: 'playwright', execute: getHtmlContent, isAvailable: () => true },
  { name: 'scrapedo', execute: getHtmlWithScrapedo, isAvailable: () => !!env.SCRAPE_DO_API_KEY },
  { name: 'scrappey', execute: getHtmlWithScrappey, isAvailable: () => !!env.RAPID_API_KEY },
  { name: 'firecrawl', execute: getHtmlWithFirecrawl, isAvailable: () => true },
];

async function getHtmlWithFallbacks(url: string, options?: ScrapeOptions) {
  const errors: Array<{ method: string; error: Error }> = [];

  for (const method of methods) {
    if (!method.isAvailable()) {
      if (options?.debug) console.log(`Skipping ${method.name} (not available)`);
      continue;
    }

    try {
      const html = await method.execute(url, options);
      const validation = validateHtmlContent(html);

      if (validation.isValid) {
        return options?.simpleHtml ? simplifyHtml(html) : html;
      }

      // Invalid HTML → treat as error, continue to next method
      errors.push({
        method: method.name,
        error: new Error(`Invalid HTML: ${validation.reason}`)
      });
    } catch (error) {
      errors.push({ method: method.name, error: error as Error });
      if (options?.delayBetweenRetries) await wait(options.delayBetweenRetries);
    }
  }

  // All methods failed
  throw new AggregateError(
    errors.map(e => e.error),
    `Failed to fetch ${url} after trying: ${errors.map(e => e.method).join(', ')}`
  );
}
```

**Pros:**
- Rất dễ thêm/bớt methods
- Clear separation of concerns
- Error accumulation giúp debug
- Methods được try hết bất kể API key

**Cons:**
- Nhiều code hơn
- Need to handle firecrawl response format khác biệt

---

### Approach 3: Minimal Fix (Quick Win)

**Chỉ fix validation check ở mỗi method:**

```typescript
// Helper function
function isBlockedOrEmpty(html: string | null | undefined): boolean {
  if (!html || html.trim().length < 500) return true;

  const patterns = [
    'To help us keep this website secure',
    "You've been blocked",
    'Access denied',
    'JavaScript Not Available',
    'JavaScript is not available',
    'captcha', 'CAPTCHA',
    '403 Forbidden',
    'rate limit',
    'too many requests',
  ];

  return patterns.some(p => html.toLowerCase().includes(p.toLowerCase()));
}

// Usage in each step
if (html && !isBlockedOrEmpty(html)) {
  return options?.simpleHtml ? simplifyHtml(html) : html;
}
throw new Error('HTML is blocked or empty');
```

**Pros:**
- Minimal change
- Quick to implement
- Low risk

**Cons:**
- Still duplicated logic
- Harder to maintain

---

## Recommendation: Approach 1 + 2 Combined

1. **Tạo `validate-html-content.ts`** - module riêng cho validation
2. **Tạo interface `ScrapeResult`** để standardize output từ các methods
3. **Loop through methods** thay vì nested try-catch
4. **Configurable block patterns** qua options

### Implementation Structure

```
src/lib/scrape/
├── get-html-with-fallbacks.ts    # Main orchestrator
├── validate-html-content.ts       # NEW: Validation logic
├── scrape-method-types.ts         # NEW: Interface definitions
├── get-html-with-axios.ts
├── get-html-with-playwright.ts
├── get-html-with-scrapedo.ts
├── get-html-with-scrappey.ts
└── get-html-with-firecrawl.ts
```

### Key Changes Summary

| Change | Purpose |
|--------|---------|
| Extract validation to separate module | DRY, testable |
| Expand block patterns | Better detection |
| Add content length check | Catch empty/partial |
| Add structure validation | Smart detection |
| Loop through methods | Ensure all fallbacks tried |
| Standardize error handling | Consistent behavior |

## Success Criteria
- [ ] All 5 methods được thử khi có valid API keys
- [ ] Empty/partial HTML trigger fallback
- [ ] CAPTCHA/challenge pages detected
- [ ] Rate limiting detected
- [ ] Network errors don't stop chain prematurely
- [ ] Debug logs show which method succeeded/failed

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| False positive block detection | Tune regex carefully, add length threshold |
| Performance overhead từ validation | Validation rất nhẹ, không đáng kể |
| Breaking existing behavior | Keep same return type, same error type |

## Next Steps
1. Create `validate-html-content.ts` module
2. Refactor `get-html-with-fallbacks.ts` to use loop pattern
3. Update block patterns
4. Test với various blocked sites
