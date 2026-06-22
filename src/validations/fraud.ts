import { z } from "zod";
import { FraudInputType } from "@/generated/prisma/enums";

export const fraudAnalyzeSchema = z.object({
  inputType: z.nativeEnum(FraudInputType),
  content: z.string().min(1, "Content is required"),
});

export type FraudAnalyzeInput = z.infer<typeof fraudAnalyzeSchema>;
