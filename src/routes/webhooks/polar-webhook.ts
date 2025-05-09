import chalk from "chalk";
import express from "express";
import { z } from "zod";

import { env } from "@/env";
import {
  cancelAllPolarSubscriptions,
  cancelAllUserPlansByPolarSubscriptionIds,
  cancelUserPlanByPolarSubscriptionId,
  createPaymentAndOrder,
  subscriptionActive,
  subscriptionCancel,
} from "@/modules/payment";
import { addCreditsToUserBalance } from "@/modules/user-balance";

import { Webhook, WebhookVerificationError } from "./standard-webhook";

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

      const webhookPayload = wh.verify(payloadString, headers) as any;

      // Handle the event
      switch (webhookPayload.type) {
        // Checkout has been created
        case "checkout.created":
          break;

        // Checkout has been updated - this will be triggered when checkout status goes from confirmed -> succeeded
        case "checkout.updated":
          console.log("Checkout updated :>>", JSON.stringify(webhookPayload.data, null, 2));
          if (webhookPayload.data.status === "succeeded") {
            const { order } = await createPaymentAndOrder(webhookPayload.data.id);

            // only if this checkout is for a one-time product -> add credits to user balance
            if (!webhookPayload.data.product.is_recurring) {
              // add credits to user balance
              const userId = order.userId;
              await addCreditsToUserBalance(userId, order.total / 100);

              // notify user add credits
              // await notifyUserAddCredits(order);

              // cancel any existing user plan
              const polarSubscriptionIds = (await cancelAllPolarSubscriptions(userId))
                .map((subscription) => subscription?.id)
                .filter((id) => id !== undefined);

              await cancelAllUserPlansByPolarSubscriptionIds(polarSubscriptionIds);
            }
          }
          break;

        // Subscription has been created
        case "subscription.created":
          break;

        // A catch-all case to handle all subscription webhook events
        case "subscription.updated":
          break;

        // Subscription has been activated
        case "subscription.active": {
          console.log("Subscription active :>>", JSON.stringify(webhookPayload.data, null, 2));
          const polarCheckoutId = webhookPayload.data.checkout_id;
          const polarSubscriptionId = webhookPayload.data.id;
          await subscriptionActive(polarCheckoutId, polarSubscriptionId);
          break;
        }

        // Subscription has been revoked/peroid has ended with no renewal
        case "subscription.revoked": {
          const polarSubscriptionId = webhookPayload.data.id;
          await subscriptionCancel(polarSubscriptionId);
          break;
        }

        // Subscription has been explicitly canceled by the user
        case "subscription.canceled":
          console.log("Subscription canceled :>>", JSON.stringify(webhookPayload.data, null, 2));
          await cancelUserPlanByPolarSubscriptionId(webhookPayload.data.id);
          break;

        default:
          console.log(`Unhandled event type :>>`, chalk.yellow(webhookPayload.type));
      }

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
