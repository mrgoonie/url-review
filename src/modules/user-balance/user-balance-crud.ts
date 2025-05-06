import { CashType } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function createUserBalance(userId: string) {
  const userBalance = await prisma.userBalance.create({
    data: { userId, cashType: CashType.CREDITS, balance: 0 },
  });
  return userBalance;
}

export async function getUserBalance(userId: string) {
  let userBalance = await prisma.userBalance.findFirst({
    where: { userId },
  });
  if (!userBalance) userBalance = await createUserBalance(userId);
  return userBalance;
}

export async function addCreditsToUserBalance(userId: string, amount: number) {
  let userBalance = await getUserBalance(userId);
  userBalance.balance += amount;
  const updatedUserBalance = await prisma.userBalance.update({
    where: { id: userBalance.id },
    data: { balance: userBalance.balance },
  });
  return updatedUserBalance;
}
