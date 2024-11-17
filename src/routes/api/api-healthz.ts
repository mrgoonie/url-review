import express from "express";

export const apiHealthzRouter = express.Router();

apiHealthzRouter.get("/", (_, res) => {
  res.status(200).json({ status: "OK" });
});
