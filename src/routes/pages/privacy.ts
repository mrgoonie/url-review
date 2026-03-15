import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";

import { pageRouter } from "./router";

pageRouter.get("/privacy", (_, res) => {
  return res.render("master", {
    page: "pages/privacy",
    path_name: "/privacy",
    page_name: "Privacy Policy",
    site_name: AppConfig.siteName,
    clientEnv,
  });
});
