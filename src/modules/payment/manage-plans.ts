import type { Prisma } from "@prisma/client";
import { PlanStatus, PlanType, UserPlanRecurring, UserPlanStatus } from "@prisma/client";

import { env } from "@/env";
import { prisma } from "@/lib/db";
import { cancelPolarSubscription, initPolar } from "@/lib/payment/polar";
import { makeSlug } from "@/lib/utils";

/**
 * Create initial plans in database
 * @returns
 */
export async function createInitialPlans() {
  try {
    // Only initialize if not already initialized
    const polar = initPolar();
    // console.log(`Create initial plans...`);

    // Try to get products from Polar with retries
    let retries = 3;
    let result;

    while (retries > 0) {
      try {
        // console.log(`[${retries}] Fetching products from Polar...`);
        const response = await polar.products.list(
          {
            organizationId: env.POLAR_ORGANIZATION_ID,
            isArchived: false,
          },
          { fetchOptions: { cache: "no-cache" } }
        );
        result = response.result;
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`Failed to fetch Polar products, retrying... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }

    if (!result?.items?.length) {
      console.warn("No products found in Polar");
      return;
    }

    // console.log(
    //   `POLAR Products:`,
    //   result.items.map((item) => item.name)
    // );

    // create plans in database (if not exists)
    const plans: Prisma.PlanCreateInput[] = result.items.map((product) => {
      // Extract prices based on product's recurring status and price amount type
      const prices = product.isRecurring
        ? product.prices.filter((price) => price.amountType === "fixed")
        : product.prices.filter(
            (price) => price.amountType === "fixed" || price.amountType === "custom"
          );

      // Get the first valid price ID and amount
      const firstPrice = prices[0];
      const priceId = firstPrice?.id;
      const price = firstPrice?.amountType === "fixed" ? firstPrice?.priceAmount : null;

      let type: PlanType = PlanType.MONTHLY;
      let maxRequestsPerMinute = 0;
      let maxRequestsPerMonth = 0;

      if (product.name === "Free") {
        maxRequestsPerMinute = 5;
        maxRequestsPerMonth = 100;
        type = PlanType.ONE_TIME;
      } else if (product.name === "Pay As You Go") {
        maxRequestsPerMinute = 999999999;
        maxRequestsPerMonth = 999999999;
        type = PlanType.ONE_TIME;
      } else if (product.name === "Starter") {
        maxRequestsPerMinute = 600;
        maxRequestsPerMonth = 500_000;
      } else if (product.name === "Pro") {
        maxRequestsPerMinute = 3000;
        maxRequestsPerMonth = 1_000_000;
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        slug: makeSlug(product.name),
        price: price ?? 0,
        type,
        maxRequestsPerMinute,
        maxRequestsPerMonth,
        polarPriceId: priceId,
        polarProductId: product.id,
        currency: "USD",
        benefits: product.benefits.map((benefit) => benefit.description),
      };
    });

    // upsert plans into database to avoid duplicates
    const upsertPromises = plans.map((plan) =>
      prisma.plan.upsert({
        where: {
          slug: plan.slug,
        },
        update: plan,
        create: plan,
      })
    );

    const allPlans = await Promise.all(upsertPromises);
    console.log(`✅ Updated ${allPlans.length} initial plans.`);
    return allPlans;
  } catch (error) {
    console.error("Failed to create initial plans:", error);
    // Don't exit process, just log the error
    return;
  }
}

export async function getAvailablePricingPlans() {
  const plans = await prisma.plan.findMany({
    where: {
      status: PlanStatus.ACTIVE,
    },
  });
  return plans.sort((a, b) => a.price - b.price);
}

/**
 * Create initial user plan for user
 * @param userId
 * @returns
 */
export async function createInitialUserPlan(userId: string) {
  console.log(`[createInitialUserPlan] userId :>>`, userId);
  // get initial plan
  const name = "Free";
  const initialUserPlan = await prisma.plan.findFirst({
    where: { name },
  });
  // console.log(`[createInitialUserPlan] initialUserPlan :>>`, initialUserPlan);
  if (!initialUserPlan) throw new Error(`${name} plan not found`);

  // check if this user doesn't have any plan
  // name should be one of the initial plans: "Pay As You Go", "Starter", "Amplifier", "Dominance
  const existingUserPlan = await prisma.userPlan.findFirst({
    where: {
      userId,
      recurring: UserPlanRecurring.MONTHLY,
      Plan: { name: { in: ["Free", "Pay As You Go", "Starter", "Pro"] } },
    },
  });
  // console.log(`[createInitialUserPlan] existingUserPlan :>>`, existingUserPlan);
  if (existingUserPlan) return existingUserPlan;

  // create user plan
  const userPlan = await prisma.userPlan.create({
    data: {
      userId,
      planId: initialUserPlan.id,
      status: UserPlanStatus.ACTIVE,
      maxRequestsPerMinute: initialUserPlan.maxRequestsPerMinute,
      maxRequestsPerMonth: initialUserPlan.maxRequestsPerMonth,
    },
  });

  // OFFER: add $5 to the balance for free trial (will remove in the future)
  // addCreditsToUserBalance(userId, 5);

  return userPlan;
}

export async function syncUserPlans() {
  const userPlans = await prisma.userPlan.findMany({
    include: {
      user: true,
      Plan: true,
    },
  });
  return userPlans;
}

export async function getUserPlanLimits(userId: string) {
  // get all active user plans
  const userPlans = await prisma.userPlan.findMany({
    where: { userId, status: UserPlanStatus.ACTIVE },
    include: { Plan: true },
  });

  // max user requests per minute
  const maxRequestsPerMinute = userPlans.reduce(
    (acc, userPlan) => acc + (userPlan.Plan?.maxRequestsPerMinute ?? 0),
    0
  );
  // max user requests per month
  const maxRequestsPerMonth = userPlans.reduce(
    (acc, userPlan) => acc + (userPlan.Plan?.maxRequestsPerMonth ?? 0),
    0
  );

  return { maxRequestsPerMinute, maxRequestsPerMonth };
}

export async function cancelUserPlanByPolarSubscriptionId(polarSubscriptionId: string) {
  const userPlan = await prisma.userPlan.findFirst({
    where: { polarSubscriptionId },
  });

  if (!userPlan)
    throw new Error(`User plan with polarSubscriptionId ${polarSubscriptionId} not found`);
  if (!userPlan.polarSubscriptionId)
    throw new Error(`User plan with id ${userPlan.id} has no polar subscription id`);

  // update user plan in database
  const updatedUserPlan = await prisma.userPlan.update({
    where: { id: userPlan.id },
    data: { status: UserPlanStatus.INACTIVE },
  });

  return updatedUserPlan;
}

export async function cancelAllUserPlansByPolarSubscriptionIds(polarSubscriptionIds: string[]) {
  const cancelPromises = polarSubscriptionIds.map((polarSubscriptionId) =>
    cancelUserPlanByPolarSubscriptionId(polarSubscriptionId)
  );
  const results = await Promise.all(cancelPromises);
  return results;
}

export async function cancelUserPlanById(userPlanId: string) {
  const userPlan = await prisma.userPlan.findUnique({
    where: { id: userPlanId },
  });
  if (!userPlan) throw new Error(`User plan with id ${userPlanId} not found`);

  if (userPlan.polarSubscriptionId) {
    await cancelPolarSubscription(userPlan.polarSubscriptionId);
  }

  // update user plan in database
  const updatedUserPlan = await prisma.userPlan.update({
    where: { id: userPlan.id },
    data: { status: UserPlanStatus.INACTIVE },
    select: { id: true, polarSubscriptionId: true, userId: true },
  });

  return updatedUserPlan;
}

export async function cancelAllPolarSubscriptions(userId: string) {
  const userPlans = await prisma.userPlan.findMany({
    where: { userId, status: UserPlanStatus.ACTIVE, Plan: { type: PlanType.MONTHLY } },
    select: { polarSubscriptionId: true },
  });
  const cancelPromises = userPlans.map((userPlan) =>
    userPlan.polarSubscriptionId ? cancelPolarSubscription(userPlan.polarSubscriptionId) : null
  );
  const results = await Promise.all(cancelPromises);
  return results;
}

export async function createUserPlan(
  userId: string,
  polarProductId: string,
  polarSubscriptionId: string
) {
  // find the plan
  const plan = await prisma.plan.findFirst({
    where: { polarProductId },
  });

  if (!plan) throw new Error(`Plan with polarProductId "${polarProductId}" not found`);

  // deactivate previous plan (on polar and in database)
  const previousUserPlans = await prisma.userPlan.findMany({
    where: {
      userId,
      status: UserPlanStatus.ACTIVE,
      // Plan: { type: { in: [PlanType.FREE, PlanType.MONTHLY, PlanType.ONE_TIME] } },
    },
    select: { id: true, polarSubscriptionId: true },
  });

  const cancelUserPlanPromises = previousUserPlans.map((userPlan) =>
    cancelUserPlanById(userPlan.id).catch(() => null)
  );
  const results = await Promise.all(cancelUserPlanPromises);
  console.log(`[Deactivate previous user plans] results :>>`, results);

  // create user plan
  const newUserPlan = await prisma.userPlan.create({
    data: {
      userId,
      planId: plan.id,
      polarSubscriptionId,
      maxRequestsPerMinute: plan.maxRequestsPerMinute,
      maxRequestsPerMonth: plan.maxRequestsPerMonth,
    },
    include: { user: true, Plan: true },
  });

  // notify new user plan created
  // notifyNewUserPlanCreated(newUserPlan).catch((error) => {
  //   console.error(`[createUserPlan] notifyNewUserPlanCreated error :>>`, error);
  // });

  return newUserPlan;
}

export async function getUserPlanByUserId(userId: string) {
  console.log(`[getUserPlanByUserId] userId :>>`, userId);
  const userPlan = await prisma.userPlan.findFirst({
    where: { userId, status: UserPlanStatus.ACTIVE },
    include: { Plan: true },
    orderBy: { createdAt: "desc" },
  });

  // if user doesn't have any plan, create one
  if (!userPlan) {
    const newUserPlan = await createInitialUserPlan(userId);
    return newUserPlan;
  }
  return userPlan;
}

export async function allUserPlansByUserId(userId: string) {
  const userPlans = await prisma.userPlan.findMany({
    where: { userId },
    include: { Plan: true },
    orderBy: { createdAt: "desc" },
  });
  return userPlans;
}

export async function allActiveUserPlansByUserId(userId: string) {
  const userPlans = await prisma.userPlan.findMany({
    where: { userId, status: UserPlanStatus.ACTIVE },
    include: { Plan: true },
    orderBy: { createdAt: "desc" },
  });
  return userPlans;
}

export async function allRecurringUserPlansByUserId(userId: string) {
  const userPlans = await prisma.userPlan.findMany({
    where: {
      userId,
      status: UserPlanStatus.ACTIVE,
      recurring: { in: [UserPlanRecurring.MONTHLY, UserPlanRecurring.YEARLY] },
    },
    include: { Plan: true },
    orderBy: { createdAt: "desc" },
  });
  return userPlans;
}

export async function allOneTimeUserPlansByUserId(userId: string) {
  const userPlans = await prisma.userPlan.findMany({
    where: {
      userId,
      status: UserPlanStatus.ACTIVE,
      recurring: UserPlanRecurring.ONE_TIME,
    },
    include: { Plan: true },
    orderBy: { createdAt: "desc" },
  });
  return userPlans;
}

export async function cancelUserPlan(userPlanId: string, options?: { debug?: boolean }) {
  const userPlan = await prisma.userPlan.findUnique({
    where: { id: userPlanId },
  });

  if (!userPlan) throw new Error(`User plan with id ${userPlanId} not found`);
  if (!userPlan.polarSubscriptionId)
    throw new Error(`User plan with id ${userPlanId} has no polar subscription id`);

  // cancel user plan in Polar
  const result = await cancelPolarSubscription(userPlan.polarSubscriptionId);
  if (options?.debug) console.log(`cancelUserPlan () > result :>>`, result);

  // update user plan in database
  const updatedUserPlan = await prisma.userPlan.update({
    where: { id: userPlanId },
    data: { status: UserPlanStatus.INACTIVE },
  });

  return updatedUserPlan;
}
