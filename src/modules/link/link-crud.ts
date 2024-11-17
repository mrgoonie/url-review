import type { Prisma } from "@prisma/client";
import { LinkStatus } from "@prisma/client";
import { z } from "zod";

import { env } from "@/env";
import { prisma } from "@/lib/db";

import { createLinkMetadata } from "../metadata";
import { createQRCode } from "../qrcode";
import { createThumbnailByWebUrl } from "../thumbnail";
import { isLinkPathExist, makeUniqueRandomLinkPath } from "./link-utils";

export const LinkCreateDataSchema = z.object({
  destinationUrl: z.string(),
  name: z.string().optional(),
  path: z.string().optional(),
  password: z.string().optional(),
  status: z.nativeEnum(LinkStatus).optional(),
  expiresAt: z.string().optional(),
  userId: z.string().optional(),
  metadataId: z.string().optional(),
  demoThumbnails: z.array(z.string()).optional(),
});

export type LinkCreateData = z.infer<typeof LinkCreateDataSchema>;

export const LinkUpdateDataSchema = LinkCreateDataSchema.omit({
  userId: true,
})
  .extend({
    customMetadataId: z.string().optional(),
    demoThumbnails: z.array(z.string()).optional(),
    url: z.string(),
  })
  .partial();

export type LinkUpdateData = z.infer<typeof LinkUpdateDataSchema>;

export const LinkMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string(),
});

export type LinkMetadata = z.infer<typeof LinkMetadataSchema>;

// Add this custom error class at the beginning of the file
export class LinkCreationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "LinkCreationError";
  }
}

export async function createLink(input: LinkCreateData, options?: { optOutTracking?: boolean }) {
  let path: string | undefined;

  if (input.path) {
    path = input.path;
    if (await isLinkPathExist(path))
      throw new LinkCreationError("This path already exists", "PATH_EXISTS");
  } else {
    path = await makeUniqueRandomLinkPath({ atempt: 0 });
  }
  console.log("link-crud.ts > createLink() > path :>>", path);

  const user = input.userId
    ? await prisma.user.findUnique({
        where: { id: input.userId },
        include: { activeWorkspace: true },
      })
    : null;

  // create qr code
  const [qrCode, linkMetadata] = await Promise.all([
    createQRCode(
      input.destinationUrl,
      {
        skipRedirection: options?.optOutTracking,
      },
      {
        userId: user?.id,
        workspaceId: user?.activeWorkspace?.id,
      }
    )
      .then((result) => result ?? null)
      .catch((error) => {
        console.error(`createQRCode() > error :>>`, error);
        return null;
      }),
    createLinkMetadata(input.destinationUrl)
      .then((result) => result ?? null)
      .catch((error) => {
        console.error(`createLinkMetadata() > error :>>`, error);
        return null;
      }),
  ]);

  // generate demo thumbnails
  // const demoThumbnails = await Promise.all(
  //   [null, null, null].map(() =>
  //     createWithTemplate(input.destinationUrl, {
  //       template: "share-template-01-random",
  //       metadata: linkMetadata || {},
  //       device: "desktop",
  //     })
  //   )
  // )
  //   .then((results) => results.map((t) => t?.shareImageUrl ?? null))
  //   .then((results) => results.filter((t) => t !== null));

  // create link in db
  const data = LinkCreateDataSchema.omit({
    name: true,
    path: true,
  })
    .extend({
      name: z.string(),
      url: z.string(),
      path: z
        .string()
        .min(user?.isPremium ? 2 : 6) // <-- if user is premium, path can be as short as 2 characters, otherwise 6
        .max(20),
      workspaceId: z.string().optional(),
      qrCodeId: z.string().optional(),
    })
    .parse({
      ...input,
      path,
      name: input.name ?? path,
      url: `${env.BASE_URL}/${path}`,
      workspaceId: user?.activeWorkspace?.id,
      qrCodeId: qrCode?.id,
      metadataId: linkMetadata?.id,
      // demoThumbnails,
    });

  return prisma.link.create({ data, include: { qrCode: true } });
}

export async function updateLink(
  id: string,
  data: LinkUpdateData,
  options?: { include?: Prisma.LinkInclude }
) {
  if (data.path) {
    if (await isLinkPathExist(data.path))
      throw new LinkCreationError("This path already exists", "PATH_EXISTS");
    data.url = `${env.BASE_URL}/${data.path}`;
  }
  return prisma.link.update({ where: { id }, data, include: options?.include });
}

export async function deleteLink(id: string) {
  return prisma.link.delete({ where: { id } });
}

export async function updateLinkMetadata(linkId: string, data: LinkMetadata) {
  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link || !link.metadataId) throw new LinkCreationError("Link not found", "LINK_NOT_FOUND");

  const metadata = await prisma.linkMetadata.findUnique({ where: { id: link.metadataId } });
  if (!metadata) throw new LinkCreationError("Metadata not found", "METADATA_NOT_FOUND");

  return prisma.linkMetadata.update({ where: { id: metadata?.id }, data });
}
