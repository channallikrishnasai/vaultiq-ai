import { z } from "zod";
import { RiskAppetite } from "@/generated/prisma/enums";

export const comparePlatformsSchema = z.object({
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  tradingFrequency: z.enum(["rare", "monthly", "weekly", "daily"]),
  preferredFeatures: z.array(z.string()).min(1),
  riskAppetite: z.nativeEnum(RiskAppetite),
  budget: z.number().min(0).optional(),
});
