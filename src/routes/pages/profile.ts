import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

import AppConfig from "@/config/AppConfig";
import { clientEnv, env } from "@/env";
import { validateSession, verifyRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { polar } from "@/lib/polar";
import { POLAR_PRODUCT_PRICE_ID } from "@/modules/products";
import { getUser, maskUser } from "@/modules/user";

import { pageRouter } from "./router";

dayjs.extend(localizedFormat);

pageRouter.get("/profile", verifyRequest, validateSession, async (_req, res) => {
  if (!res.locals.user) return res.redirect("/login");
  const { id } = res.locals.user;
  const user = await getUser(id);
  if (!user) return res.redirect("/login?redirect_uri=/profile");

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

  // Create/get Polar Checkout URL
  const polarCheckoutUrl = await polar.checkouts.custom
    .create({
      productPriceId: POLAR_PRODUCT_PRICE_ID,
      successUrl: `${env.BASE_URL}/payment-success?user_id=${user.id}`,
      metadata: {
        user_id: user.id,
      },
    })
    .then(({ url }) => url);
  console.log(`polarCheckoutUrl :>>`, polarCheckoutUrl);

  return res.render("master-dashboard", {
    page: "pages/profile",
    path_name: "/profile",
    page_name: "Profile",
    site_name: AppConfig.siteName,
    clientEnv,
    apiKeys,
    user: user ? maskUser(user) : null,
    polarCheckoutUrl,
  });
});