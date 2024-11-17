import type { User } from "@prisma/client";

export type MaskedUser = Omit<User, "password" | "validEmail" | "createdAt" | "updatedAt">;

export function maskUser(user: User): MaskedUser {
  const { password, validEmail, createdAt, updatedAt, ...sanitizedUser } = user;
  return sanitizedUser;
}
