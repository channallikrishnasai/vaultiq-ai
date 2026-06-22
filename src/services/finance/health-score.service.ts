import { expenseRepository } from "@/repositories/expense.repository";
import { budgetRepository } from "@/repositories/budget.repository";
import { goalRepository } from "@/repositories/goal.repository";
import { userRepository } from "@/repositories/user.repository";

export interface HealthScoreResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  factors: { name: string; score: number; maxScore: number; tip: string }[];
  summary: string;
}

export const healthScoreService = {
  async calculate(userId: string): Promise<HealthScoreResult> {
    const now = new Date();
    const [expenses, budgets, goals, user] = await Promise.all([
      expenseRepository.findAll(userId),
      budgetRepository.findAll(userId),
      goalRepository.findAll(userId),
      userRepository.findById(userId),
    ]);

    const monthlyExpenses = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const income = user?.profile?.income ?? 50000;
    const savingsRate = income > 0 ? Math.max(0, (income - monthlyExpenses) / income) : 0;
    const savingsScore = Math.min(25, Math.round(savingsRate * 50));

    const currentBudgets = budgets.filter((b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear());
    const budgetAdherence = currentBudgets.length > 0 ? 20 : 10;
    const budgetScore = Math.min(25, budgetAdherence);

    const goalProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + Math.min(1, g.currentAmount / g.targetAmount), 0) / goals.length
      : 0;
    const goalScore = Math.min(25, Math.round(goalProgress * 25));

    const emergencyGoal = goals.find((g) => g.type === "EMERGENCY");
    const emergencyMonths = emergencyGoal
      ? emergencyGoal.currentAmount / (monthlyExpenses || 1)
      : 0;
    const emergencyScore = Math.min(25, Math.round(Math.min(emergencyMonths / 6, 1) * 25));

    const totalScore = savingsScore + budgetScore + goalScore + emergencyScore;
    const grade = totalScore >= 80 ? "A" : totalScore >= 65 ? "B" : totalScore >= 50 ? "C" : totalScore >= 35 ? "D" : "F";

    const factors = [
      { name: "Savings Rate", score: savingsScore, maxScore: 25, tip: savingsRate < 0.2 ? "Aim to save at least 20% of income" : "Great savings discipline!" },
      { name: "Budget Management", score: budgetScore, maxScore: 25, tip: currentBudgets.length === 0 ? "Set monthly budgets by category" : "Budgets are in place" },
      { name: "Goal Progress", score: goalScore, maxScore: 25, tip: goals.length === 0 ? "Create financial goals to track progress" : "Keep contributing to your goals" },
      { name: "Emergency Fund", score: emergencyScore, maxScore: 25, tip: emergencyMonths < 3 ? "Build 3-6 months of expenses as emergency fund" : "Strong emergency cushion" },
    ];

    return {
      score: totalScore,
      grade,
      factors,
      summary: `Your financial health score is ${totalScore}/100 (Grade ${grade}). ${totalScore >= 65 ? "You're on a solid path." : "Focus on savings and emergency fund building."}`,
    };
  },
};
