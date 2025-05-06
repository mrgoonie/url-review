import type { PlanType } from "@prisma/client";

import { env } from "@/env";
import { prisma } from "@/lib/db";
import { getPolarProducts } from "@/lib/polar";
import { makeSlug } from "@/lib/utils";

export type LocalPlan = {
  name: string;
  description: string;
  type: PlanType;
  price: number;
  maxRequestPerMinute: number;
  maxRequestPerMonth: number;
  benefits: Benefit[];
  polarProductId: string;
  polarPriceId: string;
  checkoutUrl?: string;
};

export const benefits = [
  "Analyze & review URLs",
  "Convert URL to Markdown",
  "Extract data from URLs",
  "Capture screenshot",
  "Summarize URLs",
] as const;
export type Benefit = (typeof benefits)[number];

export const initialPlans: LocalPlan[] = [
  {
    name: "Free",
    description: "Max. 5 requests per minute, 100 requests per month",
    type: "FREE",
    price: 0,
    maxRequestPerMinute: 5,
    maxRequestPerMonth: 100,
    benefits: [
      "Analyze & review URLs",
      "Convert URL to Markdown",
      "Extract data from URLs",
      "Capture screenshot",
      "Summarize URLs",
    ],
    polarProductId:
      env.NODE_ENV === "production"
        ? "b5b16ba8-4eee-4d9f-9ecc-c8d495a311e7"
        : "9a2308ba-3ae9-4732-8676-4d54182cd890",
    polarPriceId:
      env.NODE_ENV === "production"
        ? "f092333c-e508-4ac0-a787-43e3dc6efd5a"
        : "7bcc60f8-44ca-4891-903b-9a5f7c7029a4",
  },
  {
    name: "Starter",
    description: "Max. 25 requests per minute, 5,000 requests per month",
    type: "MONTHLY",
    price: 1900,
    maxRequestPerMinute: 25,
    maxRequestPerMonth: 5_000,
    benefits: [
      "Analyze & review URLs",
      "Convert URL to Markdown",
      "Extract data from URLs",
      "Capture screenshot",
      "Summarize URLs",
    ],
    polarProductId:
      env.NODE_ENV === "production"
        ? "5f86a652-6082-4684-8a09-e1cb7a1e8c9a"
        : "bf4334ce-8148-485c-b99a-9e35f05e5bd2",
    polarPriceId:
      env.NODE_ENV === "production"
        ? "eea5ea4f-b298-4d96-aa5f-9a99b888bfe8"
        : "d2a24b0e-965b-4746-958c-0f287ee3b57c",
  },
  {
    name: "Pro",
    description: "Max. 100 requests per minute, 20,000 requests per month",
    type: "MONTHLY",
    price: 4900,
    maxRequestPerMinute: 100,
    maxRequestPerMonth: 20_000,
    benefits: [
      "Analyze & review URLs",
      "Convert URL to Markdown",
      "Extract data from URLs",
      "Capture screenshot",
      "Summarize URLs",
    ],
    polarProductId:
      env.NODE_ENV === "production"
        ? "38d5ef5e-abfb-43e0-b72f-4093871ea47f"
        : "5673553a-c6b3-4d1b-9677-c953c9d2811f",
    polarPriceId:
      env.NODE_ENV === "production"
        ? "e816e32d-3514-44e0-8904-5d000dfd6c51"
        : "49b7f546-a5e7-41d4-bd60-7c77d087f80a",
  },
];

export async function createInitialPlans() {
  const plans = await Promise.all(
    initialPlans.map(async (plan) => {
      const slug = await makeSlug(plan.name);
      return await prisma.plan.upsert({
        where: { slug: slug },
        update: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: "USD",
          type: plan.type,
          maxRequestsPerMinute: plan.maxRequestPerMinute,
          maxRequestsPerMonth: plan.maxRequestPerMonth,
          benefits: plan.benefits,
          polarProductId: plan.polarProductId,
          polarPriceId: plan.polarPriceId,
        },
        create: {
          name: plan.name,
          slug: slug,
          description: plan.description,
          price: plan.price,
          currency: "USD",
          type: plan.type,
          maxRequestsPerMinute: plan.maxRequestPerMinute,
          maxRequestsPerMonth: plan.maxRequestPerMonth,
          benefits: plan.benefits,
          polarProductId: plan.polarProductId,
          polarPriceId: plan.polarPriceId,
        },
      });
    })
  );
  // console.log(plans);
  console.log(`✅ Polar: Synced ${plans.length} plans`);
  return plans.sort((a, b) => a.maxRequestsPerMonth - b.maxRequestsPerMonth);
}

export async function syncPlans() {
  const products = await getPolarProducts();
  const plans = await prisma.plan.findMany();

  // sync checkoutUrl
  plans.forEach(async (plan) => {
    const initialPlan = initialPlans.find((p) => p.name === plan.name);

    if (plan.checkoutUrl !== initialPlan?.checkoutUrl) {
      await prisma.plan.update({
        where: { id: plan.id },
        data: { checkoutUrl: initialPlan?.checkoutUrl },
      });
    }
  });

  // check product.price change -> update plan.price
  let updateCount = 0;
  for (const product of products) {
    const plan = plans.find((plan) => plan.name === product.name);
    // sync price
    if (
      product.prices[0].amountType !== "free" &&
      product.prices[0].type === "recurring" &&
      product.prices[0].amountType === "fixed"
    ) {
      if (plan && plan.name === product.name && plan.price !== product.prices[0].priceAmount) {
        await prisma.plan.update({
          where: { id: plan.id },
          data: { price: product.prices[0].priceAmount },
        });
        updateCount++;
      }
    }
  }
  console.log(`[SYNC_PLANS] Updated ${updateCount}/${products.length} plans`);
  return updateCount;
}

export async function getPlanById(id: string) {
  return await prisma.plan.findUnique({ where: { id } });
}

export async function getPlanByPolarProductId(polarProductId: string) {
  return await prisma.plan.findFirst({ where: { polarProductId } });
}
