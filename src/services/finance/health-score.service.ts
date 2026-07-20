import { expenseRepository } from "@/repositories/expense.repository";
import { budgetRepository } from "@/repositories/budget.repository";
import { goalRepository } from "@/repositories/goal.repository";
import { userRepository } from "@/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import {
  computeHealthScore,
  type HealthScoreResult,
  type HealthMetrics,
} from "@/lib/financial-health";

export type { HealthScoreResult };

export const healthScoreService = {
  async calculate(userId: string): Promise<HealthScoreResult> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [expenses, budgets, goals, user, portfolio] = await Promise.all([
      expenseRepository.findAll(userId),
      budgetRepository.findAll(userId),
      goalRepository.findAll(userId),
      userRepository.findById(userId),
      prisma.portfolio.findFirst({ where: { userId, isDefault: true } }),
    ]);

    const monthlyExpenses = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d >= startOfMonth && d <= endOfMonth;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyIncome = user?.profile?.income ?? 0;
    const savingsBalance = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const emergencyGoal = goals.find((g) => g.type === "EMERGENCY");
    const goalProgressAvg =
      goals.length > 0
        ? goals.reduce(
            (sum, g) => sum + Math.min(100, (g.currentAmount / g.targetAmount) * 100),
            0,
          ) / goals.length
        : 0;

    const currentBudgets = budgets.filter(
      (b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear(),
    );

    const metrics: HealthMetrics = {
      monthlyIncome,
      monthlyExpenses,
      savingsBalance,
      investments: 0,
      debt: 0,
      emergencyFundCurrent: emergencyGoal?.currentAmount ?? 0,
      emergencyFundTarget: emergencyGoal?.targetAmount ?? monthlyExpenses * 6,
      goalProgressAvg,
      hasBudgets: currentBudgets.length > 0,
    };

    return computeHealthScore(metrics);
  },
};
