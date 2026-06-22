import { z } from "zod";
import { RiskAppetite } from "@/generated/prisma/enums";

export const generateRoadmapSchema = z.object({
  goals: z.array(z.string()).min(1),
  income: z.number().positive(),
  age: z.number().int().min(18).max(100),
  riskAppetite: z.nativeEnum(RiskAppetite),
  timelineMonths: z.number().int().min(6).max(360),
});
