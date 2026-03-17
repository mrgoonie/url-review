import axios from "axios";

import { env } from "@/env";

export type UpfileKey = {
  key: string;
  mimetype: string;
};

export async function getUpfileKey(mimetype: string): Promise<UpfileKey | null> {
  try {
    const response = await axios.post(
      "https://upfile.best/api/v4/upload/meta",
      { mimetype },
      {
        headers: {
          "Content-Type": "application/json",
          "upfilebest-api-key": env.UPFILEBEST_API_KEY,
        },
      }
    );

    if (response.status === 200 && response.data.status === 1)
      return response.data.data as UpfileKey;

    return null;
  } catch (error) {
    console.error("Failed to get upfile key:", error);
    return null;
  }
}
