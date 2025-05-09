import express from "express";

import { apiAiRouter } from "./api-ai";
import { apiConvertRouter } from "./api-convert";
import { apiExtractRouter } from "./api-extract";
import { apiHealthzRouter } from "./api-healthz";
import { apiKeyRouter } from "./api-key";
import { apiPaymentRouter } from "./api-payment";
import { apiProfileRouter } from "./api-profile";
import { apiReviewRouter } from "./api-review";
import { apiScrapeRouter } from "./api-scrape";
import { apiScreenshotRouter } from "./api-screenshot";
import { apiSummarizeRouter } from "./api-summarize";
import { apiUploadRouter } from "./api-upload";
import { apiUrlRouter } from "./api-url";

export const apiRouter = express.Router();

// middleware
apiRouter.use(express.json());
apiRouter.use(express.urlencoded({ extended: true }));

// routes
apiRouter.use("/api/v1/healthz", apiHealthzRouter);
apiRouter.use("/api/v1/profile", apiProfileRouter);
apiRouter.use("/api/v1/upload", apiUploadRouter);
apiRouter.use("/api/v1/api_key", apiKeyRouter);
apiRouter.use("/api/v1/payments", apiPaymentRouter);
apiRouter.use("/api/v1/screenshot", apiScreenshotRouter);
apiRouter.use("/api/v1/review", apiReviewRouter);
apiRouter.use("/api/v1/scrape", apiScrapeRouter);
apiRouter.use("/api/v1/extract", apiExtractRouter);
apiRouter.use("/api/v1/convert", apiConvertRouter);
apiRouter.use("/api/v1/summarize", apiSummarizeRouter);
apiRouter.use("/api/v1/ai", apiAiRouter);
apiRouter.use("/api/v1/url", apiUrlRouter);
// apiRouter.use("/api/v1/tool-api", apiToolifyRouter);
// apiRouter.use("/api/v1/convert", apiConvertRouter);
// apiRouter.use("/api/v1/tool-api", apiCombinedRouter);
