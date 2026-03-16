import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";

import { pageRouter } from "./router";

pageRouter.get("/login", (_, res) => {
  if (res.locals.session) return res.redirect("/");
  return res.render("master", {
    page: "pages/login",
    clientEnv,
    site_name: AppConfig.siteName,
    page_name: "Login",
    path_name: "/login",
  });
});
