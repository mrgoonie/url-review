import { OrderStatus } from "@prisma/client";

import { clientEnv, env } from "@/env";
import { prisma } from "@/lib/db";
import { initPolar } from "@/lib/payment/polar";
import { getPlanByPolarProductId } from "@/modules/plan/plans";

import { pageRouter } from "./router";

pageRouter.get("/checkout", async (req, res, next) => {
  console.log(`Checkout page: ${req.url}`);
  const polar = initPolar();
  const url = new URL(`${env.BASE_URL}${req.url}`);
  const polarProductId = url.searchParams.get("productId") ?? "";
  const polarPriceId = url.searchParams.get("priceId") ?? "";
  const userId = url.searchParams.get("userId") ?? "";

  // validate
  if (!polarProductId || !polarPriceId || !userId) {
    return res.redirect("/404");
  }

  // success url
  const successUrl = `${env.BASE_URL}/checkout/confirmation?checkout_id={CHECKOUT_ID}`;
  console.log("successUrl :>> ", successUrl);

  try {
    // Get plan details
    const plan = await getPlanByPolarProductId(polarProductId);
    if (!plan) throw new Error("Plan not found");

    // create an order in our database
    const order = await prisma.order.create({
      data: {
        userId,
        total: plan.price,
        status: OrderStatus.UNPAID,
        polarProductId,
        polarPriceId,
      },
    });

    // create a checkout url
    const result = await polar.checkouts.create(
      {
        products: [polarProductId],
        successUrl,
        allowDiscountCodes: true,
        metadata: {
          userId,
          orderId: order.id,
        },
      },
      { fetchOptions: { cache: "no-cache" } }
    );

    // update the order with the checkout id
    await prisma.order.update({
      where: { id: order.id },
      data: { polarCheckoutId: result.id },
    });

    // redirect to the checkout url
    return res.redirect(result.url);
  } catch (error) {
    return next(error);
  }
});

pageRouter.get("/checkout/confirmation", async (_req, res) => {
  const user = res.locals["user"]
    ? await prisma.user.findUnique({
        where: { id: res.locals["user"].id },
      })
    : null;

  return res.render("master", {
    page: "pages/checkout-confirmation",
    site_name: env.SITE_NAME,
    page_name: "Checkout Confirmation",
    path_name: "/checkout/confirmation",
    clientEnv,
    user,
  });
});
