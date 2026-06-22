import { z } from "zod";
import { RiskAppetite } from "@/generated/prisma/enums";

export const createFinancialTwinSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  riskAppetite: z.nativeEnum(RiskAppetite).optional(),
  income: z.number().positive(),
  expenses: z.number().min(0),
  savings: z.number().min(0),
  investments: z.number().min(0).optional(),
  debts: z.number().min(0).optional(),
});
