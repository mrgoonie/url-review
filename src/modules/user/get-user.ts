import { prisma } from "@/lib/db";

export const getUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      activeWorkspace: true,
    },
  });
  return user;
};
