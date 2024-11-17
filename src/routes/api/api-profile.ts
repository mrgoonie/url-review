import type { GroupAdStatus } from "@prisma/client";
import express from "express";

import { validateSession } from "@/lib/auth";
import { apiKeyAuth } from "@/middlewares/api_key_auth";
import { getGroupAds } from "@/modules/group-ads";
import { maskUser } from "@/modules/user";
import { getUser } from "@/modules/user/get-user";
import { getUserProducts } from "@/modules/user-products";

export const apiProfileRouter = express.Router();

apiProfileRouter.get("/", validateSession, apiKeyAuth, async (_, res) => {
  try {
    const userId = res.locals["user"]?.id;
    if (!userId) return res.status(401).json({ status: 0, message: "Unauthorized" });

    const user = await getUser(userId);
    if (!user) return res.status(404).json({ status: 0, message: "User not found" });

    return res.status(200).json({ data: maskUser(user) });
  } catch (error) {
    console.error("profile.ts > /api/v1/profile > error :>>", error);
    return res.status(500).json({ status: 0, message: "Internal server error" });
  }
});

// get products of auth user
apiProfileRouter.get("/products", validateSession, apiKeyAuth, async (_, res) => {
  try {
    const userId = res.locals["user"]?.id;
    if (!userId) return res.status(401).json({ status: 0, message: "Unauthorized" });

    const products = await getUserProducts(userId);
    return res.status(200).json({ data: products });
  } catch (error) {
    console.error("profile.ts > /api/v1/profile/products > error :>>", error);
    return res.status(500).json({ status: 0, message: "Internal server error" });
  }
});

// get groupAds of auth user
apiProfileRouter.get("/group-ads", validateSession, apiKeyAuth, async (req, res) => {
  try {
    const userId = res.locals["user"]?.id;
    if (!userId) return res.status(401).json({ status: 0, message: "Unauthorized" });

    const page = req.query["page"] ? parseInt(req.query["page"] as string) : 1;
    const limit = req.query["limit"] ? parseInt(req.query["limit"] as string) : 10;
    const status = req.query["status"] as GroupAdStatus | undefined;

    const groupAds = await getGroupAds({ userId, status }, { page, limit });
    return res.status(200).json({ data: groupAds });
  } catch (error) {
    console.error("profile.ts > /api/v1/profile/group-ads > error :>>", error);
    return res.status(500).json({ status: 0, message: "Internal server error" });
  }
});
