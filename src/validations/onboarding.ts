import { z } from "zod";

export const RISK_APPETITE_VALUES = [
  "VERY_CONSERVATIVE",
  "CONSERVATIVE",
  "MODERATE",
  "GROWTH",
  "AGGRESSIVE",
] as const;

export const GOAL_TYPE_VALUES = ["SAVINGS", "EMERGENCY", "INVESTMENT"] as const;

export const step2Schema = z.object({
  occupation: z.string().min(1, "Occupation is required"),
  monthlyIncome: z
    .number()
    .min(0, "Income must be positive")
    .max(100_000_000, "Income seems unrealistic"),
  monthlyExpenses: z
    .number()
    .min(0, "Expenses must be positive")
    .max(100_000_000, "Expenses seem unrealistic"),
});

export const step3Schema = z.object({
  currentSavings: z
    .number()
    .min(0, "Savings must be positive")
    .max(100_000_000, "Savings seems unrealistic"),
  emergencyFund: z
    .number()
    .min(0, "Emergency fund must be positive")
    .max(100_000_000, "Amount seems unrealistic"),
});

export const step4Schema = z.object({
  goalType: z.enum(GOAL_TYPE_VALUES),
  goalName: z.string().min(1, "Goal name is required").max(100),
  targetAmount: z
    .number()
    .min(1, "Target must be at least 1")
    .max(100_000_000, "Target seems unrealistic"),
  targetDate: z.string().min(1, "Target date is required"),
});

export const step5Schema = z.object({
  riskAppetite: z.enum(RISK_APPETITE_VALUES),
});

export const onboardingCompleteSchema = z.object({
  occupation: z.string().min(1, "Occupation is required"),
  monthlyIncome: z.number().min(0).max(100_000_000),
  monthlyExpenses: z.number().min(0).max(100_000_000),
  currentSavings: z.number().min(0).max(100_000_000),
  emergencyFund: z.number().min(0).max(100_000_000),
  goalType: z.enum(GOAL_TYPE_VALUES),
  goalName: z.string().min(1).max(100),
  targetAmount: z.number().min(1).max(100_000_000),
  targetDate: z.string().min(1),
  riskAppetite: z.enum(RISK_APPETITE_VALUES),
});

export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type OnboardingCompleteData = z.infer<typeof onboardingCompleteSchema>;
