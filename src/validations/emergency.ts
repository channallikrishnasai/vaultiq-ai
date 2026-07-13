import { z } from "zod";

export const emergencyGenerateSchema = z.object({
  scenario: z.string().min(1).max(500, "Scenario must be 500 characters or less"),
  monthlyExpenses: z.number().positive(),
  currentSavings: z.number().min(0),
  dependents: z.number().int().min(0).optional(),
  income: z.number().positive().optional(),
});

export type EmergencyGenerateInput = z.infer<typeof emergencyGenerateSchema>;
