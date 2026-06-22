import { z } from "zod";

export const sendChatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
});

export const chatHistoryQuerySchema = z.object({
  sessionId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
