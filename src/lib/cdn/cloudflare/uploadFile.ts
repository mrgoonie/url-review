import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import guessMimeTypeByBuffer from "diginext-utils/dist/string/guessMimeTypeByBuffer";

import { IsProd } from "@/config";
import AppConfig from "@/config/AppConfig";
import { env } from "@/env";
import { isCdnStorageAvaiable } from "@/lib/cdn";

const REGION = "auto"; // R2 doesn't require a region, but the SDK needs this parameter
const ACCESS_KEY = env.CLOUDFLARE_CDN_ACCESS_KEY || "";
const SECRET_KEY = env.CLOUDFLARE_CDN_SECRET_KEY || "";
const ENDPOINT = env.CLOUDFLARE_CDN_ENDPOINT_URL || "";
const BUCKET_NAME = env.CLOUDFLARE_CDN_BUCKET_NAME || "";

export const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  endpoint: ENDPOINT,
  forcePathStyle: true,
});

export async function uploadFile(fileContent: Buffer, fileName: string) {
  try {
    if (!isCdnStorageAvaiable()) {
      console.warn("CDN not available, skipping file upload.");
      return "";
    }

    if (fileName?.startsWith("/")) {
      fileName = fileName.substring(1);
    }

    if (!IsProd()) {
      fileName = `dev-may-delete/${fileName}`;
    }

    const mimeType = guessMimeTypeByBuffer(fileContent);

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: mimeType,
      CacheControl: "max-age=14400, s-maxage=84000",
    };

    const data = await s3.send(new PutObjectCommand(uploadParams));

    return AppConfig.getCloudflareCDNUrl(`/${fileName}`);
  } catch (err) {
    console.error("Failed to upload file to CDN:", err);
  }

  return "";
}
