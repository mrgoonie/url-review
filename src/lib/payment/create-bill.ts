import type { Product, User } from "@prisma/client";
import { sumArray } from "diginext-utils/dist/array";
import { TimeSpan } from "lucia";
import { createDate } from "oslo";

import { prisma } from "@/server/db";

interface ICreateBill {
  user: User;
  cartIds: Array<string>;
  workspaceId?: string;
}

function checkCurrencyConsistency(products: Array<Partial<Product>>) {
  if (products.length === 0) {
    throw new Error("No products provided.");
  }

  // Assuming all products should have the same currency as the first product in the array
  const expectedCurrency = products[0]?.currency;
  if (!expectedCurrency) throw new Error("Currency needed.");

  const hasConsistentCurrency = products.every((product) => product.currency === expectedCurrency);

  if (!hasConsistentCurrency) {
    throw new Error("Currency mismatch detected among products.");
  }

  return true;
}

export default async function createBill({ user, cartIds, workspaceId }: ICreateBill) {
  //
  try {
    if (!user) throw new Error("Need login");

    const carts = await prisma.cartItem.findMany({
      where: {
        id: { in: cartIds },
      },
      include: {
        product: true,
      },
    });

    const products = carts.map((x) => x.product);

    checkCurrencyConsistency(products);

    const totalPrice = sumArray(products as any, "price");
    const currency = products[0]?.currency;

    const expirationTime = createDate(new TimeSpan(2, "h"));

    const bill = await prisma.bill.create({
      data: {
        total: totalPrice,
        currency,
        userId: user!.id,
        expiresAt: expirationTime,
        paidProducts: {
          create: carts.map((x) => ({
            owner: {
              connect: {
                id: user?.id,
              },
            },
            ...(workspaceId ? { workspaceId } : {}),
            product: {
              connect: {
                id: x.productId,
              },
            },
          })),
        },
      },
    });
    await prisma.cartItem.deleteMany({
      where: {
        id: { in: cartIds },
      },
    });

    if (bill.id) return bill;

    throw new Error("Err");
  } catch (error) {
    throw new Error(
      `Create Bill failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
