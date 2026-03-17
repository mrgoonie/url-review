import type { FetchResponse } from "@/lib/fetch/tfsFetchClient";
import { tfsFetchClient } from "@/lib/fetch/tfsFetchClient";

import { getApiUpfileBestUrl } from ".";

export default async function upfileBestFetchClient<T>({
  path,
  ...rest
}): Promise<FetchResponse<T>> {
  "use client";
  try {
    return await tfsFetchClient({
      path: getApiUpfileBestUrl(path),
      ...rest,
    });
  } catch (error) {
    throw new Error(`index failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
