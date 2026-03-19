/**
 * HTML Content Validation Module
 * Validates scraped HTML for blocked pages, partial content, CAPTCHA, rate limiting, etc.
 */

export interface HtmlValidationResult {
  isValid: boolean;
  reason?: "empty" | "blocked" | "partial" | "js_required";
}

// Block patterns for security blocks, CAPTCHA, challenges, rate limiting, bot detection
const BLOCK_PATTERNS: RegExp[] = [
  // Security blocks
  /To help us keep this website secure/i,
  /You've been blocked/i,
  /been blocked by network security/i,
  /Access denied/i,
  /403 Forbidden/i,
  /Request blocked/i,
  /Sorry, you have been blocked/i,

  // CAPTCHA/challenges
  /captcha/i,
  /verify you are human/i,
  /please complete the security check/i,
  /challenge-platform/i,
  /cf-browser-verification/i,
  /hcaptcha/i,
  /recaptcha/i,
  /turnstile/i,

  // JS required
  /JavaScript is not available/i,
  /JavaScript Not Available/i,
  /enable javascript/i,
  /requires javascript/i,
  /please enable javascript/i,

  // Rate limiting
  /rate limit/i,
  /too many requests/i,
  /slow down/i,
  /429/i,

  // Bot detection
  /detected unusual traffic/i,
  /automated access/i,
  /bot detected/i,
  /suspicious activity/i,

  // Cloudflare specific
  /cloudflare/i,
  /ray id/i,
  /checking your browser/i,
  /ddos protection/i,
];

// Suspicious titles that indicate blocked pages
const SUSPICIOUS_TITLE_PATTERNS: RegExp[] = [
  /blocked/i,
  /denied/i,
  /captcha/i,
  /verify/i,
  /forbidden/i,
  /unauthorized/i,
  /just a moment/i,
  /attention required/i,
  /security check/i,
  /access denied/i,
];

/**
 * Validate HTML content for blocked pages, partial content, etc.
 * @param html - HTML content to validate
 * @param options - Validation options
 * @returns Validation result with isValid flag and reason if invalid
 */
export function validateHtmlContent(
  html: string | null | undefined,
  options?: {
    /** Minimum content length to be considered valid (default: 500) */
    minLength?: number;
    /** Additional block patterns to check */
    extraBlockPatterns?: RegExp[];
    /** Skip structure validation (for partial HTML extraction) */
    skipStructureCheck?: boolean;
  }
): HtmlValidationResult {
  const minLength = options?.minLength ?? 500;

  // 1. Empty/null check
  if (!html || html.trim().length === 0) {
    return { isValid: false, reason: "empty" };
  }

  // 2. Minimum content length check (blocked pages typically <1KB)
  if (html.length < minLength) {
    return { isValid: false, reason: "partial" };
  }

  // 3. Block patterns detection
  const allPatterns = options?.extraBlockPatterns
    ? [...BLOCK_PATTERNS, ...options.extraBlockPatterns]
    : BLOCK_PATTERNS;

  for (const pattern of allPatterns) {
    if (pattern.test(html)) {
      return { isValid: false, reason: "blocked" };
    }
  }

  // 4. Suspicious title check
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    if (SUSPICIOUS_TITLE_PATTERNS.some((p) => p.test(title))) {
      return { isValid: false, reason: "blocked" };
    }
  }

  // 5. Structure validation (optional)
  if (!options?.skipStructureCheck) {
    const hasDoctype = /<!doctype html>/i.test(html);
    const hasHtmlTag = /<html/i.test(html);
    const hasBody = /<body/i.test(html);

    // If missing basic structure and content is small, likely partial
    if (!hasDoctype && !hasHtmlTag && !hasBody && html.length < 5000) {
      return { isValid: false, reason: "partial" };
    }
  }

  return { isValid: true };
}

/**
 * Quick check if HTML is blocked or empty (simpler version)
 */
export function isBlockedOrEmpty(html: string | null | undefined): boolean {
  const result = validateHtmlContent(html);
  return !result.isValid;
}
