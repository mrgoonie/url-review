import { VideoProvider } from "@prisma/client";
import { randomUUID } from "crypto";

import { env } from "@/env";
import { prisma } from "@/lib/db";

import type { SummarizeOptions } from "../ai/summarize";
import { summarizeYoutubeTranscript } from "../ai/summarize";
import { summaryPartition } from "../ai/summary-partition";
import { uploadFileBuffer } from "../cloud-storage";
import { screenshot } from "../playwright/screenshot";
import { getYoutubeTranscript } from "./youtube-transcript";

export function getYoutubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getVideoIdFromYoutubeUrl(url: string): string {
  try {
    // Extract the video ID from the URL
    // console.log('url :>> ', url);
    let videoId: string;
    if (url.indexOf("youtu.be/") > -1) {
      videoId = url.split("youtu.be/")[1];
      if (videoId.indexOf("?") > -1) videoId = videoId.split("?")[0];
    } else {
      videoId = url.split("v=")[1];
      const ampersandPosition = videoId.indexOf("&");
      // If the URL contains additional parameters, remove them
      if (ampersandPosition !== -1) {
        return videoId.substring(0, ampersandPosition);
      }
    }
    return videoId;
  } catch (error) {
    console.error("Error extracting video ID:", error);
    throw error;
  }
}

export async function youtubeSummarize(urlOrID: string, options?: SummarizeOptions) {
  const videoUrl = urlOrID.startsWith("http") ? urlOrID : getYoutubeVideoUrl(urlOrID);

  const videoId = getVideoIdFromYoutubeUrl(videoUrl);
  console.log("Transcripting Youtube video :>> ", videoUrl);

  const existingVideoSummary = await prisma.videoSummary.findUnique({
    where: {
      sourceId: videoId,
    },
  });
  if (existingVideoSummary) return existingVideoSummary;

  const transcript = await getYoutubeTranscript(videoUrl);
  if (!transcript) throw new Error("Transcript not found");

  const content = await summarizeYoutubeTranscript(transcript, {
    ...options,
    userPrompt: `Summarize this Youtube video: ${videoUrl}`,
    webURL: videoUrl,
  });

  const data = await summaryPartition(content, {
    model: options?.model,
    toLanguage: options?.toLanguage || "English",
  });

  const parts = await Promise.all(
    data.parts.map(async (part) => {
      const embed_url = `${env.BASE_URL}/embed?url=${part.url}&second=${part.second}`;
      const buffer = await screenshot(embed_url, {
        clip: {
          x: 0,
          y: 80,
          width: 1400,
          height: 948 - 80 * 2,
        },
      });
      const upload = await uploadFileBuffer(buffer, `${randomUUID()}.png`);
      const image_url = upload.publicUrl;
      return { ...part, image_url };
    })
  );

  // save to database
  const video = await prisma.video.findUnique({
    where: {
      provider_sourceId: {
        provider: VideoProvider.YOUTUBE,
        sourceId: videoId,
      },
    },
    select: {
      id: true,
    },
  });

  const videoSummary = await prisma.videoSummary.create({
    data: {
      videoId: video!.id,
      sourceId: videoId,
      url: videoUrl,
      name: data.name,
      description: data.description,
      conclusion: data.conclusion,
      content,
      parts,
    },
  });

  return videoSummary;
}
