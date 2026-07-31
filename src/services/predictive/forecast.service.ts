import { prisma } from "@/lib/prisma";
import { predictionEngine, type PredictionInput } from "./prediction-engine";
import type { CashFlowPrediction, GoalPrediction, BudgetPrediction } from "./prediction-engine";

export const forecastService = {
  async buildPredictionInput(userId: string): Promise<PredictionInput> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [profile, expenses, incomes, goals, budgets, portfolio] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.expense.findMany({ where: { userId, date: { gte: threeMonthsAgo } } }),
      prisma.income.findMany({ where: { userId, date: { gte: threeMonthsAgo } } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId, year: now.getFullYear(), month: now.getMonth() + 1 } }),
      prisma.portfolio.findFirst({ where: { userId, isDefault: true } }),
    ]);

    const monthlyIncome = profile?.income ?? 0;

    const currentMonthExpenses = expenses
      .filter((e) => { const d = new Date(e.date); return d >= startOfMonth && d <= endOfMonth; })
      .reduce((sum, e) => sum + e.amount, 0);

    const currentMonthIncomes = incomes
      .filter((i) => { const d = new Date(i.date); return d >= startOfMonth && d <= endOfMonth; })
      .reduce((sum, i) => sum + i.amount, 0);

    const actualIncome = currentMonthIncomes > 0 ? currentMonthIncomes : monthlyIncome;
    const savingsBalance = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const emergencyGoal = goals.find((g) => g.type === "EMERGENCY");
    const emergencyFund = emergencyGoal?.currentAmount ?? 0;
    const emergencyTarget = emergencyGoal?.targetAmount ?? monthlyIncome * 6;

    const recentTransactions = expenses.slice(-30).map((e) => ({
      amount: e.amount,
      category: e.category,
      date: e.date.toISOString(),
    }));

    return {
      monthlyIncome: actualIncome,
      monthlyExpenses: currentMonthExpenses,
      savingsBalance,
      emergencyFund,
      emergencyFundTarget: emergencyTarget,
      investments: portfolio?.totalValue ?? 0,
      riskAppetite: profile?.riskAppetite ?? "MODERATE",
      goals: goals.map((g) => ({
        name: g.name,
        target: g.targetAmount,
        current: g.currentAmount,
        deadline: g.deadline?.toISOString() ?? null,
      })),
      budgets: budgets.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: 0,
      })),
      recentTransactions,
    };
  },

  async getCashFlowPredictions(userId: string): Promise<CashFlowPrediction[]> {
    const input = await this.buildPredictionInput(userId);
    return predictionEngine.generateCashFlowPredictions(input);
  },

  async getGoalPredictions(userId: string): Promise<GoalPrediction[]> {
    const input = await this.buildPredictionInput(userId);
    return predictionEngine.generateGoalPredictions(input);
  },

  async getBudgetPredictions(userId: string): Promise<BudgetPrediction[]> {
    const input = await this.buildPredictionInput(userId);
    return predictionEngine.generateBudgetPredictions(input);
  },
};
