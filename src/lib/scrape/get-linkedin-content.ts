/**
 * LinkedIn Content Fetcher
 * Specialized module for fetching content from LinkedIn profile & company URLs.
 * Uses 2 chained RapidAPI providers with fallback:
 *   1. Fresh LinkedIn Scraper API (SaleLeads) — takes username/slug
 *   2. Fresh LinkedIn Profile Data (FreshData) — takes full linkedin_url
 *
 * Providers: ./linkedin-api-providers.ts
 * HTML templates: ./linkedin-html-templates.ts
 */

import { env } from "@/env";

import {
	provider1GetCompany,
	provider1GetProfile,
	provider2GetCompany,
	provider2GetProfile,
} from "./linkedin-api-providers";
import { companyToHtml, profileToHtml } from "./linkedin-html-templates";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LinkedInProfile {
	name: string;
	headline?: string;
	location?: string;
	summary?: string;
	avatar?: string;
	cover?: string;
	publicIdentifier?: string;
	followers?: number;
	connections?: number;
	isOpenToWork?: boolean;
	isPremium?: boolean;
}

export interface LinkedInCompany {
	name: string;
	description?: string;
	industry?: string;
	website?: string;
	logo?: string;
	cover?: string;
	employeeCount?: number;
	headquarters?: string;
	founded?: number;
	specialties?: string[];
}

export interface LinkedInContent {
	type: "profile" | "company";
	profile?: LinkedInProfile;
	company?: LinkedInCompany;
	html: string;
}

export interface LinkedInFetchOptions {
	debug?: boolean;
	timeout?: number;
}

// ---------------------------------------------------------------------------
// URL Detection
// ---------------------------------------------------------------------------

/** Check if URL is any LinkedIn URL */
export function isLinkedInUrl(url: string): boolean {
	try {
		const host = new URL(url).hostname.toLowerCase();
		return host === "linkedin.com" || host.endsWith(".linkedin.com");
	} catch {
		return false;
	}
}

/** Check if URL is a LinkedIn personal profile */
export function isLinkedInProfileUrl(url: string): boolean {
	if (!isLinkedInUrl(url)) return false;
	return /\/in\/[^/]+/i.test(new URL(url).pathname);
}

/** Check if URL is a LinkedIn company page */
export function isLinkedInCompanyUrl(url: string): boolean {
	if (!isLinkedInUrl(url)) return false;
	return /\/company\/[^/]+/i.test(new URL(url).pathname);
}

/** Extract username slug from profile URL (e.g. "williamhgates") */
export function extractLinkedInUsername(url: string): string | null {
	try {
		const match = new URL(url).pathname.match(/\/in\/([^/?#]+)/i);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

/** Extract company slug from company URL (e.g. "microsoft") */
export function extractLinkedInCompanySlug(url: string): string | null {
	try {
		const match = new URL(url).pathname.match(/\/company\/([^/?#]+)/i);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Main Public API
// ---------------------------------------------------------------------------

/**
 * Fetch LinkedIn content (profile or company) using chained providers.
 * Provider 1 (SaleLeads) is tried first; on failure, falls back to Provider 2 (FreshData).
 */
export async function getLinkedInContent(
	url: string,
	options?: LinkedInFetchOptions
): Promise<LinkedInContent> {
	const opts: LinkedInFetchOptions = { timeout: 15000, ...options };
	const debug = opts.debug ?? false;

	if (!env.RAPID_API_KEY) {
		throw new Error("RAPID_API_KEY not configured");
	}

	const isProfile = isLinkedInProfileUrl(url);
	const isCompany = isLinkedInCompanyUrl(url);

	if (!isProfile && !isCompany) {
		throw new Error(`Unsupported LinkedIn URL type: ${url}`);
	}

	// Normalise URL for Provider 2 (needs full URL with trailing slash)
	const normalizedUrl = url.endsWith("/") ? url : `${url}/`;
	const errors: string[] = [];

	if (isProfile) {
		const username = extractLinkedInUsername(url);

		// Provider 1
		if (username) {
			try {
				const profile = await provider1GetProfile(username, opts);
				return { type: "profile", profile, html: profileToHtml(profile, url) };
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				if (debug) console.log(`get-linkedin-content.ts > Provider1 failed: ${msg}`);
				errors.push(`Provider1: ${msg}`);
			}
		}

		// Provider 2 (fallback)
		try {
			const profile = await provider2GetProfile(normalizedUrl, opts);
			return { type: "profile", profile, html: profileToHtml(profile, url) };
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (debug) console.log(`get-linkedin-content.ts > Provider2 failed: ${msg}`);
			errors.push(`Provider2: ${msg}`);
		}
	}

	if (isCompany) {
		const slug = extractLinkedInCompanySlug(url);

		// Provider 1
		if (slug) {
			try {
				const company = await provider1GetCompany(slug, opts);
				return { type: "company", company, html: companyToHtml(company, url) };
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				if (debug) console.log(`get-linkedin-content.ts > Provider1 failed: ${msg}`);
				errors.push(`Provider1: ${msg}`);
			}
		}

		// Provider 2 (fallback)
		try {
			const company = await provider2GetCompany(normalizedUrl, opts);
			return { type: "company", company, html: companyToHtml(company, url) };
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (debug) console.log(`get-linkedin-content.ts > Provider2 failed: ${msg}`);
			errors.push(`Provider2: ${msg}`);
		}
	}

	throw new Error(`All LinkedIn providers failed for ${url}`);
}

/**
 * Fetch LinkedIn content and return HTML string.
 * Drop-in compatible with getTwitterHtml / getFacebookHtml pattern.
 */
export async function getLinkedInHtml(
	url: string,
	options?: LinkedInFetchOptions
): Promise<string> {
	const content = await getLinkedInContent(url, options);
	return content.html;
}
