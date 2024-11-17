import axios from "axios";

export default async function getBufferByUrl(url: string) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    if (response.status !== 200) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);

    const buffer = Buffer.from(response.data);

    return buffer;
  } catch (error) {
    console.error("Error downloading the image:", error);
    throw new Error("Download Image");
  }
}
