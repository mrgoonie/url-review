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
  features: Feature[];
  polarId: string;
  checkoutUrl?: string;
};

export const features = [
  "video",
  "audio",
  "video:hd",
  "audio:hd",
  "video:4k",
  "screenshot",
  "summary",
  "transcription",
  "translation",
  "article",
] as const;
export type Feature = (typeof features)[number];

export const initialPlans: LocalPlan[] = [
  {
    name: "Free",
    description: "Free plan",
    type: "FREE",
    price: 0,
    maxRequestPerMinute: 5,
    maxRequestPerMonth: 1000,
    features: [
      //
      "video",
      "audio",
      "video:hd",
      "audio:hd",
      "video:4k",
      "transcription",
      "screenshot",
    ],
    polarId:
      env.NODE_ENV === "production"
        ? "4883560c-c418-41a8-b5e5-6b09851ac294"
        : "17c6cd3b-ca4b-49d3-802f-5c143046c7f3",
    // checkoutUrl:
    //   env.NODE_ENV === "production"
    //     ? "https://buy.polar.sh/4883560c-c418-41a8-b5e5-6b09851ac294"
    //     : "https://sandbox.polar.sh/api/checkout?price=ec416f90-2e98-4890-b140-a16d1b5c5a10",
  },
  {
    name: "Starter",
    description: "Starter plan",
    type: "PAID",
    price: 1900,
    maxRequestPerMinute: 50,
    maxRequestPerMonth: 10_000,
    features: [
      "video",
      "audio",
      "video:hd",
      "audio:hd",
      "video:4k",
      "screenshot",
      "summary",
      "transcription",
      "translation",
      "article",
    ],
    polarId:
      env.NODE_ENV === "production"
        ? "e1c19aff-3ff9-4600-b442-d847f0b863d5"
        : "225377cc-5490-4ffb-96ee-3e41b2a7ee6a",
    // checkoutUrl:
    //   env.NODE_ENV === "production"
    //     ? "https://buy.polar.sh/e1c19aff-3ff9-4600-b442-d847f0b863d5"
    //     : "https://sandbox.polar.sh/api/checkout?price=2117f210-2ee0-40ca-bb29-f55ff6ca789c",
  },
  {
    name: "Pro",
    description: "Pro plan",
    type: "PAID",
    price: 4900,
    maxRequestPerMinute: 100,
    maxRequestPerMonth: 50_000,
    features: [
      "video",
      "audio",
      "video:hd",
      "audio:hd",
      "video:4k",
      "screenshot",
      "summary",
      "transcription",
      "translation",
      "article",
    ],
    polarId:
      env.NODE_ENV === "production"
        ? "52cc3ff3-a857-478c-a978-e9d958f0f1fd"
        : "0a07982f-e50f-4d24-96bb-680617eff0a6",
    // checkoutUrl:
    //   env.NODE_ENV === "production"
    //     ? "https://buy.polar.sh/52cc3ff3-a857-478c-a978-e9d958f0f1fd"
    //     : "https://sandbox.polar.sh/api/checkout?price=7ab42214-cd01-4112-a3b2-3e8be9571d63",
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
          interval: "MONTH",
          intervalCount: 1,
          type: "PAID",
          maxRequestPerMinute: plan.maxRequestPerMinute,
          maxRequestPerMonth: plan.maxRequestPerMonth,
          features: plan.features,
          polarId: plan.polarId,
        },
        create: {
          name: plan.name,
          slug: slug,
          description: plan.description,
          price: plan.price,
          currency: "USD",
          interval: "MONTH",
          intervalCount: 1,
          type: "PAID",
          maxRequestPerMinute: plan.maxRequestPerMinute,
          maxRequestPerMonth: plan.maxRequestPerMonth,
          features: plan.features,
          polarId: plan.polarId,
        },
      });
    })
  );
  // console.log(plans);
  return plans;
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
