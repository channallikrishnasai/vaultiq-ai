import type { FinancialContext, MonthlyReport, Recommendation } from "./types";

export function generateMonthlyReport(ctx: FinancialContext): MonthlyReport {
  const now = new Date();
  const period = `${now.toLocaleString("en-IN", { month: "long" })} ${now.getFullYear()}`;

  const totalIncome = ctx.income.currentMonth || ctx.profile?.monthlyIncome || 0;
  const totalExpenses = ctx.expenses.currentMonth;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const achievements = generateAchievements(ctx, netSavings, savingsRate);
  const concerns = generateConcerns(ctx, netSavings, savingsRate);
  const goalStatus = generateGoalStatus(ctx);
  const healthBreakdown = ctx.healthScore.factors.map((f) => ({
    factor: f.name,
    score: f.score,
    maxScore: f.maxScore,
    tip: f.tip,
  }));
  const recommendations = generateReportRecommendations(ctx, netSavings, savingsRate);
  const nextMonthPriorities = generateNextMonthPriorities(ctx, concerns);

  return {
    period,
    generatedAt: now.toISOString(),
    summary: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      healthScore: ctx.healthScore.score,
      healthGrade: ctx.healthScore.grade,
    },
    achievements,
    concerns,
    goalStatus,
    healthBreakdown,
    recommendations,
    nextMonthPriorities,
  };
}

function generateAchievements(
  ctx: FinancialContext,
  netSavings: number,
  savingsRate: number,
): string[] {
  const achievements: string[] = [];

  if (netSavings > 0) {
    achievements.push(`Saved ₹${netSavings.toLocaleString("en-IN")} this month`);
  }

  if (savingsRate >= 20) {
    achievements.push(`Maintained excellent savings rate of ${savingsRate}%`);
  } else if (savingsRate >= 10) {
    achievements.push(`Maintained healthy savings rate of ${savingsRate}%`);
  }

  if (ctx.emergencyFund.status === "excellent") {
    achievements.push("Emergency fund is fully funded (6+ months)");
  } else if (ctx.emergencyFund.status === "adequate") {
    achievements.push("Emergency fund covers 3+ months of expenses");
  }

  const completedGoals = ctx.goals.filter((g) => g.percent >= 100);
  if (completedGoals.length > 0) {
    achievements.push(`Completed ${completedGoals.length} goal(s): ${completedGoals.map((g) => g.name).join(", ")}`);
  }

  const onTrackGoals = ctx.goals.filter((g) => g.percent < 100 && g.monthsToComplete !== null && g.monthsToComplete <= 12);
  if (onTrackGoals.length > 0) {
    achievements.push(`${onTrackGoals.length} goal(s) on track for completion within a year`);
  }

  if (ctx.healthScore.score >= 80) {
    achievements.push(`Excellent financial health score: ${ctx.healthScore.score}/100`);
  }

  if (ctx.fraud.highRiskCount === 0 && ctx.fraud.totalScans > 0) {
    achievements.push("No fraud alerts detected");
  }

  if (achievements.length === 0) {
    achievements.push("Maintained financial activity this month");
  }

  return achievements;
}

function generateConcerns(
  ctx: FinancialContext,
  netSavings: number,
  savingsRate: number,
): string[] {
  const concerns: string[] = [];

  if (netSavings < 0) {
    concerns.push(`Net loss of ₹${Math.abs(netSavings).toLocaleString("en-IN")} this month — spending exceeded income`);
  }

  if (savingsRate < 10 && netSavings >= 0) {
    concerns.push(`Low savings rate of ${savingsRate}% — below recommended 10% minimum`);
  }

  if (ctx.emergencyFund.status === "critical" || ctx.emergencyFund.status === "none") {
    concerns.push("Emergency fund is critically low — vulnerable to unexpected expenses");
  }

  const overdueGoals = ctx.goals.filter((g) => {
    if (!g.deadline) return false;
    return new Date(g.deadline) < new Date() && g.percent < 100;
  });
  if (overdueGoals.length > 0) {
    concerns.push(`${overdueGoals.length} goal(s) past deadline: ${overdueGoals.map((g) => g.name).join(", ")}`);
  }

  const overBudgetCategories = ctx.budgets.filter((b) => b.percentUsed > 100);
  if (overBudgetCategories.length > 0) {
    concerns.push(`Over budget in ${overBudgetCategories.length} category(ies): ${overBudgetCategories.map((b) => b.category).join(", ")}`);
  }

  if (ctx.fraud.highRiskCount > 0) {
    concerns.push(`${ctx.fraud.highRiskCount} high-risk fraud alert(s) need attention`);
  }

  if (ctx.healthScore.score < 50) {
    concerns.push(`Financial health score is low: ${ctx.healthScore.score}/100`);
  }

  if (ctx.cashFlow.monthlyNet < ctx.expenses.currentMonth * 0.1 && ctx.cashFlow.monthlyNet >= 0) {
    concerns.push("Thin cash flow margin — limited buffer for unexpected expenses");
  }

  return concerns;
}

function generateGoalStatus(ctx: FinancialContext): MonthlyReport["goalStatus"] {
  return ctx.goals.map((g) => {
    let projectedCompletion: string | null = null;
    if (g.monthsToComplete !== null) {
      const d = new Date();
      d.setMonth(d.getMonth() + g.monthsToComplete);
      projectedCompletion = d.toISOString().split("T")[0];
    } else if (g.deadline) {
      projectedCompletion = g.deadline.split("T")[0];
    }

    return {
      name: g.name,
      progress: g.percent,
      onTrack: g.monthsToComplete !== null && g.monthsToComplete <= 12,
      projectedCompletion,
    };
  });
}

function generateReportRecommendations(
  ctx: FinancialContext,
  netSavings: number,
  savingsRate: number,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (netSavings < 0) {
    recs.push({
      priority: 1,
      category: "monthly",
      action: "Review and cut unnecessary expenses to return to positive cash flow",
      reason: "Spending exceeded income this month.",
      impact: "Prevents savings depletion",
      effort: "high",
    });
  }

  if (savingsRate < 20) {
    const targetSavings = Math.ceil((ctx.profile?.monthlyIncome ?? 0) * 0.2);
    const currentSavings = netSavings;
    const gap = targetSavings - currentSavings;
    if (gap > 0) {
      recs.push({
        priority: 2,
        category: "monthly",
        action: `Increase savings by ₹${gap.toLocaleString("en-IN")} next month`,
        reason: `Current savings rate is ${savingsRate}%. Target: 20%.`,
        impact: "Accelerates goal progress and wealth building",
        effort: "medium",
      });
    }
  }

  if (ctx.emergencyFund.status !== "excellent" && ctx.emergencyFund.status !== "adequate") {
    recs.push({
      priority: 2,
      category: "monthly",
      action: "Allocate a portion of next month's savings to emergency fund",
      reason: "Emergency fund is below recommended levels.",
      impact: "Builds financial safety net",
      effort: "medium",
    });
  }

  for (const budget of ctx.budgets.filter((b) => b.percentUsed > 90)) {
    recs.push({
      priority: 3,
      category: "monthly",
      action: `Set stricter budget for ${budget.category} next month`,
      reason: `${budget.category} used ${budget.percentUsed}% of budget this month.`,
      impact: "Prevents overspending",
      effort: "low",
    });
  }

  return recs;
}

function generateNextMonthPriorities(
  ctx: FinancialContext,
  concerns: string[],
): string[] {
  const priorities: string[] = [];

  if (concerns.some((c) => c.includes("Net loss"))) {
    priorities.push("Return to positive cash flow by reducing non-essential spending");
  }

  if (ctx.emergencyFund.status === "critical" || ctx.emergencyFund.status === "none") {
    priorities.push("Build emergency fund — set aside at least ₹5,000");
  }

  const urgentGoals = ctx.goals.filter(
    (g) =>
      (g.monthsToComplete !== null && g.monthsToComplete > 12) ||
      (g.deadline !== null && new Date(g.deadline) < new Date() && g.percent < 100),
  );
  if (urgentGoals.length > 0) {
    priorities.push(`Focus on "${urgentGoals[0].name}" — currently at risk`);
  }

  const overBudget = ctx.budgets.filter((b) => b.percentUsed > 100);
  if (overBudget.length > 0) {
    priorities.push(`Bring ${overBudget.map((b) => b.category).join(", ")} back within budget`);
  }

  if (ctx.savings.savingsRate < 20) {
    priorities.push("Increase savings rate toward 20% target");
  }

  if (priorities.length === 0) {
    priorities.push("Maintain current financial discipline");
    priorities.push("Review goal progress and adjust timelines if needed");
  }

  return priorities.slice(0, 5);
}
