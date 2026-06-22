import { z } from "zod";
import { FraudInputType } from "@/generated/prisma/enums";

export const analyzeFraudSchema = z.object({
  inputType: z.nativeEnum(FraudInputType),
  content: z.string().min(1).max(10000),
});
