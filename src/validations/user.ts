import { z } from "zod";
import { RiskAppetite } from "@/generated/prisma/enums";

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().int().min(13).max(120).optional(),
  income: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  riskAppetite: z.nativeEnum(RiskAppetite).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
