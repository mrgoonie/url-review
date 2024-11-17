import { type VideoCaption, VideoProvider } from "@prisma/client";
import { randomInt } from "crypto";

import { prisma } from "@/lib/db";

import { wait } from "../utils";
import type { VideoInfo } from "./types";
import { type CaptionLocale, fetchTranscript, listCaptionLocales } from "./youtube-transcript";

export default async function youtubeCaptionDownload(videoInfo: VideoInfo) {
  if (!videoInfo) throw new Error("videoInfo is required");

  const locales = Object.keys(videoInfo.automatic_captions);
  const captions: VideoCaption[] = [];

  let totalCaptions = 0;
  let totalCaptionsSaved = 0;
  for (const locale of locales) {
    const captionLocales = listCaptionLocales(videoInfo, { locale });
    for (const captionLocale of captionLocales) {
      if (captionLocale) totalCaptions++;
    }
  }

  // fetch transcript for each locale every 0.2 seconds after each other
  for (const locale of locales) {
    const captionLocales = listCaptionLocales(videoInfo, { locale });
    for (const captionLocale of captionLocales) {
      if (captionLocale) {
        if (!captionLocale.name) captionLocale.name = locale;

        // check if transcript already exists
        const savedTranscript = await prisma.videoCaption.findUnique({
          where: {
            videoProvider_sourceId_locale_ext: {
              videoProvider: VideoProvider.YOUTUBE,
              sourceId: videoInfo.id,
              locale,
              ext: captionLocale.ext,
            },
          },
        });
        if (savedTranscript) {
          console.log(
            `[VIDEO ${videoInfo.id} | CACHED] >> saved ${totalCaptionsSaved}/${totalCaptions} captions (${locale}, ${captionLocale.ext})`
          );
          captions.push(savedTranscript);
          totalCaptionsSaved++;
          continue;
        }

        // fetch transcript
        const content = await fetchTranscript(captionLocale as CaptionLocale, { proxy: true });
        if (!content) continue;

        // save transcript
        const video = await prisma.video.findUnique({
          where: {
            provider_sourceId: {
              provider: VideoProvider.YOUTUBE,
              sourceId: videoInfo.id,
            },
          },
        });
        const newTranscript = await prisma.videoCaption.create({
          data: {
            videoId: video?.id,
            videoProvider: VideoProvider.YOUTUBE,
            sourceId: videoInfo.id,
            ext: captionLocale.ext,
            locale,
            localeName: captionLocale.name,
            content,
          },
        });
        console.log(
          `[VIDEO ${videoInfo.id}] >> saved ${totalCaptionsSaved}/${totalCaptions} captions (${locale}, ${captionLocale.ext})`
        );
        captions.push(newTranscript);
        totalCaptionsSaved++;

        // wait for a while before fetching the next caption (avoid 429 error)
        await wait(randomInt(10_000, 20_000));
      }
    }
  }
  console.log(
    `[VIDEO ${videoInfo.id}] >> saved ${totalCaptionsSaved} of ${totalCaptions} captions`
  );
  return captions;
}
