import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import express from "express";
import { z } from "zod";

import { validateSession, verifyRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

dayjs.extend(localizedFormat);

export const apiKeyRouter = express.Router();
apiKeyRouter.use(express.json());

const createApiKeySchema = z.object({
  name: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

apiKeyRouter.get("/", verifyRequest, validateSession, async (_, res) => {
  try {
    const apiKeys = await prisma.apiKey.findMany();
    res.status(200).json({
      success: true,
      message: "API keys retrieved successfully",
      data: apiKeys,
    });
  } catch (error) {
    console.error("api-key > GET / > error :>>", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve API keys",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiKeyRouter.post("/", verifyRequest, validateSession, async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, expiresAt } = createApiKeySchema.parse(req.body);
    const key = crypto.randomUUID();
    const apiKey = await prisma.apiKey.create({
      data: { name: name || "Untitled", key, userId: user.id, expiresAt },
    });

    res.status(201).json({
      success: true,
      message: "API key created successfully",
      data: apiKey,
    });
  } catch (error) {
    console.error("api-key > POST / > error :>>", error);
    res.status(400).json({
      success: false,
      message: "Failed to create API key",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiKeyRouter.delete("/:id", verifyRequest, validateSession, async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const apiKey = await prisma.apiKey.delete({
      where: { id, userId: user.id },
    });

    res.status(200).json({
      success: true,
      message: "API key deleted successfully",
      data: {
        ...apiKey,
        displayCreatedAt: dayjs(apiKey.createdAt).format("lll"),
      },
    });
  } catch (error) {
    console.error("api-key > DELETE /:id > error :>>", error);
    res.status(400).json({
      success: false,
      message: "Failed to delete API key",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
