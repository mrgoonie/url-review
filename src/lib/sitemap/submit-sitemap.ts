import axios from "axios";

import { getGoogleAccessToken } from "../google/google-oauth2";

export async function submitSitemapToGoogleSearchConsole(
  siteUrl: string,
  sitemapUrl: string
): Promise<void> {
  try {
    const accessToken = await getGoogleAccessToken();

    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const encodedSitemapUrl = encodeURIComponent(sitemapUrl);

    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`;

    const response = await axios.put(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Sitemap submitted successfully");
  } catch (error) {
    console.error("Error submitting sitemap:", error);
    throw error;
  }
}
