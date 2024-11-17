import guessMimeTypeByBuffer from "diginext-utils/dist/string/guessMimeTypeByBuffer";
import { randomFileName } from "diginext-utils/dist/string/random";
import { getExtensionFromMimeType } from "diginext-utils/dist/string/url";

import { isCdnStorageAvaiable } from "@/lib/cdn";
import { uploadFile } from "@/lib/cdn/cloudflare/uploadFile";
import getBufferByUrl from "@/lib/cdn/helpers/getBufferByUrl";

export default async function transferImageToCDN(url: string, directory: string = "") {
  //
  if (!url) return "";
  if (!isCdnStorageAvaiable()) return "";

  try {
    const buffer = await getBufferByUrl(url);
    const mimeType = guessMimeTypeByBuffer(buffer);
    const ext = getExtensionFromMimeType(mimeType);

    const name = `${directory}${randomFileName("a")}.${ext}`;

    return await uploadFile(buffer, name);
  } catch (error) {
    console.error(`Transfer Image To Cdn error`, error);
  }

  return "";
}
