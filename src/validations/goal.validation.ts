import { z } from "zod";
import { GoalType } from "@/generated/prisma/enums";

export const createGoalSchema = z.object({
  name: z.string().min(1).max(200),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).optional(),
  type: z.nativeEnum(GoalType),
  deadline: z.coerce.date().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();
