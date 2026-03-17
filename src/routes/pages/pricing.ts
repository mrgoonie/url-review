import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { validateSession, verifyRequest } from "@/lib/auth";
import { getAvailablePricingPlans } from "@/modules/payment";
import { getUser, maskUser } from "@/modules/user";

import { pageRouter } from "./router";

dayjs.extend(localizedFormat);

pageRouter.get("/pricing", verifyRequest, validateSession, async (_req, res) => {
  const { id } = res.locals.user || {};
  const user = id ? await getUser(id) : null;

  const plans = await getAvailablePricingPlans();
  plans.forEach((plan) => {
    plan.checkoutUrl = user
      ? `/checkout?productId=${plan.polarProductId}&priceId=${plan.polarPriceId}&userId=${user?.id}`
      : `/login?redirect_uri=/pricing`;
  });

  return res.render("master", {
    page: "pages/pricing",
    path_name: "/pricing",
    page_name: "Pricing",
    site_name: AppConfig.siteName,
    clientEnv,
    user: user ? maskUser(user) : null,
    plans,
  });
});
