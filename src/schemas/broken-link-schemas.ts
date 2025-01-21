import { z } from "zod";

export const ScanBrokenLinksSchema = z.object({
  url: z.string().url(),
});

export type ScanBrokenLinksInput = z.infer<typeof ScanBrokenLinksSchema>;

export const BrokenLinkSchema = z.object({
  id: z.string(),
  url: z.string(),
  brokenUrl: z.string(),
  statusCode: z.number().nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
