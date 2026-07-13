import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required").max(100, "Category must be 100 characters or less"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  date: z.coerce.date(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
