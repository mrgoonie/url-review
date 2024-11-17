import { z } from "zod";

export const ApiResponseSchema = z.object({
  status: z.number(),
  data: z.any(),
  messages: z.array(z.string()).optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
