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
  const apiKeys = await prisma.apiKey.findMany();
  res.status(200).json({ status: 1, data: apiKeys });
});

apiKeyRouter.post("/", verifyRequest, validateSession, async (req, res) => {
  const user = res.locals.user;
  if (!user) return res.status(401).json({ status: 0, message: "Unauthorized" });

  const { name, expiresAt } = createApiKeySchema.parse(req.body);
  const key = crypto.randomUUID();
  const apiKey = await prisma.apiKey.create({
    data: { name: name || "Untitled", key, userId: user.id, expiresAt },
  });

  res.status(200).json({ status: 1, data: apiKey });
});

apiKeyRouter.delete("/:id", verifyRequest, validateSession, async (req, res) => {
  const user = res.locals.user;
  if (!user) return res.status(401).json({ status: 0, message: "Unauthorized" });

  const { id } = req.params;
  const apiKey = await prisma.apiKey.delete({ where: { id, userId: user.id } });

  res.status(200).json({
    status: 1,
    data: { ...apiKey, displayCreatedAt: dayjs(apiKey.createdAt).format("lll") },
  });
});
