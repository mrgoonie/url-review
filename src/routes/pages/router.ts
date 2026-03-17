import express from "express";

import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";

/**
 * Router for pages
 */
export const pageRouter = express.Router();

pageRouter.get("/404", (_, res) => {
  res.status(404).render("master", {
    page: "pages/404",
    site_name: AppConfig.siteName,
    page_name: "Page not found",
    clientEnv,
  });
});
