import type { FinancialContext, BudgetAnalysis, Recommendation } from "./types";

export function analyzeBudgets(ctx: FinancialContext): BudgetAnalysis {
  const { budgets, expenses } = ctx;

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const categories = budgets.map((b) => {
    let status: BudgetAnalysis["categories"][0]["status"];
    let insight: string;

    if (b.percentUsed <= 70) {
      status = "under";
      insight = `Well within budget. ₹${b.remaining.toLocaleString("en-IN")} remaining.`;
    } else if (b.percentUsed <= 90) {
      status = "on_track";
      insight = `On track. ₹${b.remaining.toLocaleString("en-IN")} remaining.`;
    } else if (b.percentUsed <= 100) {
      status = "over";
      insight = `Nearly exhausted. Only ₹${b.remaining.toLocaleString("en-IN")} left.`;
    } else {
      status = "critical";
      insight = `Over budget by ₹${Math.abs(b.remaining).toLocaleString("en-IN")}!`;
    }

    return {
      name: b.category,
      budget: b.limit,
      spent: b.spent,
      remaining: b.remaining,
      utilization: b.percentUsed,
      status,
      insight,
    };
  });

  const overBudgetCategories = categories
    .filter((c) => c.status === "over" || c.status === "critical")
    .map((c) => c.name);

  const savingsFromBudget = totalBudget - totalSpent;

  const recommendations: Recommendation[] = [];

  for (const cat of categories.filter((c) => c.status === "critical" || c.status === "over")) {
    const overspend = cat.spent - cat.budget;
    recommendations.push({
      priority: cat.status === "critical" ? 1 : 2,
      category: "budget",
      action: `Reduce ${cat.name} spending by ₹${overspend.toLocaleString("en-IN")}`,
      reason: `${cat.name} is ${cat.status === "critical" ? "over" : "nearing"} budget limit.`,
      impact: `Keeps total expenses within budget`,
      effort: "medium",
    });
  }

  if (utilization > 100) {
    recommendations.push({
      priority: 1,
      category: "budget",
      action: "Review all spending categories for savings opportunities",
      reason: `Total spending exceeds total budget by ₹${(totalSpent - totalBudget).toLocaleString("en-IN")}.`,
      impact: "Brings expenses back under control",
      effort: "high",
    });
  }

  const underutilized = categories.filter((c) => c.utilization < 50 && c.budget > 0);
  if (underutilized.length > 0) {
    const redirectable = underutilized.reduce((s, c) => s + (c.budget - c.spent), 0);
    recommendations.push({
      priority: 3,
      category: "budget",
      action: `Redirect ₹${redirectable.toLocaleString("en-IN")} from underutilized categories to savings or goals`,
      reason: `${underutilized.length} category(ies) are significantly under budget.`,
      impact: "Improves capital allocation efficiency",
      effort: "low",
    });
  }

  return {
    totalBudget,
    totalSpent,
    utilization,
    categories,
    overBudgetCategories,
    savingsFromBudget,
    recommendations,
  };
}
