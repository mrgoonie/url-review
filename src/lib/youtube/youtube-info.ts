import { VideoProvider } from "@prisma/client";
import { $ } from "execa";

import { env } from "@/env";
import { prisma } from "@/lib/db";

import type { VideoInfo } from "./types";

export default async function youtubeInfo(url: string) {
  if (!url) throw new Error("url is required");
  console.log("Get youtube info :>>", url);
  try {
    // Prepare arguments for yt-dlp
    const args = [
      "--proxy",
      env.PROXY_URL,
      "-f",
      "bestvideo+bestaudio[ext=m4a]/best[ext=m4a]",
      "--merge-output-format",
      "mp4",
      "--dump-single-json",
      "--no-check-certificates",
      "--no-warnings",
      "--prefer-free-formats",
      "--add-header",
      "user-agent:googlebot",
      "--add-header",
      "referer:youtube.com",
      url,
    ];

    // crawl data
    const cmd = await $`./bin/yt-dlp ${args}`;

    const resultText = cmd.stdout;
    const result = JSON.parse(resultText);

    // video info
    const data = {
      ...result,
      merged: result.formats.filter(
        (format: any) => format.acodec !== "none" && format.vcodec !== "none"
      ),
      audios: result.formats.filter((format: any) => format.acodec !== "none"),
      videos: result.formats.filter((format: any) => format.vcodec !== "none"),
      formats: [],
    } as VideoInfo;

    // save to database
    await prisma.video.upsert({
      where: {
        provider_sourceId: {
          provider: VideoProvider.YOUTUBE,
          sourceId: result.id,
        },
      },
      create: {
        provider: VideoProvider.YOUTUBE,
        sourceId: result.id,
        url,
        data,
      },
      update: {
        data,
      },
    });

    return data;
  } catch (e: any) {
    console.error(e);
    throw new Error(`Unable to get youtube info`);
  }
}
