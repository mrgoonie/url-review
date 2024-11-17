import getBlobByUrl from "@/lib/cdn/helpers/getBlobByUrl";
import upfileBestFetchServer from "@/lib/cdn/upfile-best/upfileBestFetchServer";

export default async function uploadMetafile(url: string, directory: string = "") {
  //
  try {
    const blob = await getBlobByUrl(url);

    const generateKey = (await upfileBestFetchServer({
      path: "/api/v4/upload/meta",
      headers: {
        "Content-Type": "application/json",
      },
      data: { mimetype: blob.type },
    })) as any;

    if (!generateKey?.data?.key) throw new Error("No Key");

    const res = (await upfileBestFetchServer({
      path: "/v4/transfer-image",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        key: generateKey?.data?.key,
        url,
      },
    })) as any;

    return res.data?.url;
    // const blob = (await resize(file, { maxWidth: 2048, maxHeight: 2048 })) as Blob;
  } catch (error) {
    throw new Error(
      `Upload Metafile failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
