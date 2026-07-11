import type { RiskAppetite } from "@/generated/prisma/enums";
import { healthScoreService } from "@/services/finance/health-score.service";
import { expenseRepository } from "@/repositories/expense.repository";
import { goalRepository } from "@/repositories/goal.repository";
import { userRepository } from "@/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import { computeProjections } from "@/lib/twin-utils";
import { generateTwinRecommendations } from "@/lib/twin-recommendations";

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

  const monthlyIncome = user?.profile?.income ?? 0;
  const annualIncome = monthlyIncome * 12;
  const annualExpenses = monthlyExpensesRaw * 12;

  const savings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  let investments = portfolio?.totalValue ?? 0;

  if (investments === 0 && portfolio) {
    const trades = await prisma.trade.findMany({
      where: { portfolioId: portfolio.id },
      select: { totalAmount: true },
    });
    investments = portfolio.cashBalance + trades.reduce((sum, t) => sum + t.totalAmount, 0);
  }

  const debt = 0;

  return {
    income: annualIncome,
    expenses: annualExpenses,
    savings: savings > 0 ? savings : 0,
    investments,
    debt,
  };
}

export const financialTwinService = {
  async generate(
    userId: string,
    data: {
      name?: string;
      riskAppetite?: RiskAppetite;
      snapshot?: {
        income: number;
        expenses: number;
        savings: number;
        investments: number;
        debt: number;
      };
    },
  ) {
    const health = await healthScoreService.calculate(userId);
    const baseSnapshot = data.snapshot ?? (await buildUserSnapshot(userId));

    const netWorth = baseSnapshot.savings + baseSnapshot.investments - baseSnapshot.debt;
    const savingsRate =
      baseSnapshot.income > 0
        ? (baseSnapshot.income - baseSnapshot.expenses) / baseSnapshot.income
        : 0;

    const riskAppetite = data.riskAppetite ?? "MODERATE";
    const projections = computeProjections(netWorth, riskAppetite);

    const goals = await goalRepository.findAll(userId);
    const monthlyExpenses = baseSnapshot.expenses / 12;
    const emergencyGoal = goals.find((g) => g.type === "EMERGENCY");

    const recommendations = generateTwinRecommendations({
      savingsRate: Math.round(savingsRate * 100),
      debt: baseSnapshot.debt,
      savings: baseSnapshot.savings,
      investments: baseSnapshot.investments,
      monthlyExpenses,
      emergencyFundCurrent: emergencyGoal?.currentAmount ?? 0,
      emergencyFundTarget: emergencyGoal?.targetAmount ?? monthlyExpenses * 6,
      goalProgress: goals.map((g) => ({
        name: g.name,
        percent: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
        remaining: Math.max(0, g.targetAmount - g.currentAmount),
      })),
      riskAppetite,
    });

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
