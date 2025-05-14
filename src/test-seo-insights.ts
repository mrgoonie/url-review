/**
 * Test script for SEO insights module
 * Run with: npm run dev:test-seo
 */

import {
  checkTraffic,
  getBacklinks,
  getKeywordDifficulty,
  getKeywordIdeas,
} from "@/modules/seo-insights/seo-insights-service";

async function testSeoInsights() {
  try {
    console.log("Testing SEO Insights module...");

    // Test backlinks
    console.log("\n=== Testing getBacklinks ===");
    const domain = "example.com";
    console.log(`Getting backlinks for domain: ${domain}`);
    const backlinksData = await getBacklinks(domain);
    console.log(
      "Backlinks data:",
      JSON.stringify(backlinksData, null, 2).substring(0, 500) + "..."
    );

    // Test keyword ideas
    console.log("\n=== Testing getKeywordIdeas ===");
    const keyword = "seo tools";
    console.log(`Getting keyword ideas for: ${keyword}`);
    const keywordIdeasData = await getKeywordIdeas(keyword);
    console.log(
      "Keyword ideas data:",
      JSON.stringify(keywordIdeasData, null, 2).substring(0, 500) + "..."
    );

    // Test keyword difficulty
    console.log("\n=== Testing getKeywordDifficulty ===");
    console.log(`Getting keyword difficulty for: ${keyword}`);
    const keywordDifficultyData = await getKeywordDifficulty(keyword);
    console.log(
      "Keyword difficulty data:",
      JSON.stringify(keywordDifficultyData, null, 2).substring(0, 500) + "..."
    );

    // Test traffic
    console.log("\n=== Testing checkTraffic ===");
    console.log(`Checking traffic for domain: ${domain}`);
    const trafficData = await checkTraffic(domain);
    console.log("Traffic data:", JSON.stringify(trafficData, null, 2).substring(0, 500) + "...");

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Error testing SEO insights module:", error);
  }
}

// Run the test
testSeoInsights();
