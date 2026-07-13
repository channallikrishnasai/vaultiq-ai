import { z } from "zod";
import { FraudInputType } from "@/generated/prisma/enums";

export const fraudAnalyzeSchema = z.object({
  inputType: z.nativeEnum(FraudInputType),
  content: z.string().min(1, "Content is required").max(5000, "Content must be 5000 characters or less"),
});

export type FraudAnalyzeInput = z.infer<typeof fraudAnalyzeSchema>;
