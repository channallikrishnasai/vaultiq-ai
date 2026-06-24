import type { RiskAppetite } from "@/generated/prisma/enums";
import { healthScoreService } from "@/services/finance/health-score.service";
import { expenseRepository } from "@/repositories/expense.repository";
import { goalRepository } from "@/repositories/goal.repository";
import { userRepository } from "@/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import { computeProjections } from "@/lib/twin-utils";

async function buildUserSnapshot(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [user, goals, portfolio, monthlyExpensesRaw] = await Promise.all([
    userRepository.findById(userId),
    goalRepository.findAll(userId),
    prisma.portfolio.findFirst({ where: { userId, isDefault: true } }),
    expenseRepository.findAll(userId).then((expenses) =>
      expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= startOfMonth && d <= endOfMonth;
        })
        .reduce((sum, e) => sum + e.amount, 0),
    ),
  ]);

  const annualIncome = (user?.profile?.income ?? 50000) * 12;
  const annualExpenses = monthlyExpensesRaw * 12 || 350000;

  const savingsGoals = goals.filter((g) => g.type === "SAVINGS" || g.type === "EMERGENCY");
  const savings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0) || 150000;

  const investmentGoals = goals.filter((g) => g.type === "INVESTMENT");
  let investments = investmentGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  if (portfolio) {
    const trades = await prisma.trade.findMany({
      where: { portfolioId: portfolio.id },
      select: { totalAmount: true },
    });
    const tradeValue = trades.reduce((sum, t) => sum + t.totalAmount, 0);
    investments += portfolio.cashBalance + tradeValue;
  }

  if (investments === 0 && portfolio) {
    investments = portfolio.totalValue;
  }

  const debt = 50000;

  return {
    income: annualIncome,
    expenses: annualExpenses,
    savings,
    investments,
    debt,
  };
}

export const financialTwinService = {
  async generate(userId: string, data: {
    name?: string;
    riskAppetite?: RiskAppetite;
    snapshot?: {
      income: number;
      expenses: number;
      savings: number;
      investments: number;
      debt: number;
    };
  }) {
    const health = await healthScoreService.calculate(userId);
    const baseSnapshot = data.snapshot ?? (await buildUserSnapshot(userId));

    const netWorth = baseSnapshot.savings + baseSnapshot.investments - baseSnapshot.debt;
    const savingsRate = baseSnapshot.income > 0
      ? (baseSnapshot.income - baseSnapshot.expenses) / baseSnapshot.income
      : 0;

    const riskAppetite = data.riskAppetite ?? "MODERATE";
    const projections = computeProjections(netWorth, riskAppetite);

    const recommendations = [
      savingsRate < 0.2 ? "Increase savings rate to at least 20%" : "Maintain current savings discipline",
      baseSnapshot.debt > baseSnapshot.savings ? "Prioritize debt reduction" : "Debt levels are manageable",
      health.score < 60 ? "Focus on building emergency fund" : "Consider increasing equity allocation",
      "Review and rebalance portfolio quarterly",
      netWorth < 500000 ? "Start SIP investments to accelerate wealth building" : "Explore tax-efficient investment options",
    ];

    return {
      name: data.name ?? "My Financial Twin",
      healthScore: health.score,
      riskAppetite,
      snapshot: {
        ...baseSnapshot,
        netWorth,
        savingsRate: Math.round(savingsRate * 100),
      },
      projections,
      recommendations,
      twinSummary: `Net worth: ₹${netWorth.toLocaleString("en-IN")} | Health: ${health.grade} (${health.score}/100) | Savings rate: ${Math.round(savingsRate * 100)}%`,
    };
  },
};
