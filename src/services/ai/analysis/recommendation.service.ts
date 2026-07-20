import type { FinancialContext, Recommendation, Finding } from "./types";

interface AnalysisInputs {
  healthFindings: Finding[];
  goalFindings: Finding[];
  cashFlowFindings: Finding[];
  budgetFindings: Finding[];
  investmentFindings: Finding[];
  riskFindings: Finding[];
}

export function generateRecommendations(
  ctx: FinancialContext,
  inputs: AnalysisInputs,
): Recommendation[] {
  const allRecommendations: Recommendation[] = [];

  const addRec = (
    priority: Recommendation["priority"],
    category: string,
    action: string,
    reason: string,
    impact: string,
    effort: Recommendation["effort"],
  ) => {
    allRecommendations.push({ priority, category, action, reason, impact, effort });
  };

  // ── Savings ────────────────────────────────────────────────────────────────
  const savingsRate = ctx.savings.savingsRate;
  const monthlyNet = ctx.cashFlow.monthlyNet;

  if (savingsRate < 10) {
    addRec(
      1,
      "savings",
      "Increase monthly savings by at least ₹5,000",
      `Current savings rate is ${savingsRate}%, well below the recommended 20%.`,
      "Builds wealth and financial security",
      "high",
    );
  } else if (savingsRate < 20) {
    const gap = Math.ceil((ctx.profile?.monthlyIncome ?? 0) * 0.2 - ctx.expenses.currentMonth);
    if (gap > 0) {
      addRec(
        2,
        "savings",
        `Increase savings by ₹${gap.toLocaleString("en-IN")}/month to reach 20%`,
        `Current savings rate is ${savingsRate}%. Target: 20%.`,
        "Optimal wealth building pace",
        "medium",
      );
    }
  }

  // ── Emergency Fund ─────────────────────────────────────────────────────────
  if (ctx.emergencyFund.status === "critical" || ctx.emergencyFund.status === "none") {
    addRec(
      1,
      "emergency",
      `Build emergency fund to ₹${ctx.emergencyFund.target.toLocaleString("en-IN")}`,
      `Emergency fund covers only ${ctx.emergencyFund.monthsCovered} months. Target: 6 months.`,
      "Financial safety net",
      "high",
    );
  } else if (ctx.emergencyFund.status === "needs_work") {
    const needed = ctx.emergencyFund.target - ctx.emergencyFund.current;
    addRec(
      2,
      "emergency",
      `Add ₹${needed.toLocaleString("en-IN")} to emergency fund`,
      `Emergency fund is below target.`,
      "Improved financial resilience",
      "medium",
    );
  }

  // ── Goals ──────────────────────────────────────────────────────────────────
  for (const goal of ctx.goals) {
    if (goal.monthlyNeeded && goal.monthlyNeeded > monthlyNet * 0.5) {
      addRec(
        2,
        "goals",
        `Review timeline for "${goal.name}" — needs ₹${goal.monthlyNeeded.toLocaleString("en-IN")}/month`,
        `This goal requires ${Math.round((goal.monthlyNeeded / monthlyNet) * 100)}% of current monthly savings.`,
        "Realistic goal planning",
        "low",
      );
    }
  }

  // ── Budget ─────────────────────────────────────────────────────────────────
  for (const budget of ctx.budgets) {
    if (budget.percentUsed > 100) {
      addRec(
        1,
        "budget",
        `Reduce ${budget.category} spending by ₹${(budget.spent - budget.limit).toLocaleString("en-IN")}`,
        `${budget.category} is over budget.`,
        "Stays within financial plan",
        "medium",
      );
    } else if (budget.percentUsed > 85) {
      addRec(
        3,
        "budget",
        `Monitor ${budget.category} spending closely`,
        `${budget.category} is at ${budget.percentUsed}% of budget.`,
        "Prevents overspending",
        "low",
      );
    }
  }

  // ── Investment (Virtual Trading Portfolio) ────────────────────────────────
  if (!ctx.virtualPortfolio) {
    addRec(
      2,
      "virtual_investment",
      "Start practicing with Virtual Trading Lab",
      "No virtual portfolio found. Practice investment strategies with simulated money.",
      "Learn investing without real risk",
      "low",
    );
  } else if (ctx.virtualPortfolio) {
    const cashPercent =
      ctx.virtualPortfolio.totalValue > 0
        ? Math.round((ctx.virtualPortfolio.cashBalance / ctx.virtualPortfolio.totalValue) * 100)
        : 100;
    if (cashPercent > 50) {
      addRec(
        2,
        "virtual_investment",
        "Deploy excess virtual cash into simulated investments",
        `${cashPercent}% of your virtual portfolio is idle cash. Practice deploying capital.`,
      "Learn capital deployment strategies",
        "low",
      );
    }
  }

  // ── Fraud ──────────────────────────────────────────────────────────────────
  if (ctx.fraud.highRiskCount > 0) {
    addRec(
      1,
      "fraud",
      `Review ${ctx.fraud.highRiskCount} high-risk fraud alert(s) immediately`,
      "High-risk fraud alerts require immediate attention.",
      "Prevents financial losses",
      "low",
    );
  }

  // ── Specific Expense Reductions ────────────────────────────────────────────
  const highExpenseCategories = ctx.expenses.categories
    .filter((c) => c.percent > 25)
    .sort((a, b) => b.percent - a.percent);

  for (const cat of highExpenseCategories.slice(0, 2)) {
    const reduction = Math.ceil(cat.amount * 0.15);
    addRec(
      3,
      "expenses",
      `Reduce ${cat.name} spending by ₹${reduction.toLocaleString("en-IN")}/month`,
      `${cat.name} accounts for ${cat.percent}% of total expenses.`,
      "Frees up cash for savings/goals",
      "medium",
    );
  }

  // ── General ────────────────────────────────────────────────────────────────
  if (ctx.profile?.riskAppetite === "CONSERVATIVE" && ctx.savings.savingsRate > 30) {
    addRec(
      4,
      "investment",
      "Consider equity mutual funds for better returns",
      "High savings rate with conservative profile suggests room for growth investments.",
      "Potential for higher long-term returns",
      "medium",
    );
  }

  allRecommendations.sort((a, b) => a.priority - b.priority);

  return deduplicateRecommendations(allRecommendations);
}

function deduplicateRecommendations(recs: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  return recs.filter((r) => {
    const key = `${r.category}:${r.action.slice(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
