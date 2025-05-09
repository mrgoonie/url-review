import { Polar } from "@polar-sh/sdk";

import { IsProd } from "@/config";
import { env } from "@/env";

export const cancelReasons = [
  "too_expensive",
  "missing_features",
  "switched_service",
  "unused",
  "customer_service",
  "low_quality",
  "too_complex",
  "other",
] as const;
export type CancelReason = (typeof cancelReasons)[number];

// eslint-disable-next-line @typescript-eslint/no-use-before-define
export let polar: Polar = initPolar();

export function initPolar() {
  const _polar = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: IsProd() ? "production" : "sandbox",
    timeoutMs: 10000,
  });
  return _polar;
}

export async function listPolarProducts() {
  return polar.products.list(
    {
      organizationId: env.POLAR_ORGANIZATION_ID,
      isArchived: false,
      limit: 100,
    },
    {
      fetchOptions: { cache: "no-cache" },
    }
  );
}

export async function cancelPolarSubscription(
  polarSubscriptionId: string,
  options?: { reason?: CancelReason; immediately?: boolean }
) {
  if (options?.immediately) {
    await polar.subscriptions.revoke(
      {
        id: polarSubscriptionId,
      },
      { fetchOptions: { cache: "no-cache" } }
    );
    return;
  }

  const result = await polar.subscriptions.update(
    {
      id: polarSubscriptionId,
      subscriptionUpdate: {
        cancelAtPeriodEnd: true,
        customerCancellationReason: options?.reason || "other",
      },
    },
    { fetchOptions: { cache: "no-cache" } }
  );

  return result;
}
