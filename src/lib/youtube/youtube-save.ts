import type { VideoInfo } from "./types";
import youtubeCaptionDownload from "./youtube-caption-download";
import youtubeInfo from "./youtube-info";

export default async function youtubeSave(url: string) {
  if (!url) throw new Error("url is required");
  console.log("Save youtube video :>>", url);
  try {
    // video info
    const result = await youtubeInfo(url);
    const data = {
      ...result,
      merged: result.formats.filter(
        (format: any) => format.acodec !== "none" && format.vcodec !== "none"
      ),
      audios: result.formats.filter((format: any) => format.acodec !== "none"),
      videos: result.formats.filter((format: any) => format.vcodec !== "none"),
      formats: [],
    } as VideoInfo;

    // save all automatic_captions
    youtubeCaptionDownload(data);

    return data as VideoInfo;
  } catch (e: any) {
    console.error(e);
    throw new Error(`Unable to get youtube info`);
  }
}
