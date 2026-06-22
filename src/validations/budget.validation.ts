import { z } from "zod";

export const createBudgetSchema = z.object({
  category: z.string().min(1).max(100),
  limit: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  limit: z.number().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});
