import { VideoProvider } from "@prisma/client";
import axios from "axios";
import { randomInt } from "crypto";
import { HttpsProxyAgent } from "https-proxy-agent";
import keys from "lodash/keys";

import { env } from "@/env";
import { prisma } from "@/lib/db";

import { wait } from "../utils";
import type { VideoInfo } from "./types";
import youtubeInfo from "./youtube-info";
import { getVideoIdFromYoutubeUrl } from "./youtube-summary";

export type TranscriptOptions = {
  locale?: string;
  /**
   * - `json3`: JSON formatted transcript
   * - `srv1`: XML formatted split by sentences
   *   ```xml
   *   <transcript>
   *     <text start="0.04" dur="3.359">hello world</text>
   *     <text start="3.36" dur="1.234">this is a test</text>
   *   </transcript>
   *   ```
   * - `srv2`: XML formatted split by words
   *   ```xml
   *   <timedtext>
   *     <window id="1" t="0" op="define" ap="6" ah="20" av="100" rc="2" cc="40" sd="1" ju="0"/>
   *     <text t="40" d="3359" w="1" r="15" c="1">hello</text>
   *     <text t="40" d="3359" w="1" r="15" c="1">world</text>
   *   </timedtext>
   *   ```
   * - `srv3`: XML formatted group by sentences & words
   *   ```xml
   *   <timedtext>
   *     <head>
   *       <ws id="0"/>
   *       <ws id="1" mh="2" ju="0" sd="3"/>
   *       <wp id="0"/>
   *       <wp id="1" ap="6" ah="20" av="100" rc="2" cc="40"/>
   *     </head>
   *     <body>
   *       <w t="0" id="1" wp="1" ws="1"/>
   *       <p t="40" d="3359" w="1">
   *         <s ac="0">caalatal </s>
   *         <s t="426" ac="0">atu </s>
   *         <s t="852" ac="0">dacrise </s>
   *         <s t="1278" ac="0">waytek</s>
   *       </p>
   *       <p t="1470" d="1929" w="1" a="1"> </p>
   *     </body>
   *   </timedtext>
   *   ```
   * - `ttml`: XML formatted with styles
   *   ```xml
   *   <tt xml:lang="en" xmlns="http://www.w3.org/ns/ttml" xmlns:tts="http://www.w3.org/ns/ttml#tts">
   *     <head>
   *       <styling>
   *         <style xml:id="s1" tts:textAlign="center" tts:extent="90% 90%" tts:origin="5% 5%" tts:displayAlign="after"/>
   *         <style xml:id="s2" tts:fontSize=".72c" tts:backgroundColor="black" tts:color="white"/>
   *       </styling>
   *       <layout>
   *         <region xml:id="r1" style="s1"/>
   *       </layout>
   *     </head>
   *     <body region="r1">
   *       <div>
   *         <p begin="00:00:00.040" end="00:00:03.399" style="s2">caalatal atu dacrise waytek</p>
   *         <p begin="00:00:01.480" end="00:00:06.000" style="s2">gacsa 19 duyyek tiyak teyni xamcin qusba</p>
   *         <p begin="00:00:03.399" end="00:00:08.679" style="s2">weeloola edde anuk ta ammunti</p>
   *         ...
   *       </p>
   *     </body>
   *   </tt>
   *   ```
   * - `vtt`: Plain text transcript
   * @default "ttml"
   */
  ext?: "json3" | "srv1" | "srv2" | "srv3" | "ttml" | "vtt";
};

export type CaptionLocale = {
  ext: string;
  url: string;
  name: string;
};

type CaptionLocaleOptions = {
  locale?: string;
  ext?: "json3" | "srv1" | "srv2" | "srv3" | "ttml" | "vtt";
};

export function listCaptionLocales(
  videoInfo: VideoInfo,
  options: Omit<CaptionLocaleOptions, "ext">
): (Omit<CaptionLocale, "name"> & { name?: string })[] {
  const { locale = "en" } = options;

  // get the caption locales for the given locale
  const captionLocales = videoInfo.automatic_captions[locale];
  if (captionLocales) return captionLocales;

  // get the default locales
  const defaultLocales = videoInfo.automatic_captions[keys(videoInfo.automatic_captions)[0]];
  return defaultLocales;
}

export function getCaptionLocale(
  videoInfo: VideoInfo,
  options: CaptionLocaleOptions
): CaptionLocale | null {
  const { locale = "en", ext = "ttml" } = options;

  // get the caption locales for the given locale
  const captionLocales = listCaptionLocales(videoInfo, { locale });
  if (captionLocales.length > 0) {
    const captionLocale = captionLocales.find((caption) => caption.ext === ext);
    if (captionLocale) {
      if (!captionLocale.name) captionLocale.name = locale;
      return captionLocale as CaptionLocale;
    }

    // if no caption locale found, return the first one
    if (!captionLocales[0].name) captionLocales[0].name = locale;
    return captionLocales[0] as CaptionLocale;
  }

  return null;
}

export type FetchTranscriptOptions = {
  proxy?: boolean;
};

export async function fetchTranscript(
  captionLocale: CaptionLocale,
  options?: FetchTranscriptOptions
): Promise<string | null> {
  try {
    if (!captionLocale.url) return null;

    if (options?.proxy) {
      const httpsAgent = new HttpsProxyAgent(env.PROXY_URL);
      const axiosResquest = axios.create({ httpsAgent });
      const response = await axiosResquest.get(captionLocale.url, {
        responseType: "text",
      });
      return typeof response.data !== "string" ? response.data.toString() : response.data;
    }

    const response = await axios.get(captionLocale.url, { responseType: "text" });
    return typeof response.data !== "string" ? response.data.toString() : response.data;
  } catch (error: any) {
    // if the error is a 429 (too many requests), wait for a random time and try again
    if (error.response?.status === 429) {
      const waitTime = randomInt(2_000, 5_000);
      console.log(`fetchTranscript() >> too many requests, waiting ${waitTime} ms...`);
      await wait(waitTime);
      return fetchTranscript(captionLocale);
    }
    console.error(`Error fetching transcript: ${captionLocale.url}`, error);
    return null;
  }
}

export async function getYoutubeTranscript(url: string, options?: TranscriptOptions) {
  if (!url) throw new Error("url is required");
  try {
    const { locale = "en", ext = "ttml" } = options || {};
    const videoId = getVideoIdFromYoutubeUrl(url);

    // if this video was already saved, return the cached caption
    const cachedCaption = await prisma.videoCaption.findUnique({
      where: {
        videoProvider_sourceId_locale_ext: {
          videoProvider: VideoProvider.YOUTUBE,
          sourceId: videoId,
          locale,
          ext,
        },
      },
    });
    if (cachedCaption) return cachedCaption.content;

    // if not cached, fetch the video info and download the caption
    const videoInfo = await youtubeInfo(url);

    const captionLocale = getCaptionLocale(videoInfo, { locale, ext });
    if (!captionLocale)
      throw new Error(`Transcript not found for "${locale}" at "${ext}" extension`);

    // save the caption to the database
    const video = await prisma.video.findUnique({
      where: {
        provider_sourceId: {
          provider: VideoProvider.YOUTUBE,
          sourceId: videoId,
        },
      },
    });

    const content = await fetchTranscript(captionLocale);
    if (!content) return null;

    const caption = await prisma.videoCaption.create({
      data: {
        videoId: video?.id,
        videoProvider: VideoProvider.YOUTUBE,
        sourceId: videoId,
        locale,
        ext: captionLocale.ext,
        localeName: captionLocale.name,
        content,
      },
    });
    return caption.content;
  } catch (e: any) {
    console.error(e);
    throw new Error(`Unable to get youtube transcript`);
  }
}
