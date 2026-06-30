import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  DEMO_PROFILE,
  DEMO_EXPENSES,
  DEMO_FRAUD_REPORTS,
} from "@/lib/demo-profile";
import { financialTwinService } from "@/services/financial-twin/twin.service";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Profile
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        income: DEMO_PROFILE.monthlyIncome,
        currency: DEMO_PROFILE.currency,
        riskAppetite: DEMO_PROFILE.riskAppetite,
        xp: 420,
        streak: 7,
      },
      update: {
        income: DEMO_PROFILE.monthlyIncome,
        currency: DEMO_PROFILE.currency,
        riskAppetite: DEMO_PROFILE.riskAppetite,
      },
    });

    // Expenses
    await prisma.expense.createMany({
      data: DEMO_EXPENSES.map((e, i) => ({
        userId,
        amount: e.amount,
        category: e.category,
        notes: e.notes,
        date: new Date(startOfMonth.getTime() + 86400000 * (i + 1)),
      })),
    });

    // Goals
    const goalEntries = [
      DEMO_PROFILE.goals.emergency,
      DEMO_PROFILE.goals.laptop,
      DEMO_PROFILE.goals.europeTrip,
    ];

    await prisma.goal.createMany({
      data: goalEntries.map((g) => ({
        userId,
        name: g.name,
        targetAmount: g.target,
        currentAmount: g.current,
        deadline: new Date(now.getFullYear() + 1, now.getMonth(), 1),
        type: g.type,
      })),
    });

    // Portfolio + Trades
    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name: DEMO_PROFILE.portfolio.name,
        cashBalance: DEMO_PROFILE.portfolio.cashBalance,
        totalValue: DEMO_PROFILE.portfolio.totalValue,
        isDefault: true,
      },
    });

    await prisma.trade.createMany({
      data: DEMO_PROFILE.portfolio.trades.map((t, i) => ({
        portfolioId: portfolio.id,
        symbol: t.symbol,
        type: "BUY" as const,
        quantity: t.quantity,
        price: t.price,
        totalAmount: t.totalAmount,
        executedAt: new Date(startOfMonth.getTime() + 86400000 * (i + 2)),
      })),
    });

    // Fraud demo history
    await prisma.fraudReport.createMany({
      data: DEMO_FRAUD_REPORTS.map((r) => ({
        userId,
        inputType: r.inputType,
        content: r.content,
        riskScore: r.riskScore,
        threatCategory: r.threatCategory,
        explanation: r.explanation,
        actions: r.actions,
        createdAt: new Date(now.getTime() - r.daysAgo * 86400000),
      })),
    });

    // Deactivate existing twins, generate fresh one
    await prisma.financialTwin.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const twinData = await financialTwinService.generate(userId, {
      name: "Demo Financial Twin",
      riskAppetite: DEMO_PROFILE.riskAppetite,
      snapshot: {
        income: DEMO_PROFILE.annualIncome,
        expenses: DEMO_PROFILE.annualExpenses,
        savings: DEMO_PROFILE.savingsBalance,
        investments: DEMO_PROFILE.investments,
        debt: DEMO_PROFILE.debt,
      },
    });

    await prisma.financialTwin.create({
      data: {
        userId,
        name: twinData.name,
        healthScore: twinData.healthScore,
        riskAppetite: twinData.riskAppetite,
        snapshot: twinData.snapshot,
        projections: twinData.projections as object,
        recommendations: { items: twinData.recommendations, summary: twinData.twinSummary },
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        expensesCreated: DEMO_EXPENSES.length,
        goalsCreated: goalEntries.length,
        portfolioCreated: 1,
        tradesCreated: DEMO_PROFILE.portfolio.trades.length,
        fraudReportsCreated: DEMO_FRAUD_REPORTS.length,
        twinCreated: true,
      },
    });
  } catch (error) {
    console.error("[Demo Load] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load demo data" },
      { status: 500 },
    );
  }
}
