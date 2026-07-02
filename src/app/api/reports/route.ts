import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { expenseRepository } from "@/repositories/expense.repository";
import { budgetRepository } from "@/repositories/budget.repository";
import { tradingRepository } from "@/repositories/trading.repository";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Fetch expenses
    const expenses = await expenseRepository.findAll(userId);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Fetch budgets
    const budgets = await budgetRepository.findAll(userId);
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);

    // Fetch trading portfolio
    const portfolios = await tradingRepository.getPortfolios(userId);
    const defaultPortfolio = portfolios.find(p => p.isDefault) || portfolios[0];
    const portfolioValue = defaultPortfolio ? defaultPortfolio.totalValue : 100000;

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

    return successResponse({
      summary: {
        totalExpenses,
        totalBudgetLimit,
        portfolioValue,
        netSavings: Math.max(0, 150000 - totalExpenses), // Assuming mock income or baseline
      },
      categorySummary,
      statements,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
