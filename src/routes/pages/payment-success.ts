import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maskUser } from "@/modules/user";

import { pageRouter } from "./router";

pageRouter.get("/payment-success", validateSession, async (_req, res) => {
  console.log(`res.locals :>>`, res.locals);
  const user = res.locals["user"]
    ? await prisma.user.findUnique({
        where: { id: res.locals["user"].id },
        include: {
          activeWorkspace: true,
        },
      })
    : null;
  // if (!user) return res.redirect("/login");
  console.log(`user :>>`, user);

  return res.render("master", {
    page: "pages/payment-success",
    path_name: "/payment-success",
    site_name: AppConfig.siteName,
    page_name: "Payment Success",
    headerEnabled: true,
    footerEnabled: true,
    clientEnv,
    user: user ? maskUser(user) : null,
  });
});
