import { z } from "zod";

export const generateEmergencySchema = z.object({
  scenario: z.string().min(3).max(200),
  monthlyIncome: z.number().positive(),
  monthlyExpenses: z.number().positive(),
  savings: z.number().min(0),
  dependents: z.number().int().min(0).max(20).default(0),
});
