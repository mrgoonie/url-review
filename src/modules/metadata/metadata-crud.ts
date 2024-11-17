import { prisma } from "@/lib/db";

import { scrapeMetadata } from "./metadata-scrape";

export async function createLinkMetadata(inputUrl: string) {
  const scrapedMetadata = await scrapeMetadata(inputUrl);

  // add main image to images
  const images: string[] = [];
  if (scrapedMetadata.image) images.push(scrapedMetadata.image);
  if (scrapedMetadata.ogImage) images.push(scrapedMetadata.ogImage);
  if (scrapedMetadata.twitterImage) images.push(scrapedMetadata.twitterImage);

  const mainImage =
    scrapedMetadata.ogImage || scrapedMetadata.twitterImage || scrapedMetadata.image;

  const metadata = await prisma.linkMetadata.create({
    data: {
      url: inputUrl,
      mainImage,
      title: scrapedMetadata.title,
      description: scrapedMetadata.description,
      keywords: scrapedMetadata.keywords,
      images,
      author: scrapedMetadata.author,
      publisher: scrapedMetadata.publisher,
      publishedTime: scrapedMetadata.publishedTime,
      copyright: scrapedMetadata.copyright,
      favicon: scrapedMetadata.favicon,
      video: scrapedMetadata.video,
      type: scrapedMetadata.type,
      category: scrapedMetadata.category,
      tags: scrapedMetadata.tags,
      language: scrapedMetadata.language,
      location: scrapedMetadata.location,
      robots: scrapedMetadata.robots,
      // all data
      raw: scrapedMetadata,
    },
  });

  return metadata;
}
