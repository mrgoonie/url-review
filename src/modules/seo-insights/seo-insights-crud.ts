/**
 * @file seo-insights-crud.ts
 * @description CRUD operations for SEO insights module
 */

import type {
  BacklinksRequest,
  KeywordDifficultyRequest,
  KeywordIdeasRequest,
  TrafficCheckRequest,
} from "./seo-insights-schemas";
import {
  checkTraffic,
  getBacklinks,
  getKeywordDifficulty,
  getKeywordIdeas,
} from "./seo-insights-service";

/**
 * Get backlinks for a domain
 * @param params - The backlinks request parameters
 * @returns Backlinks data including overview and backlinks list
 */
export async function getBacklinksForDomain(params: BacklinksRequest) {
  try {
    console.log(
      `seo-insights-crud.ts > getBacklinksForDomain() > Getting backlinks for domain: ${params.domain}`
    );

    // Extract domain from URL
    // Ensure the domain has a protocol prefix
    const domainWithProtocol =
      params.domain.startsWith("http://") || params.domain.startsWith("https://")
        ? params.domain
        : `https://${params.domain}`;

    const url = new URL(domainWithProtocol);
    const domain = url.hostname;

    const backlinksData = await getBacklinks(domain);

    console.log(
      `seo-insights-crud.ts > getBacklinksForDomain() > Successfully got backlinks for domain: ${domain}`
    );
    return backlinksData;
  } catch (error) {
    console.error(
      `seo-insights-crud.ts > getBacklinksForDomain() > Error getting backlinks for domain: ${params.domain}`,
      error
    );
    throw new Error(
      `Failed to get backlinks for domain: ${params.domain} - ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get keyword ideas for a keyword
 * @param params - The keyword ideas request parameters
 * @returns Keyword ideas data
 */
export async function getKeywordIdeasForKeyword(params: KeywordIdeasRequest) {
  try {
    console.log(
      `seo-insights-crud.ts > getKeywordIdeasForKeyword() > Getting keyword ideas for keyword: ${params.keyword}`
    );

    const keywordIdeasData = await getKeywordIdeas(
      params.keyword,
      params.country,
      params.searchEngine
    );

    console.log(
      `seo-insights-crud.ts > getKeywordIdeasForKeyword() > Successfully got keyword ideas for keyword: ${params.keyword}`
    );
    return keywordIdeasData;
  } catch (error) {
    console.error(
      `seo-insights-crud.ts > getKeywordIdeasForKeyword() > Error getting keyword ideas for keyword: ${params.keyword}`,
      error
    );
    throw new Error(
      `Failed to get keyword ideas for keyword: ${params.keyword} - ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get keyword difficulty for a keyword
 * @param params - The keyword difficulty request parameters
 * @returns Keyword difficulty data
 */
export async function getKeywordDifficultyForKeyword(params: KeywordDifficultyRequest) {
  try {
    console.log(
      `seo-insights-crud.ts > getKeywordDifficultyForKeyword() > Getting keyword difficulty for keyword: ${params.keyword}`
    );

    const keywordDifficultyData = await getKeywordDifficulty(params.keyword, params.country);

    console.log(
      `seo-insights-crud.ts > getKeywordDifficultyForKeyword() > Successfully got keyword difficulty for keyword: ${params.keyword}`
    );
    return keywordDifficultyData;
  } catch (error) {
    console.error(
      `seo-insights-crud.ts > getKeywordDifficultyForKeyword() > Error getting keyword difficulty for keyword: ${params.keyword}`,
      error
    );
    throw new Error(
      `Failed to get keyword difficulty for keyword: ${params.keyword} - ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Check traffic for a domain or URL
 * @param params - The traffic check request parameters
 * @returns Traffic data
 */
export async function checkTrafficForDomain(params: TrafficCheckRequest) {
  try {
    console.log(
      `seo-insights-crud.ts > checkTrafficForDomain() > Checking traffic for domain: ${params.domainOrUrl}`
    );

    // Extract domain from URL
    const url = new URL(params.domainOrUrl);
    const domain = url.hostname;

    const trafficData = await checkTraffic(domain, params.mode, params.country);

    console.log(
      `seo-insights-crud.ts > checkTrafficForDomain() > Successfully checked traffic for domain: ${domain}`
    );
    return trafficData;
  } catch (error) {
    console.error(
      `seo-insights-crud.ts > checkTrafficForDomain() > Error checking traffic for domain: ${params.domainOrUrl}`,
      error
    );
    throw new Error(
      `Failed to check traffic for domain: ${params.domainOrUrl} - ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
