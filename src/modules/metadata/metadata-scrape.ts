import axios from "axios";
import { JSDOM } from "jsdom";

export async function scrapeMetadata(inputUrl: string) {
  const response = await axios.get(inputUrl);
  const data = response.data;
  const dom = new JSDOM(data);
  const document = dom.window.document;

  const title = document.querySelector("title")?.textContent;
  const description = document.querySelector("meta[name='description']")?.getAttribute("content");
  const language =
    document.querySelector("meta[name='language']")?.getAttribute("content") ||
    document.documentElement.lang ||
    "en";
  const image = document.querySelector("meta[name='image']")?.getAttribute("content");
  const keywords = document
    .querySelector("meta[name='keywords']")
    ?.getAttribute("content")
    ?.split(",");
  const url = document.querySelector("meta[name='url']")?.getAttribute("content");
  const author = document.querySelector("meta[name='author']")?.getAttribute("content");
  const publisher = document.querySelector("meta[name='publisher']")?.getAttribute("content");
  const publishedTime = document
    .querySelector("meta[name='published-time']")
    ?.getAttribute("content");
  const copyright = document.querySelector("meta[name='copyright']")?.getAttribute("content");
  const favicon = document.querySelector("link[rel='icon']")?.getAttribute("href");
  const video = document.querySelector("meta[name='video']")?.getAttribute("content");
  const type = document.querySelector("meta[name='type']")?.getAttribute("content");
  const category = document.querySelector("meta[name='category']")?.getAttribute("content");
  const tags = document.querySelector("meta[name='tags']")?.getAttribute("content");
  const location = document.querySelector("meta[name='location']")?.getAttribute("content");
  const robots = document.querySelector("meta[name='robots']")?.getAttribute("content");

  // og
  const ogTitle = document.querySelector("meta[property='og:title']")?.getAttribute("content");
  const ogDescription = document
    .querySelector("meta[property='og:description']")
    ?.getAttribute("content");
  const ogImage = document.querySelector("meta[property='og:image']")?.getAttribute("content");
  const ogUrl = document.querySelector("meta[property='og:url']")?.getAttribute("content");

  // twitter
  const twitterTitle = document
    .querySelector("meta[name='twitter:title']")
    ?.getAttribute("content");
  const twitterDescription = document
    .querySelector("meta[name='twitter:description']")
    ?.getAttribute("content");
  const twitterImage = document
    .querySelector("meta[name='twitter:image']")
    ?.getAttribute("content");
  const twitterUrl = document.querySelector("meta[name='twitter:url']")?.getAttribute("content");

  return {
    title,
    description,
    language,
    image,
    keywords,
    url,
    author,
    publisher,
    publishedTime,
    copyright,
    favicon,
    video,
    type,
    category,
    tags,
    location,
    robots,
    // facebook
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    // twitter
    twitterTitle,
    twitterDescription,
    twitterImage,
    twitterUrl,
  };
}
