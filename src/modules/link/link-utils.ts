import { prisma } from "@/lib/db";
import { generateRandomString } from "@/lib/utils";

export async function makeUniqueRandomLinkPath(options: { atempt: number } = { atempt: 0 }) {
  const randomLength = 6 + Math.floor(Math.random() * 4);
  const path = generateRandomString(randomLength);

  const uniquePath = await prisma.link.findUnique({ where: { path } });

  if (uniquePath) {
    options.atempt++;
    return makeUniqueRandomLinkPath({ ...options, atempt: options.atempt });
  }

  return path;
}

export async function isLinkPathExist(path: string) {
  const count = await prisma.link.count({ where: { path } });
  return count > 0;
}
