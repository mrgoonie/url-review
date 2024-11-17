import axios from "axios";

export default async function getBlobByUrl(url: string) {
  try {
    const response = await axios.get(url, { responseType: "blob" });
    if (response.status !== 200) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);

    const blob = response.data;

    return blob;
  } catch (error) {
    console.error("Error downloading the image:", error);
    throw new Error("Download Image");
  }
}
