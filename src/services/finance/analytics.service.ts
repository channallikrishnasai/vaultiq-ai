import { expenseRepository } from "@/repositories/expense.repository";
import { budgetRepository } from "@/repositories/budget.repository";
import { goalRepository } from "@/repositories/goal.repository";

export const analyticsService = {
  async getAnalytics(userId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [expenses, budgets, goals, categoryTotals] = await Promise.all([
      expenseRepository.findAll(userId),
      budgetRepository.findAll(userId),
      goalRepository.findAll(userId),
      expenseRepository.getMonthlyTotals(userId, year, month),
    ]);

    const monthlyTotal = categoryTotals.reduce((sum, c) => sum + (c._sum.amount ?? 0), 0);
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - i, 1);
      const mExpenses = expenses.filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
      });
      return {
        month: d.toLocaleString("en", { month: "short", year: "numeric" }),
        total: mExpenses.reduce((s, e) => s + e.amount, 0),
      };
    }).reverse();

    const currentBudgets = budgets.filter((b) => b.month === month && b.year === year);
    const budgetVsActual = currentBudgets.map((b) => {
      const actual = categoryTotals.find((c) => c.category === b.category)?._sum.amount ?? 0;
      return {
        category: b.category,
        budget: b.limit,
        actual,
        remaining: b.limit - actual,
        percentUsed: b.limit > 0 ? Math.round((actual / b.limit) * 100) : 0,
      };
    });

    const goalSummary = goals.map((g) => ({
      id: g.id,
      name: g.name,
      progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
      type: g.type,
    }));

    return {
      monthlyTotal,
      categoryBreakdown: categoryTotals.map((c) => ({
        category: c.category,
        amount: c._sum.amount ?? 0,
        percentage: monthlyTotal > 0 ? Math.round(((c._sum.amount ?? 0) / monthlyTotal) * 100) : 0,
      })),
      spendingTrend: last6Months,
      budgetVsActual,
      goalSummary,
      totalExpenses: expenses.length,
      totalGoals: goals.length,
    };
  },
};
