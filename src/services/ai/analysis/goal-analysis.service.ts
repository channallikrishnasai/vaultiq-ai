import type { FinancialContext, GoalAnalysis, Finding, Recommendation } from "./types";

export function analyzeGoals(ctx: FinancialContext): GoalAnalysis {
  const { goals, savings, cashFlow, profile } = ctx;
  const monthlyIncome = profile?.monthlyIncome ?? 0;
  const currentMonthExpenses = ctx.expenses.currentMonth;
  const monthlySavings = cashFlow.monthlyNet;

  const analyzedGoals = goals.map((g) => {
    let risk: GoalAnalysis["goals"][0]["risk"];
    let insight: string;
    let projectedCompletion: string | null = null;

    const onTrack = g.monthsToComplete !== null && g.monthsToComplete <= 12;

    if (g.percent >= 100) {
      risk = "on_track";
      insight = `${g.name} is fully funded!`;
    } else if (g.monthsToComplete !== null && g.monthsToComplete <= 6) {
      risk = "on_track";
      insight = `On track to complete in ~${g.monthsToComplete} months.`;
      projectedCompletion = getProjectedDate(g.monthsToComplete);
    } else if (g.monthsToComplete !== null && g.monthsToComplete <= 12) {
      risk = "behind";
      insight = `Will take ~${g.monthsToComplete} months at current savings rate.`;
      projectedCompletion = getProjectedDate(g.monthsToComplete);
    } else if (g.deadline) {
      const deadline = new Date(g.deadline);
      const now = new Date();
      const monthsLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      if (g.remaining > 0 && monthlySavings > 0) {
        const needed = Math.ceil(g.remaining / monthsLeft);
        risk = needed > monthlySavings * 1.5 ? "critical" : "at_risk";
        insight = `Needs ₹${needed.toLocaleString("en-IN")}/month to meet deadline. Currently saving ₹${monthlySavings.toLocaleString("en-IN")}/month.`;
      } else {
        risk = "critical";
        insight = `No savings available to fund this goal. Needs ₹${g.remaining.toLocaleString("en-IN")} more.`;
      }
      projectedCompletion = g.deadline.split("T")[0];
    } else {
      if (monthlySavings > 0 && g.remaining > 0) {
        const months = Math.ceil(g.remaining / monthlySavings);
        risk = months > 24 ? "at_risk" : "behind";
        insight = `No deadline set. At current savings, will take ~${months} months.`;
        projectedCompletion = getProjectedDate(months);
      } else {
        risk = "critical";
        insight = `No deadline and insufficient savings to make progress.`;
      }
    }

    return {
      id: g.id,
      name: g.name,
      type: g.type,
      target: g.target,
      current: g.current,
      percent: g.percent,
      onTrack,
      monthsToComplete: g.monthsToComplete,
      monthlyNeeded: g.monthlyNeeded,
      projectedCompletion,
      risk,
      insight,
    };
  });

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  const recommendations: Recommendation[] = [];

  const criticalGoals = analyzedGoals.filter((g) => g.risk === "critical");
  if (criticalGoals.length > 0) {
    recommendations.push({
      priority: 1,
      category: "goals",
      action: `Prioritize critical goal: ${criticalGoals[0].name}`,
      reason: `${criticalGoals[0].name} is at risk and needs immediate attention.`,
      impact: "Prevents goal failure and financial stress",
      effort: "medium",
    });
  }

  if (analyzedGoals.length > 1) {
    const behindGoals = analyzedGoals.filter((g) => g.risk === "behind" || g.risk === "at_risk");
    if (behindGoals.length > 0) {
      recommendations.push({
        priority: 2,
        category: "goals",
        action: `Focus on one goal at a time`,
        reason: `Multiple goals are competing for resources. Consider prioritizing the most important one.`,
        impact: "Faster goal completion and reduced financial strain",
        effort: "low",
      });
    }
  }

  if (monthlySavings > 0 && goals.length > 0) {
    const smallGoals = analyzedGoals.filter((g) => g.percent > 50 && g.risk !== "on_track");
    if (smallGoals.length > 0) {
      recommendations.push({
        priority: 3,
        category: "goals",
        action: `Complete ${smallGoals[0].name} first (${smallGoals[0].percent}% done)`,
        reason: `Quick wins build momentum. This goal is already ${smallGoals[0].percent}% complete.`,
        impact: "Psychological boost and freed-up cash flow",
        effort: "low",
      });
    }
  }

  return {
    goals: analyzedGoals,
    overallProgress,
    totalTarget,
    totalCurrent,
    recommendations,
  };
}

function getProjectedDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}
