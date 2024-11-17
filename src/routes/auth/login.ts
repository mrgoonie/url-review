import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";

import { githubLoginRouter } from "./github";
import { googleLoginRouter } from "./google";
import { authRouter } from "./router";

authRouter.use(githubLoginRouter);
authRouter.use(googleLoginRouter);

authRouter.get("/login", async (_, res) => {
  if (res.locals.session) return res.redirect("/");
  return res.render("master", {
    page: "pages/login",
    clientEnv,
    site_name: AppConfig.siteName,
    page_name: "Login",
    path_name: "/login",
  });
});
