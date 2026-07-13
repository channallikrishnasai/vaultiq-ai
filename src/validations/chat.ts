import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000, "Message must be 4000 characters or less"),
  sessionId: z.string().optional(),
});

export const chatHistoryQuerySchema = z.object({
  sessionId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
