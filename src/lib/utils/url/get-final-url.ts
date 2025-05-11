import axios from "axios";

export async function getUrlAfterRedirects(url: string) {
  try {
    const response = await axios.head(url);
    return response.request.res.responseUrl;
  } catch (error) {
    console.error(`getUrlAfterRedirects.ts > getUrlAfterRedirects() > Error :>>`, error);
    return url;
  }
}
