import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { onboardingCompleteSchema } from "@/validations/onboarding";
import { financialTwinService } from "@/services/financial-twin/twin.service";
import { financialTwinRepository } from "@/repositories/financial-twin.repository";
import type { Prisma } from "@/generated/prisma/client";
import { handleApiError } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

const TAG = "Onboarding";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = onboardingCompleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const userId = session.user.id;

    await prisma.$transaction(async (tx) => {
      await tx.profile.upsert({
        where: { userId },
        update: {
          income: data.monthlyIncome,
          occupation: data.occupation,
          monthlyExpenses: data.monthlyExpenses,
          emergencyFundTarget: data.emergencyFund,
          riskAppetite: data.riskAppetite,
          onboardingCompleted: true,
        },
        create: {
          userId,
          income: data.monthlyIncome,
          occupation: data.occupation,
          monthlyExpenses: data.monthlyExpenses,
          emergencyFundTarget: data.emergencyFund,
          riskAppetite: data.riskAppetite,
          onboardingCompleted: true,
        },
      });

      await tx.goal.create({
        data: {
          userId,
          name: data.goalName,
          type: data.goalType,
          targetAmount: data.targetAmount,
          currentAmount: data.currentSavings,
          deadline: data.targetDate ? new Date(data.targetDate) : null,
        },
      });

      const now = new Date();
      await tx.income.create({
        data: {
          userId,
          amount: data.monthlyIncome,
          category: "Salary",
          notes: "Initial onboarding income",
          date: now,
        },
      });

      if (data.monthlyExpenses > 0) {
        await tx.expense.create({
          data: {
            userId,
            amount: data.monthlyExpenses,
            category: "Other",
            notes: "Estimated monthly expenses from onboarding",
            date: now,
          },
        });
      }
    });

    const riskLabels: Record<string, string> = {
      VERY_CONSERVATIVE: "Very Conservative",
      CONSERVATIVE: "Conservative",
      MODERATE: "Balanced",
      GROWTH: "Growth",
      AGGRESSIVE: "Aggressive",
    };

    await prisma.aiProfile.upsert({
      where: { userId },
      update: {
        occupation: data.occupation,
        riskAppetite: data.riskAppetite,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
        financialGoals: {
          goalType: data.goalType,
          goalName: data.goalName,
          targetAmount: data.targetAmount,
        },
        riskTolerance: riskLabels[data.riskAppetite] ?? "Balanced",
        personaSummary: `${data.occupation || "Professional"} with ₹${data.monthlyIncome.toLocaleString("en-IN")}/month income, ${riskLabels[data.riskAppetite]?.toLowerCase() || "balanced"} risk profile, saving for ${data.goalName}.`,
      },
      create: {
        userId,
        occupation: data.occupation,
        riskAppetite: data.riskAppetite,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
        financialGoals: {
          goalType: data.goalType,
          goalName: data.goalName,
          targetAmount: data.targetAmount,
        },
        riskTolerance: riskLabels[data.riskAppetite] ?? "Balanced",
        personaSummary: `${data.occupation || "Professional"} with ₹${data.monthlyIncome.toLocaleString("en-IN")}/month income, ${riskLabels[data.riskAppetite]?.toLowerCase() || "balanced"} risk profile, saving for ${data.goalName}.`,
      },
    });

    try {
      const twin = await financialTwinService.generate(userId, {
        riskAppetite: data.riskAppetite,
      });
      await financialTwinRepository.upsert(userId, {
        name: twin.name,
        riskAppetite: data.riskAppetite,
        snapshot: twin.snapshot as unknown as Prisma.InputJsonValue,
        projections: twin.projections as unknown as Prisma.InputJsonValue,
        recommendations: twin.recommendations as unknown as Prisma.InputJsonValue,
      });
    } catch {
      // Twin generation is best-effort; don't fail onboarding if it errors
    }

    return NextResponse.json({
      success: true,
      data: { redirectUrl: "/dashboard" },
    });
  } catch (error) {
    logger.error(TAG, "Onboarding completion error", error);
    return handleApiError(error);
  }
}
