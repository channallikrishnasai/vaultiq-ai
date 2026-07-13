import { z } from "zod";

export const createIncomeSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required").max(100, "Category must be 100 characters or less"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  date: z.coerce.date(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
