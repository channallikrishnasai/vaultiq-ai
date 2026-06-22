import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
  date: z.coerce.date(),
});

export const updateExpenseSchema = createExpenseSchema.partial();
