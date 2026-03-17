#!/usr/bin/env python3
"""
Scrapling stealth fetcher for ReviewWeb.site.
Called from Node.js via child_process.execFile.
Returns HTML content to stdout, errors to stderr.

Usage: python3 scrapling-fetch.py <url> [--timeout SECONDS] [--selector CSS]
"""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument("--timeout", "-t", type=int, default=30)
    parser.add_argument("--selector", "-s", help="CSS selector to extract")
    args = parser.parse_args()

    try:
        from scrapling.fetchers import StealthyFetcher
    except ImportError:
        print("scrapling not installed. Run: pip install 'scrapling[all]'", file=sys.stderr)
        sys.exit(2)

    try:
        page = StealthyFetcher.fetch(
            args.url,
            headless=True,
            network_idle=True,
            timeout=args.timeout * 1000,
        )

        if args.selector:
            elements = page.css(args.selector)
            parts = [el.html for el in elements if el.html]
            print("\n".join(parts))
        else:
            # Return full page HTML
            html = str(page.html) if hasattr(page, "html") else str(page.body)
            print(html)

    except Exception as e:
        print(f"Scrapling fetch failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
