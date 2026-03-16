import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { validateSession, verifyRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAvailablePricingPlans, getUserPlanByUserId } from "@/modules/payment";
import { getUser, maskUser } from "@/modules/user";

import { pageRouter } from "./router";

dayjs.extend(localizedFormat);

pageRouter.get("/profile", verifyRequest, validateSession, async (_req, res) => {
  const lang = res.locals.lang || "en";
  if (!res.locals.user) return res.redirect(`/${lang}/login`);
  const { id } = res.locals.user;
  const user = await getUser(id);
  if (!user) return res.redirect(`/${lang}/login?redirect_uri=/${lang}/profile`);

  // Fetch all API keys for the user
  const apiKeys = await prisma.apiKey
    .findMany({
      where: {
        userId: user.id,
      },
    })
    .then((apiKeys) =>
      apiKeys.map((apiKey) => ({
        ...apiKey,
        displayCreatedAt: dayjs(apiKey.createdAt).format("lll"),
      }))
    )
    .catch((error) => {
      console.error("Error fetching API keys:", error);
      return [];
    });

  const plans = await getAvailablePricingPlans();
  plans.forEach((plan) => {
    plan.checkoutUrl = `/${lang}/checkout?productId=${plan.polarProductId}&priceId=${plan.polarPriceId}&userId=${user.id}`;
  });
  const userPlan = await getUserPlanByUserId(user.id);

  return res.render("master", {
    page: "pages/profile",
    path_name: "/profile",
    page_name: "Profile",
    site_name: AppConfig.siteName,
    clientEnv,
    apiKeys,
    user: user ? maskUser(user) : null,
    userPlan,
    plans,
  });
});
