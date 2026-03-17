import express from "express";

export const apiHealthzRouter = express.Router();

apiHealthzRouter.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Service is healthy",
    data: { status: "OK" },
  });
});
