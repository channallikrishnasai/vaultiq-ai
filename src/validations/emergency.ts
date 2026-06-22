import { z } from "zod";

export const emergencyGenerateSchema = z.object({
  scenario: z.string().min(1),
  monthlyExpenses: z.number().positive(),
  currentSavings: z.number().min(0),
  dependents: z.number().int().min(0).optional(),
  income: z.number().positive().optional(),
});

export type EmergencyGenerateInput = z.infer<typeof emergencyGenerateSchema>;
