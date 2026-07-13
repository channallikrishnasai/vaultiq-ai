import type { FinancialContext, CashFlowAnalysis, Finding, Recommendation } from "./types";

export function analyzeCashFlow(ctx: FinancialContext): CashFlowAnalysis {
  const { cashFlow, income, expenses, profile, emergencyFund } = ctx;
  const monthlyIncome = profile?.monthlyIncome ?? 0;
  const currentMonthExpenses = expenses.currentMonth;
  const monthlyNet = cashFlow.monthlyNet;
  const emergencyMonths = cashFlow.emergencyMonths;

  const incomeStability = assessIncomeStability(income);
  const expenseStability = assessExpenseStability(expenses);
  const runway = currentMonthExpenses > 0 ? (emergencyFund.current + monthlyNet * 12) / currentMonthExpenses : 999;

  const trends: CashFlowAnalysis["trends"] = [];

  if (monthlyIncome > 0) {
    const savingsRate = ctx.savings.savingsRate;
    trends.push({
      label: "Savings Rate",
      value: savingsRate,
      trend: savingsRate >= 20 ? "improving" : savingsRate >= 10 ? "stable" : "declining",
    });
  }

  if (emergencyMonths > 0) {
    trends.push({
      label: "Emergency Fund (months)",
      value: emergencyMonths,
      trend: emergencyMonths >= 6 ? "improving" : emergencyMonths >= 3 ? "stable" : "declining",
    });
  }

  if (monthlyNet !== 0) {
    trends.push({
      label: "Monthly Net Cash Flow",
      value: monthlyNet,
      trend: monthlyNet > 0 ? "improving" : "declining",
    });
  }

  const risks: Finding[] = [];
  const recommendations: Recommendation[] = [];

  if (monthlyNet < 0) {
    risks.push({
      category: "cashflow",
      severity: "critical",
      title: "Negative cash flow",
      detail: `Spending exceeds income by ₹${Math.abs(monthlyNet).toLocaleString("en-IN")}/month. This is unsustainable.`,
      metric: `₹${monthlyNet.toLocaleString("en-IN")}/month`,
    });
    recommendations.push({
      priority: 1,
      category: "cashflow",
      action: "Reduce expenses or increase income immediately",
      reason: "Negative cash flow depletes savings rapidly",
      impact: "Stops financial bleeding",
      effort: "high",
    });
  } else if (monthlyNet < currentMonthExpenses * 0.1) {
    risks.push({
      category: "cashflow",
      severity: "warning",
      title: "Thin cash flow margin",
      detail: `Net cash flow is only ₹${monthlyNet.toLocaleString("en-IN")}/month (${Math.round((monthlyNet / currentMonthExpenses) * 100)}% of expenses).`,
      metric: `₹${monthlyNet.toLocaleString("en-IN")}/month`,
      benchmark: "At least 10% of expenses",
    });
    recommendations.push({
      priority: 2,
      category: "cashflow",
      action: "Build a larger cash buffer",
      reason: "Thin margins leave no room for unexpected expenses",
      impact: "Increased financial resilience",
      effort: "medium",
    });
  }

  if (emergencyMonths < 3) {
    risks.push({
      category: "cashflow",
      severity: "warning",
      title: "Insufficient emergency runway",
      detail: `Emergency fund covers only ${emergencyMonths} months. Recommended: 6 months.`,
      metric: `${emergencyMonths} months`,
      benchmark: "6 months",
    });
  }

  if (incomeStability === "variable") {
    risks.push({
      category: "cashflow",
      severity: "neutral",
      title: "Variable income detected",
      detail: "Income sources are inconsistent. Consider building a larger emergency buffer.",
      metric: "Variable",
    });
  }

  if (expenseStability === "increasing") {
    risks.push({
      category: "cashflow",
      severity: "warning",
      title: "Rising expense trend",
      detail: "Expenses appear to be increasing. Monitor closely to prevent lifestyle creep.",
      metric: "Increasing",
    });
    recommendations.push({
      priority: 3,
      category: "cashflow",
      action: "Track expense trends monthly",
      reason: "Rising expenses can erode savings over time",
      impact: "Maintains savings rate",
      effort: "low",
    });
  }

  return {
    monthlyNet,
    incomeStability,
    expenseStability,
    emergencyMonths,
    runway,
    trends,
    risks,
    recommendations,
  };
}

function assessIncomeStability(income: FinancialContext["income"]): CashFlowAnalysis["incomeStability"] {
  if (income.sources.length <= 1) return "stable";
  const amounts = income.sources.map((s) => s.amount);
  const max = Math.max(...amounts);
  const min = Math.min(...amounts);
  if (max === 0) return "stable";
  const variance = (max - min) / max;
  if (variance < 0.2) return "stable";
  if (variance < 0.5) return "variable";
  return "declining";
}

function assessExpenseStability(expenses: FinancialContext["expenses"]): CashFlowAnalysis["expenseStability"] {
  if (expenses.recentTransactions.length < 3) return "stable";
  const amounts = expenses.recentTransactions.map((t) => t.amount);
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const recent = amounts.slice(0, 3);
  const recentAvg = recent.reduce((s, a) => s + a, 0) / recent.length;
  if (recentAvg > avg * 1.2) return "increasing";
  if (recentAvg < avg * 0.8) return "volatile";
  return "stable";
}
