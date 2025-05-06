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
        ? "0ee8eac3-0842-42c1-a945-b5c116501b75"
        : "9a2308ba-3ae9-4732-8676-4d54182cd890",
    polarPriceId:
      env.NODE_ENV === "production"
        ? "aa6c27f5-5893-4aee-b527-a9e589d15dba"
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
        ? "59eba4d8-52ea-4222-9fa0-1b61af535ea9"
        : "bf4334ce-8148-485c-b99a-9e35f05e5bd2",
    polarPriceId:
      env.NODE_ENV === "production"
        ? "ce21a8ce-e223-41ec-b6f8-46cf543449f0"
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
        ? "4ae52356-b25b-43e1-a6ea-f9de49bf77cf"
        : "5673553a-c6b3-4d1b-9677-c953c9d2811f",
    polarPriceId:
      env.NODE_ENV === "production"
        ? "86a21f65-0dd0-42bc-b666-721403867fba"
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
