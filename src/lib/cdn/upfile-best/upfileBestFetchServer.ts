import { env } from "@/env";
import { configureUpfileBest, getApiUpfileBestUrl } from "@/lib/cdn/upfile-best";
import { type FetchResponse } from "@/lib/fetch/tfsFetchClient";
import { tfsFetchServer } from "@/lib/fetch/tfsFetchServer";

export default async function upfileBestFetchServer<T>({
  path,
  headers,
  ...rest
}): Promise<FetchResponse<T>> {
  "use server";

  try {
    configureUpfileBest();

    return await tfsFetchServer({
      path: getApiUpfileBestUrl(path),
      headers: {
        ...headers,
        "upfilebest-api-key": env.UPFILE_BEST_API_KEY!,
      },
      ...rest,
    });
  } catch (error) {
    throw new Error(`index failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
