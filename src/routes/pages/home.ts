import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { prisma } from "@/lib/db";
import { getGroupAds } from "@/modules/group-ads";
import { getCategories } from "@/modules/products";
import { maskUser } from "@/modules/user";

import { pageRouter } from "./router";

pageRouter.get("/", async (_req, res) => {
  const user = res.locals["user"]
    ? await prisma.user.findUnique({
        where: { id: res.locals["user"].id },
        include: {
          activeWorkspace: true,
        },
      })
    : null;
  // console.log(`user :>>`, user);

  const { list: groupAds } = await getGroupAds({}, { page: 1, limit: 10 });
  const categories = await getCategories();

  return res.render("master", {
    page: "pages/home",
    site_name: AppConfig.siteName,
    page_name: "Home",
    path_name: "/",
    clientEnv,
    user: user ? maskUser(user) : null,
    groupAds,
    categories,
  });
});
