import { toFloat } from "diginext-utils/dist/object";
import _ from "lodash";
import { parse } from "node-html-parser";
import { chromium } from "playwright";

import { fetchWebshare } from "../proxy/webshare-proxy";
import { secondsToTimeString } from "../utils/time";

const { isEmpty } = _;

const userAgentStrings = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.3497.92 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
];

const viewports = [
  { width: 2560, height: 1664 },
  { width: 1920, height: 1080 },
  { width: 1400, height: 900 },
  { width: 1280, height: 720 },
];

export type TranscriptTextItem = {
  startSec: number;
  endSec: number;
  startTime: string;
  endTime: string;
  duration: number;
  text: string;
};

export async function fetchTranscriptPlaywright(
  videoId: string,
  config: { lang?: string | null; output?: "string" | "array" | "object" } = {}
) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    // proxy
    const proxies = await fetchWebshare();
    const randomProxy = !isEmpty(proxies)
      ? proxies[Math.floor(Math.random() * proxies.length)]
      : undefined;
    const proxy = randomProxy
      ? {
          server: `${randomProxy.proxy_address}:${randomProxy.port}`,
          username: randomProxy.username,
          password: randomProxy.password,
        }
      : undefined;

    console.log("fetchTranscriptPlaywright() > proxy :>> ", proxy);
    const browser = await chromium.launch({ headless: true, proxy });

    // create new context
    const context = await browser.newContext({
      viewport: viewports[Math.floor(Math.random() * viewports.length)],
      userAgent: userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
    });

    // add init script
    await context.addInitScript(
      "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    );

    // set default cookie
    // if (Config.PLAYWRIGHT_COOKIES) context.addCookies(Config.PLAYWRIGHT_COOKIES);

    // new page
    const page = await context.newPage();

    // max timeout: 120 seconds
    page.setDefaultNavigationTimeout(5 * 60_000);

    // go to url
    await page.goto(url);

    // Wait for load state
    await page.waitForLoadState();
    await page.mouse.move(100, 85);
    await page.mouse.move(104, 92);

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    const html = await page.content();

    const dataString = html.split("var ytInitialPlayerResponse = ")?.[1]?.split("};")?.[0] + "}";
    // console.log('dataString :>> ', dataString);

    const data = JSON.parse(dataString.trim());
    const availableCaptions = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

    // extract transcript url
    const captionTrack = availableCaptions?.[0];
    let transcriptUrl = captionTrack?.baseUrl;

    console.log("transcriptUrl :>> ", transcriptUrl);

    // close page & browser
    try {
      page.close();
      browser.close();
    } catch (e) {
      console.error(e);
    }

    // fetch & parse captions
    if (!transcriptUrl)
      throw new Error("Unable to locate a transcription of this video due to copyright.");

    // select lang
    if (config?.lang) transcriptUrl = transcriptUrl.replace(/lang=en/, `lang=${config?.lang}`);

    const transcriptXML = await fetch(transcriptUrl)
      .then((res) => res.text())
      .then((xml) => parse(xml));

    const texts: TranscriptTextItem[] = [];
    const scripts: string[] = [];
    const chunks = transcriptXML.getElementsByTagName("text");
    for (const chunk of chunks) {
      const startSec = toFloat(chunk.getAttribute("start"));
      const duration = toFloat(chunk.getAttribute("dur"));
      const endSec = startSec + duration;
      const startTime = secondsToTimeString(startSec);
      const endTime = secondsToTimeString(endSec);
      scripts.push(`[from ${startTime} to ${endTime}] ${chunk.textContent}`);
      // scripts.push(`[At ${startSec}s] ${chunk.textContent}`);
      texts.push({
        startSec,
        endSec,
        startTime,
        endTime,
        duration,
        text: chunk.textContent,
      });
    }

    return config.output === "object"
      ? texts
      : config.output === "array"
        ? scripts
        : scripts.join("\n");
  } catch (e: any) {
    console.error(`[ERROR] fetchTranscript(${url}) :>>`, e);
    throw new Error(e.message);
  }
}
