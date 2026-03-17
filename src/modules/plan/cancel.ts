import { prisma } from "@/lib/db";

import { subscribe } from "./subscribe";

export async function cancel(userPlanId: string) {
  const userPlan = await prisma.userPlan.findUnique({ where: { id: userPlanId } });
  if (!userPlan) {
    throw new Error("User plan not found");
  }

  // subscribe to free plan
  const plans = await prisma.plan.findMany();
  const freePlan = plans.find((plan) => plan.name === "Free");
  if (!freePlan) throw new Error("Free plan not found");

  const userCurrentPlan = await subscribe(userPlan.userId, freePlan.id);
  return userCurrentPlan;
}
