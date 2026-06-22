import { z } from "zod";
import { RiskAppetite } from "@/generated/prisma/enums";

export const platformCompareSchema = z.object({
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  tradingFrequency: z.enum(["daily", "weekly", "monthly", "rarely"]),
  preferredFeatures: z.array(z.string()).optional(),
  riskAppetite: z.nativeEnum(RiskAppetite).optional(),
  budget: z.number().min(0).optional(),
});

export type PlatformCompareInput = z.infer<typeof platformCompareSchema>;
