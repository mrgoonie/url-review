import type {
  WebhookOrderCreatedPayload,
  WebhookSubscriptionCreatedPayload,
  WebhookSubscriptionUpdatedPayload,
  WebhookSubscriptionUpdatedPayloadType,
} from "@polar-sh/sdk/models/components";
import crypto from "crypto";
import express from "express";
import { z } from "zod";

import { env } from "@/env";
import { prisma } from "@/lib/db";

import { Webhook, WebhookVerificationError } from "./standard-webhook";

type PolarWebhookPayload =
  | WebhookSubscriptionCreatedPayload
  | WebhookSubscriptionUpdatedPayload
  | WebhookOrderCreatedPayload;

export const polarWebhookRouter = express.Router();

const headerSchema = z.object({
  "webhook-id": z.string(),
  "webhook-timestamp": z.string(),
  "webhook-signature": z.string(),
});

polarWebhookRouter.all(
  "/webhooks/polar",
  // make sure this route receive raw body
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // console.log(`req.body :>>`, req.body);
      // console.log(`req.headers :>>`, req.headers);

      const headers = headerSchema.parse(req.headers);
      // console.log("Parsed headers:", headers);

      const wh = new Webhook(env.POLAR_SECRET);
      // console.log("Webhook instance created with secret:", env.POLAR_SECRET);

      const payloadString = req.body instanceof Buffer ? req.body.toString("utf8") : req.body;
      // console.log("Payload string:", payloadString);

      const payload = wh.verify(payloadString, headers) as any;
      console.log(`Verified payload :>>`);
      console.dir(payload, { depth: 10 });

      // Process the verified payload here

      if (payload.type === "subscription.updated") {
        const { id, user_id, product_id, status, amount, currency, metadata } = payload.data;
        if (status === "active" || status === "completed") {
          console.log(
            `User "${user_id}" subscribed to product "${product_id}" with amount "${amount}" (${currency})`
          );
          console.log(`Custom metadata:`, metadata);

          // Add your subscription updated handling logic here...
        }
      }

      if (payload.type === "order.created") {
        const { id, user_id, product_id, status, amount, currency, metadata } = payload.data;
        console.log(
          `User "${user_id}" subscribed to product "${product_id}" with amount "${amount}" (${currency})`
        );
        console.log(`Custom metadata:`, metadata);

        // Add your order created handling logic here...

        const amountInDollars = amount / 100;
        const payment = await prisma.payment.create({
          data: {
            userId: metadata.user_id,
            groupAdId: metadata.group_ad_id,
            amount: amountInDollars,
            status: "PAID",
            paymentMethod: "POLAR",
            transactionId: id,
          },
        });
        console.log(`Payment created:`, payment);

        // update user balance
        await prisma.user.update({
          where: { id: metadata.user_id },
          data: { balance: { increment: amountInDollars } },
        });
      }
      // if (webhook.type === "subscription.created" || webhook.type === "subscription.updated") {
      //   const { id, userId, productId, status } = webhook.data;

      //   if (status === "active" && id && userId && productId) {
      //     const user = await prisma.user.findFirst({
      //       where: { polarId: userId },
      //     });

      //     if (user) {
      //       const plan = await prisma.plan.findFirst({
      //         where: { polarPlanId: productId },
      //       });

      //       if (plan) {
      //         await subscribe(user.id, plan.id);
      //         console.log(`User ${user.id} subscribed to plan ${plan.id}`);
      //       } else {
      //         console.error(`Plan not found for Polar plan ID: ${plan_id}`);
      //       }
      //     } else {
      //       console.error(`User not found for Polar customer ID: ${customer_id}`);
      //     }
      //   }
      // }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing Polar webhook:", error);
      if (error instanceof WebhookVerificationError) {
        console.error("Webhook Verification Error:", error.message);
      } else if (error instanceof z.ZodError) {
        console.error("Header validation error:", error.errors);
      }
      res.status(400).json({ error: "Invalid payload or headers" });
    }
  }
);
