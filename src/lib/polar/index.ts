import { Polar } from "@polar-sh/sdk";
import type { Organization } from "@polar-sh/sdk/models/components";
import axios from "axios";
import { createHash } from "crypto";

import { env } from "@/env";

export const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.NODE_ENV === "production" ? "production" : "sandbox",
});

export let polarStore: Organization;

export async function currentStore() {
  if (!polarStore) polarStore = await getPolarOrg(env.POLAR_ORGANIZATION_ID);
  return polarStore;
}

export async function getPolarOrganizations() {
  const organizations = await polar.organizations.list({});
  return organizations.result.items;
}

export async function getPolarOrg(id: string) {
  const organization = await polar.organizations.get({ id });
  return organization;
}

export async function getPolarProducts() {
  const organization = await currentStore();
  const products = await polar.products.list({
    organizationId: organization.id,
    isArchived: false,
    isRecurring: true,
  });
  return products.result.items;
}

export async function getPolarOfficialProduct(id: string) {
  const product = await polar.products.get({ id });
  console.log(`product :>>`, product);
  return product;
}

export async function getPolarProduct(id: string) {
  // const product = await polar.products.get({
  //   id: productId,
  // });

  const products = await getPolarProducts();
  const product = products.find((product) => product.id === id);
  return product;
}

export async function verifyCheckoutToken(token: string, options: { userId?: string }) {
  const appSecret = env.POLAR_SECRET;
  const checkoutTokenContent = options.userId ? `${options.userId}:${appSecret}` : appSecret;
  const checkoutToken = createHash("sha256").update(checkoutTokenContent).digest("hex");
  return token === checkoutToken;
}

export async function createCheckhoutUrl(
  productId: string,
  options: {
    userId?: string;
    userEmail?: string;
    successUrl: string;
    params?: Record<string, string>;
    debug?: boolean;
  }
) {
  const product = await getPolarProduct(productId);
  console.log(`product :>>`, product);

  // Checkout requires a Price ID vs. Product
  // We should improve the DX here either by:
  // 1. Make it easy to copy Price vs. Product ID in dashboard
  // 2. Allow passing Product ID to Checkout (throw error in case product has more
  // than one price)
  const firstPrice = product?.prices[0];
  console.log(`firstPrice :>>`, firstPrice);
  // Create a hash to verify it later to avoid tampering
  const appSecret = env.POLAR_SECRET;
  const checkoutTokenContent = options.userId ? `${options.userId}:${appSecret}` : appSecret;
  const checkoutToken = createHash("sha256").update(checkoutTokenContent).digest("hex");

  const successUrl = new URL(options.successUrl);
  if (options.userId) successUrl.searchParams.append("user_id", options.userId);
  successUrl.searchParams.append("token", checkoutToken);

  // Append additional params
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      successUrl.searchParams.append(key, value);
    }
  }

  // Create the checkout url
  const checkoutURL = await polar.checkouts.create({
    customerEmail: options.userEmail || "",
    productPriceId: firstPrice?.id || "",
    successUrl: successUrl.toString(),
  });
  const checkoutId = checkoutURL.id;
  console.log(`checkoutURL :>>`, checkoutURL);
  console.log(`checkoutId :>>`, checkoutId);
  return checkoutURL.url;
}

export async function getPolarCheckout(checkoutId: string) {
  const checkout = await polar.checkouts.get({ id: checkoutId });
  return checkout;
}

export async function getPolarSubscriptions() {
  const organization = await currentStore();
  const subscriptions = await polar.subscriptions.list({
    organizationId: organization.id,
  });
  return subscriptions.result.items;
}

export async function getPolarUserSubscriptions(polarUserId: string) {
  const organization = await currentStore();
  const subscriptions = await polar.users.subscriptions.list({
    organizationId: organization.id,
    query: `user_id:${polarUserId}`,
  });
  return subscriptions.result.items;
}

export async function cancelAllPolarSubscriptions(polarUserId: string) {
  const subscriptions = await getPolarUserSubscriptions(polarUserId);
  for (const subscription of subscriptions) {
    await polar.users.subscriptions.cancel({ id: subscription.id });
  }
}

export async function cancelProductSubscription(userId: string, productId: string) {
  const product = await getPolarProduct(productId);
}
