import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { prisma } from "@/lib/db";

import { pageRouter } from "./router";

// Display scan result
pageRouter.get("/scan/:scanId", async (req, res, next) => {
  try {
    const { scanId } = req.params;
    const userId = res.locals["userId"];

    if (!scanId) {
      return res.status(400).render("pages/error", {
        error: "Scan ID is required",
      });
    }

    const scanResult = await prisma.scanLinkResult.findUnique({
      where: {
        id: scanId,
      },
    });
    console.log("Scan result :>>", JSON.stringify(scanResult, null, 2));

    if (!scanResult) {
      return res.status(404).render("pages/error", {
        error: "Scan result not found",
      });
    }

    const { statusCodes } = scanResult;

    const validLinks = statusCodes.filter((statusCode: number) => statusCode === 200).length;
    const brokenLinks = statusCodes.filter((statusCode: number) => statusCode !== 200).length;

    return res.render("master", {
      page: "pages/scan",
      path_name: "/scan",
      page_name: "Scan Result",
      scanResult: { ...scanResult, validLinks, brokenLinks },
      site_name: AppConfig.siteName,
      clientEnv,
    });
  } catch (error) {
    console.error("scan.ts > GET /:scanId > Error :>>", error);
    return res.status(500).render("pages/error", {
      error: "Failed to fetch scan result",
    });
  }
});
