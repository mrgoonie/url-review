import express from "express";

import { apiHealthzRouter } from "./api-healthz";
import { apiKeyRouter } from "./api-key";
import { paymentRouter } from "./api-payment";
import { apiProfileRouter } from "./api-profile";
import { uploadRouter } from "./api-upload";

export const apiRouter = express.Router();
apiRouter.use("/api/v1/healthz", apiHealthzRouter);
apiRouter.use("/api/v1/profile", apiProfileRouter);
apiRouter.use("/api/v1/upload", uploadRouter);
apiRouter.use("/api/v1/api_key", apiKeyRouter);
apiRouter.use("/api/v1/payments", paymentRouter);
