/* eslint-disable prettier/prettier */
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import express from "express";

import { validateSession, verifyRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { respondFailure, respondSuccess } from "@/modules/response/respond-helper";

dayjs.extend(localizedFormat);

const apiOrderRouter = express.Router();
apiOrderRouter.use(express.json());

apiOrderRouter.get(
  "/status/:checkoutId",
  verifyRequest,
  validateSession,
  apiKeyAuth,
  async (req, res) => {
    try {
      const polarCheckoutId = req.params["checkoutId"];
      if (!polarCheckoutId) return respondFailure("Order ID is required");

      const order = await prisma.order.findFirst({
        where: { polarCheckoutId },
        select: { id: true, status: true, userId: true },
      });
      if (!order) throw new Error("Order not found");

      res.status(200).json(respondSuccess({ data: order }));
    } catch (e) {
      res.status(200).json(respondFailure(`${e}`));
    }
  }
);

export default apiOrderRouter;
