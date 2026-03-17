import type { RequestHandler } from "express";

import { prisma } from "@/lib/db";

export const apiKeyAuth: RequestHandler = async (req, res, next) => {
  // console.log("api_key_auth.ts > apiKeyAuth > res.locals.user :>>", res.locals.user);
  // console.log("api_key_auth.ts > apiKeyAuth > res.locals.userId :>>", res.locals.userId);
  try {
    let apiKey = req.headers["x-api-key"]?.toString();

    if (!apiKey) {
      const authHeaders = req.headers["authorization"];
      if (authHeaders) apiKey = authHeaders.split(" ")[1];
    }

    if (!apiKey) {
      // Check if there's already a logged-in user
      if (res.locals.user) {
        return next();
      }

      return res.status(401).json({ status: 0, message: "Unauthorized" });
    }

    // validate api key
    const key = await prisma.apiKey.findUnique({
      where: {
        key: apiKey,
      },
      include: {
        user: true,
      },
    });

    if (!key) {
      // Check if there's already a logged-in user
      if (res.locals.user) {
        return next();
      }

      return res.status(401).json({ status: 0, message: "Unauthorized - Invalid API key" });
    }

    // assign api key to locals
    res.locals.apiKey = key;

    // Only set user if it's not already set
    if (!res.locals.user) res.locals.user = key.user;
    if (!res.locals.userId) res.locals.userId = key.user.id;

    next();
  } catch (error) {
    console.error("apiKeyAuth > Error :>>", error);
    res.status(500).json({ status: 0, message: "Internal server error in API key authentication" });
  }
};
