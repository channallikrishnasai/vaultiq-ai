import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { expenseRepository } from "@/repositories/expense.repository";
import { budgetRepository } from "@/repositories/budget.repository";
import { tradingRepository } from "@/repositories/trading.repository";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [expenses, budgets, portfolios, incomes] = await Promise.all([
      expenseRepository.findAll(userId),
      budgetRepository.findAll(userId),
      tradingRepository.getPortfolios(userId),
      prisma.income.findMany({ where: { userId }, select: { amount: true, date: true } }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);

    const defaultPortfolio = portfolios.find(p => p.isDefault) || portfolios[0];
    const portfolioValue = defaultPortfolio ? defaultPortfolio.totalValue : 0;

    // Categorized spending
    const categories: Record<string, number> = {};
    expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    const categorySummary = Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));

    // Historical monthly statements
    const now = new Date();
    const statements = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      statements.push({
        id: `stmt_${date.getFullYear()}_${date.getMonth() + 1}`,
        month: label,
        status: "Available",
        size: `${(150 + (i * 24) % 100).toFixed(1)} KB`,
        type: "PDF",
      });
    }

    // Monthly Trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const label = d.toLocaleDateString("en-US", { month: "short" });

      const monthExpenses = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed.getFullYear() === year && ed.getMonth() === monthIdx;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const monthIncome = incomes
        .filter(inc => {
          const id = new Date(inc.date);
          return id.getFullYear() === year && id.getMonth() === monthIdx;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);

      monthlyTrend.push({
        month: label,
        income: monthIncome,
        expenses: monthExpenses,
      });
    }

    return successResponse({
      summary: {
        totalExpenses,
        totalBudgetLimit,
        portfolioValue,
        netSavings: Math.max(0, totalIncome - totalExpenses),
      },
      categorySummary,
      statements,
      monthlyTrend,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
