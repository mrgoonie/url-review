/**
 * Scrapling Stealth Fetcher
 * Uses Python's Scrapling library with StealthyFetcher for anti-bot bypass.
 * Runs as a child process calling bin/scrapling-fetch.py.
 * Free alternative to scrapedo/scrappey/firecrawl for protected sites.
 */

import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(__dirname, "../../../bin/scrapling-fetch.py");

interface ScraplingOptions {
  timeout?: number;
  selector?: string;
  debug?: boolean;
}

/**
 * Fetch HTML using Scrapling's StealthyFetcher (anti-bot, JS rendering)
 * @param url - URL to fetch
 * @param options - timeout (ms), CSS selector, debug flag
 * @returns HTML content string
 */
export function getHtmlWithScrapling(
  url: string,
  options?: ScraplingOptions
): Promise<string> {
  const timeoutSec = Math.ceil((options?.timeout ?? 30000) / 1000);
  const debug = options?.debug ?? false;

  if (debug) {
    console.log(`get-html-with-scrapling.ts > Fetching ${url} with Scrapling (timeout: ${timeoutSec}s)`);
  }

  const args = [SCRIPT_PATH, url, "--timeout", String(timeoutSec)];
  if (options?.selector) {
    args.push("--selector", options.selector);
  }

  return new Promise((resolve, reject) => {
    const proc = execFile(
      "python3",
      args,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large pages
        timeout: (timeoutSec + 15) * 1000, // extra 15s grace for browser startup
      },
      (error, stdout, stderr) => {
        if (stderr && debug) {
          console.log(`get-html-with-scrapling.ts > stderr: ${stderr.slice(0, 500)}`);
        }

        if (error) {
          const msg = stderr?.trim() || error.message;
          reject(new Error(`Scrapling failed: ${msg}`));
          return;
        }

        const html = stdout.trim();
        if (!html) {
          reject(new Error("Scrapling returned empty content"));
          return;
        }

        if (debug) {
          console.log(`get-html-with-scrapling.ts > Got ${html.length} chars`);
        }

        resolve(html);
      }
    );
  });
}
