import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { prisma } from "@/lib/db";
import { getCategories } from "@/modules/category";
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

  const categories = await getCategories();

  return res.render("master", {
    page: "pages/home",
    site_name: AppConfig.siteName,
    page_name: "Home",
    path_name: "/",
    clientEnv,
    user: user ? maskUser(user) : null,
    categories,
  });
});
