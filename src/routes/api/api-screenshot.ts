import express from "express";

export const apiScreenshotRouter = express.Router();

apiScreenshotRouter.post("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Service is healthy",
    data: { status: "OK" },
  });
});
