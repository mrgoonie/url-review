/**
 * LinkedIn RapidAPI Provider Implementations
 * Provider 1: Fresh LinkedIn Scraper API (SaleLeads)
 * Provider 2: Fresh LinkedIn Profile Data (FreshData)
 */

import axios from "axios";

import { env } from "@/env";

import type { LinkedInCompany, LinkedInFetchOptions, LinkedInProfile } from "./get-linkedin-content";

// ---------------------------------------------------------------------------
// Provider 1 — Fresh LinkedIn Scraper API (SaleLeads)
// ---------------------------------------------------------------------------

const PROVIDER1_HOST = "fresh-linkedin-scraper-api.p.rapidapi.com";

function provider1Headers() {
	return {
		"x-rapidapi-key": env.RAPID_API_KEY,
		"x-rapidapi-host": PROVIDER1_HOST,
	};
}

export async function provider1GetProfile(
	username: string,
	options: LinkedInFetchOptions
): Promise<LinkedInProfile> {
	const { debug, timeout = 15000 } = options;
	if (debug) console.log(`linkedin-api-providers.ts > Provider1 profile: ${username}`);

	const { data } = await axios.get(`https://${PROVIDER1_HOST}/api/v1/user/profile`, {
		params: { username },
		headers: provider1Headers(),
		timeout,
	});

	if (!data?.success || !data?.data) {
		throw new Error(`Provider1 profile: ${data?.message || "no data returned"}`);
	}

	const d = data.data;
	return {
		name: d.full_name || `${d.first_name || ""} ${d.last_name || ""}`.trim(),
		headline: d.headline,
		location: [d.location?.city, d.location?.country].filter(Boolean).join(", ") || undefined,
		summary: d.summary,
		avatar: d.profile_image_url || d.avatar,
		cover: d.cover?.[0]?.url,
		publicIdentifier: d.public_identifier,
		followers: d.follower_count,
		connections: d.connection_count,
		isOpenToWork: d.is_open_to_work,
		isPremium: d.is_premium,
	};
}

export async function provider1GetCompany(
	companySlug: string,
	options: LinkedInFetchOptions
): Promise<LinkedInCompany> {
	const { debug, timeout = 15000 } = options;
	if (debug) console.log(`linkedin-api-providers.ts > Provider1 company: ${companySlug}`);

	const { data } = await axios.get(`https://${PROVIDER1_HOST}/api/v1/company/profile`, {
		params: { company: companySlug },
		headers: provider1Headers(),
		timeout,
	});

	if (!data?.success || !data?.data) {
		throw new Error(`Provider1 company: ${data?.message || "no data returned"}`);
	}

	const d = data.data;
	return {
		name: d.name,
		description: d.description,
		industry: d.industry,
		website: d.website,
		logo: d.logo,
		cover: d.cover_image,
		employeeCount: d.employee_count ?? d.staff_count,
		headquarters: d.headquarters,
		founded: d.founded_year ?? d.founded,
		specialties: d.specialities ?? d.specialties,
	};
}

// ---------------------------------------------------------------------------
// Provider 2 — Fresh LinkedIn Profile Data (FreshData)
// ---------------------------------------------------------------------------

const PROVIDER2_HOST = "fresh-linkedin-profile-data.p.rapidapi.com";

function provider2Headers() {
	return {
		"x-rapidapi-key": env.RAPID_API_KEY,
		"x-rapidapi-host": PROVIDER2_HOST,
	};
}

export async function provider2GetProfile(
	linkedinUrl: string,
	options: LinkedInFetchOptions
): Promise<LinkedInProfile> {
	const { debug, timeout = 15000 } = options;
	if (debug) console.log(`linkedin-api-providers.ts > Provider2 profile: ${linkedinUrl}`);

	const { data } = await axios.get(`https://${PROVIDER2_HOST}/enrich-lead`, {
		params: { linkedin_url: linkedinUrl },
		headers: provider2Headers(),
		timeout,
	});

	if (!data?.data) {
		throw new Error(`Provider2 profile: no data returned`);
	}

	const d = data.data;
	return {
		name: d.full_name || `${d.first_name || ""} ${d.last_name || ""}`.trim(),
		headline: d.headline || d.occupation,
		location: d.location || d.city,
		summary: d.summary || d.about,
		avatar: d.profile_image_url || d.profile_pic_url,
		cover: d.background_cover_image_url,
		publicIdentifier: d.public_identifier || d.linkedin_id,
		followers: d.follower_count,
		connections: d.connections_count ?? d.connections,
		isOpenToWork: d.is_open_to_work,
		isPremium: d.is_premium,
	};
}

export async function provider2GetCompany(
	linkedinUrl: string,
	options: LinkedInFetchOptions
): Promise<LinkedInCompany> {
	const { debug, timeout = 15000 } = options;
	if (debug) console.log(`linkedin-api-providers.ts > Provider2 company: ${linkedinUrl}`);

	const { data } = await axios.get(`https://${PROVIDER2_HOST}/get-company-by-linkedinurl`, {
		params: { linkedin_url: linkedinUrl },
		headers: provider2Headers(),
		timeout,
	});

	if (!data?.data) {
		throw new Error(`Provider2 company: no data returned`);
	}

	const d = data.data;
	return {
		name: d.name || d.company_name,
		description: d.description,
		industry: d.industry,
		website: d.website,
		logo: d.logo || d.profile_pic_url,
		cover: d.background_cover_image_url || d.cover_image_url,
		employeeCount: d.company_size ?? d.staff_count ?? d.employee_count,
		headquarters: d.hq?.city
			? [d.hq.city, d.hq.state, d.hq.country].filter(Boolean).join(", ")
			: d.headquarters,
		founded: d.founded_year ?? d.founded,
		specialties: d.specialities ?? d.specialties,
	};
}
