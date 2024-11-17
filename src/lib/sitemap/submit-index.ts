import axios from "axios";

import { getGoogleAccessToken } from "../google/google-oauth2";

export async function submitUrlToGoogleSearchIndex(url: string): Promise<boolean> {
  try {
    const accessToken = await getGoogleAccessToken();
    const indexingApiUrl = "https://indexing.googleapis.com/v3/urlNotifications:publish";

    const response = await axios.post(
      indexingApiUrl,
      {
        url: url,
        type: "URL_UPDATED",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 200) {
      console.log(`Successfully submitted ${url} to Google Search Index`, response.data);
      return true;
    } else {
      console.error(`Failed to submit ${url} to Google Search Index:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`Error submitting ${url} to Google Search Index:`, error);
    return false;
  }
}
