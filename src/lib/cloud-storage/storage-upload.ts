import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import { ListBucketsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

import { env } from "@/env";

import { makeSlug } from "../utils";
import { getImageBufferFromUrl, readFileToBuffer } from "../utils/image";
import {
  getUploadFileOriginEndpointUrl,
  getUploadFilePublicUrl,
  guessMimeTypeByBuffer,
} from "./helper";
import type { CloudStorageProvider, StorageUploadOptions } from "./types";
import type { ICloudStorage } from "./types";

export function getCurrentStorage(): ICloudStorage {
  return {
    provider: "cloudflare",
    region: "auto",
    bucket: env.CLOUDFLARE_CDN_BUCKET_NAME,
    accessKey: env.CLOUDFLARE_CDN_ACCESS_KEY,
    secretKey: env.CLOUDFLARE_CDN_SECRET_KEY,
    endpoint: env.CLOUDFLARE_CDN_ENDPOINT_URL,
    baseUrl: env.CLOUDFLARE_CDN_BASE_URL,
    basePath: `/${env.CLOUDFLARE_CDN_PROJECT_NAME}/${env.NODE_ENV}`,
  };
}

export async function initStorage(storage: ICloudStorage) {
  // const hashedSecretKey = await crypto.subtle
  // 	.digest("SHA-256", new TextEncoder().encode(storage.secretKey))
  // 	.then((hashBuffer) => {
  // 		const hashArray = Array.from(new Uint8Array(hashBuffer));
  // 		const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  // 		return hashHex;
  // 	});

  const s3 = new S3Client({
    region: storage.region,
    endpoint: storage.endpoint,
    credentials: {
      accessKeyId: storage.accessKey,
      secretAccessKey: storage.secretKey,
    },
    forcePathStyle: true,
  });

  return s3;
}

export async function listBuckets(storage: ICloudStorage) {
  const s3 = await initStorage(storage);

  const response = await s3.send(new ListBucketsCommand({}));

  return response.Buckets;
}

export async function uploadFileBuffer(
  buffer: Buffer,
  destFileName: string,
  options?: StorageUploadOptions
): Promise<{
  path: string;
  storageUrl: string;
  publicUrl: string;
  provider: CloudStorageProvider;
}> {
  const { storage = getCurrentStorage() } = options || {};
  if (!storage) throw new Error("Storage is not defined");

  if (destFileName.startsWith("/")) destFileName = destFileName.slice(1);

  // new file name
  const extensionMatch = destFileName.match(/\.[0-9a-z]+$/i);
  const extension = extensionMatch ? extensionMatch[0] : "";
  const fileName = destFileName.split("/").pop();
  const uploadPath = destFileName.split("/").slice(0, -1).join("/");
  const nameWithoutExtension = extension ? fileName?.slice(0, -extension.length) : fileName;
  const fileSlug = makeSlug(nameWithoutExtension || randomUUID(), {
    delimiter: "-",
  });
  destFileName = `${uploadPath}/${fileSlug}${extension}`.replace(/\/\//g, "/");

  if (options?.debug) console.log("uploadFileBuffer :>>", { storage });
  const s3 = await initStorage(storage);

  const mimeType = guessMimeTypeByBuffer(buffer);
  if (options?.debug) console.log("uploadFileBuffer :>>", { mimeType });

  const path = `${
    storage.basePath && storage.basePath.startsWith("/")
      ? storage.basePath.slice(1)
      : storage.basePath
  }/${destFileName}`;
  if (options?.debug) console.log("uploadFileBuffer :>>", { path });

  const uploadParams: PutObjectCommandInput = {
    Bucket: storage.bucket,
    Key: path,
    Body: buffer,
    ContentType: options?.contentType || mimeType,
    CacheControl: options?.cacheControl || "max-age=31536000, s-maxage=31536000", // Set cache-control headers
    ContentEncoding: options?.contentEncoding, // Set file to be gzip-encoded
  };

  if (options?.debug) console.log("uploadFileBuffer :>>", { uploadParams });

  // process upload
  try {
    // await new Upload({ client: s3, params: uploadParams }).done();
    const data = await s3.send(new PutObjectCommand(uploadParams));
    if (options?.debug) console.log("uploadFileBuffer :>>", { data });

    return {
      provider: storage.provider,
      path,
      storageUrl: getUploadFileOriginEndpointUrl(storage, destFileName),
      publicUrl: getUploadFilePublicUrl(storage, destFileName),
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Upload error:", error.message);
      // Log additional details if available
      if ("code" in error) {
        console.error("Error code:", (error as any).code);
      }
    }
    throw error;
  }
}

export async function uploadFileURL(
  url: string,
  destFileName: string,
  options?: StorageUploadOptions
) {
  const buffer = await getImageBufferFromUrl(url);
  if (options?.debug) console.log("uploadFileURL :>>", { buffer });
  if (!buffer) throw new Error(`Unable to get image buffer from "${url}"`);
  return uploadFileBuffer(buffer, destFileName, options);
}

export async function uploadFilePath(
  filePath: string,
  destFileName: string,
  options?: StorageUploadOptions
) {
  const buffer = readFileToBuffer(filePath);
  if (!buffer) throw new Error(`Unable to get image buffer from "${filePath}"`);
  return uploadFileBuffer(buffer, destFileName, options);
}
