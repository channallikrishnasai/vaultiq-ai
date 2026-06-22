import { z } from "zod";
import { RiskAppetite } from "@/generated/prisma/enums";

export const financialTwinSchema = z.object({
  name: z.string().min(1).optional(),
  riskAppetite: z.nativeEnum(RiskAppetite).optional(),
  snapshot: z
    .object({
      income: z.number().min(0),
      expenses: z.number().min(0),
      savings: z.number().min(0),
      investments: z.number().min(0),
      debt: z.number().min(0),
    })
    .optional(),
});

export type FinancialTwinInput = z.infer<typeof financialTwinSchema>;
