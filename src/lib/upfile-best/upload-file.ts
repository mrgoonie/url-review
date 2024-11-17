import axios from "axios";

import { bufferToBlob } from "../utils";
import { getUpfileKey } from "./get-upfile-key";

export type UpfileResponse = {
  id: string;
  url: string;
  blurBase64: string;
  width: number;
  height: number;
};

export async function uploadFileBest(buffer: Buffer) {
  const keyInfo = await getUpfileKey("image/png");
  if (!keyInfo) throw new Error("Failed to get key info");

  const blob = bufferToBlob(buffer);

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("key", keyInfo.key);

  const response = await axios.put("https://upfile.best/api/v4/upload/image", formData);
  return response.data as UpfileResponse;
}
