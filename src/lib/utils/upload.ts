import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { toBool } from "diginext-utils/dist/object";
import guessMimeTypeByBuffer from "diginext-utils/dist/string/guessMimeTypeByBuffer";

export const isCdnStorageAvaiable = () => {
  return (
    toBool(process.env.CLOUDFLARE_CDN_ACCESS_KEY) && toBool(process.env.CLOUDFLARE_CDN_SECRET_KEY)
  );
};

const REGION = "auto"; // Cloudflare R2 doesn't require a region, but the SDK needs this parameter
const ACCESS_KEY = process.env.CLOUDFLARE_CDN_ACCESS_KEY || "";
const SECRET_KEY = process.env.CLOUDFLARE_CDN_SECRET_KEY || "";
const ENDPOINT = process.env.CLOUDFLARE_CDN_ENDPOINT_URL || "";
const BUCKET_NAME = process.env.CLOUDFLARE_CDN_BUCKET_NAME || "";

export const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  endpoint: ENDPOINT,
  forcePathStyle: true,
});

/**
 * Upload file to Cloudflare CDN.
 * @param fileContent
 * @param fileName
 * @returns
 */
export async function uploadFile(fileContent: Buffer, fileName: string) {
  try {
    if (!isCdnStorageAvaiable()) {
      console.warn("CDN not available, skipping file upload.");
      return "";
    }

    const mimeType = guessMimeTypeByBuffer(fileContent);

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: mimeType,
      CacheControl: "max-age=31536000, s-maxage=31536000",
    };

    const data = await s3.send(new PutObjectCommand(uploadParams));

    return `${process.env.CLOUDFLARE_CDN_BASE_URL}/${fileName}`;
  } catch (err) {
    console.error("Failed to upload file to CDN:", err);
  }

  return "";
}
