import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";

export const WebUrlCreateDataSchema = z.object({
  url: z.string().url(), // Changed from destinationUrl to match Prisma schema
  thumbnailUrl: z.string().optional(),
  meta: z.record(z.any()).optional(), // Using Json type from Prisma schema
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  categories: z.array(z.string()).optional(), // For WebUrlCategory relationship
});

export type WebUrlCreateData = z.infer<typeof WebUrlCreateDataSchema>;

export async function createWebUrl(input: WebUrlCreateData) {
  // validate input
  const validatedInput = WebUrlCreateDataSchema.parse(input);

  // Handle categories separately if provided
  const { categories, ...webUrlData } = validatedInput;

  return prisma.webUrl.create({
    data: {
      ...webUrlData,
      ...(categories && {
        categories: {
          create: categories.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      }),
    },
  });
}

export async function updateWebUrl(
  id: string,
  data: Partial<WebUrlCreateData>,
  options?: { include?: Prisma.WebUrlInclude }
) {
  const validatedInput = WebUrlCreateDataSchema.partial().parse(data);

  const { categories, ...webUrlData } = validatedInput;

  return prisma.webUrl.update({
    where: { id },
    data: {
      ...webUrlData,
      ...(categories && {
        categories: {
          deleteMany: {}, // Remove existing categories
          create: categories.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      }),
    },
    include: options?.include,
  });
}

export async function deleteWebUrl(id: string) {
  return prisma.webUrl.delete({ where: { id } });
}
