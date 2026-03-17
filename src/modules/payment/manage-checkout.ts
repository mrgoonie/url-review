import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "@/lib/db";
import elasticSend from "@/lib/email/elastic-email";

import { createInitialUserPlan, createUserPlan } from "./manage-plans";

export async function createPaymentAndOrder(polarCheckoutId: string) {
  const order = await prisma.order.findFirst({
    where: { polarCheckoutId },
  });

  if (!order) throw new Error(`Order with polarCheckoutId ${polarCheckoutId} not found`);

  // update the order status
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.PAID },
    include: { user: true },
  });

  // create a payment
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      amount: order.total,
      method: PaymentMethod.POLAR,
      status: PaymentStatus.PAID,
    },
    include: { user: { select: { email: true } } },
  });

  // send a success email
  if (updatedOrder.user.email) {
    elasticSend({
      from: "noreply@reviewweb.site",
      to: updatedOrder.user.email,
      subject: "ReviewWeb.site - Payment Success",
      content: `
        <p>Hi <strong>${updatedOrder.user.name}</strong>,</p>
        <p>Thank you for your payment of <strong>$${
          payment.amount / 100
        }</strong> for your order <strong>"${order.id}"</strong></p>
        <p>Here are the details of your order:</p>
        <ul>
          <li><strong>Order ID:</strong> ${order.id}</li>
          <li><strong>Order Date:</strong> ${dayjs(payment.createdAt).format("lll")}</li>
          <li><strong>Order Total:</strong> $${payment.amount / 100}</li>
          <li><strong>Order Status:</strong> ${payment.status}</li>
        </ul>
        <p>Thanks for using ReviewWeb.site!</p>
      `,
    }).catch((e) => {
      console.error(`Unable to send email to ${updatedOrder.user.email}: ${e}`);
    });
  }

  return { payment, order: updatedOrder };
}

export async function subscriptionActive(polarCheckoutId: string, polarSubscriptionId: string) {
  // find the order
  const order = await prisma.order.findFirst({
    where: { polarCheckoutId },
  });
  if (!order) throw new Error(`Order with polarCheckoutId ${polarCheckoutId} not found`);
  if (!order.polarProductId)
    throw new Error(`Order with polarCheckoutId ${polarCheckoutId} has no polar product id`);

  // create a user plan
  const { userId, polarProductId } = order;
  const userPlan = await createUserPlan(userId, polarProductId, polarSubscriptionId);
  return userPlan;
}

export async function subscriptionCancel(
  polarSubscriptionId: string,
  options?: { debug?: boolean }
) {
  const userPlan = await prisma.userPlan.findFirst({
    where: { polarSubscriptionId },
  });
  if (!userPlan)
    throw new Error(`User plan with polarSubscriptionId ${polarSubscriptionId} not found`);

  // update user plan in database
  const updatedUserPlan = await prisma.userPlan.update({
    where: { id: userPlan.id },
    data: { status: "INACTIVE" },
    select: { id: true, polarSubscriptionId: true, userId: true },
  });

  if (options?.debug)
    console.log(
      `User plan ${updatedUserPlan.id} with polarSubscriptionId ${polarSubscriptionId} updated to "INACTIVE"`
    );

  const freePlan = await createInitialUserPlan(userPlan.userId);
  return freePlan;
}
