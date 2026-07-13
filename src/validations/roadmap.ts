import { z } from "zod";
import { RiskAppetite } from "@/generated/prisma/enums";

export const roadmapGenerateSchema = z.object({
  age: z.number().int().min(18).max(80),
  income: z.number().positive(),
  savings: z.number().min(0),
  goals: z.array(z.string().max(200)).min(1).max(10),
  riskAppetite: z.nativeEnum(RiskAppetite),
  timeHorizonYears: z.number().int().min(1).max(40),
});

export type RoadmapGenerateInput = z.infer<typeof roadmapGenerateSchema>;
