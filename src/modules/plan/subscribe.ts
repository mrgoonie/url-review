import { prisma } from "@/lib/db";

export async function subscribe(userId: string, planId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new Error("Plan not found");
  }

  // if current plan is the same as the new plan, do nothing
  const currentPlan = await prisma.userPlan.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (currentPlan?.planId === planId) return currentPlan;

  // deactivate current plan
  await prisma.userPlan.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  // create new user plan
  const userPlan = await prisma.userPlan.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      requestPerMinute: 0,
      requestPerMonth: 0,
    },
  });

  return userPlan;
}
