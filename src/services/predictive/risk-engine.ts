import type { PredictionInput } from "./prediction-engine";

export interface RiskAssessment {
  overallRisk: "low" | "medium" | "high" | "critical";
  score: number;
  factors: { name: string; score: number; maxScore: number; status: "good" | "warning" | "danger"; detail: string }[];
  recommendations: string[];
}

export const riskEngine = {
  async assessRisk(input: PredictionInput): Promise<RiskAssessment> {
    const factors: RiskAssessment["factors"] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let maxTotal = 0;

    const monthlySavings = input.monthlyIncome - input.monthlyExpenses;
    const savingsRate = input.monthlyIncome > 0 ? (monthlySavings / input.monthlyIncome) * 100 : 0;
    const emergencyMonths = input.monthlyExpenses > 0 ? input.emergencyFund / input.monthlyExpenses : 0;

    const savingsScore = Math.min(100, savingsRate * 5);
    factors.push({
      name: "Savings Rate",
      score: Math.round(savingsScore),
      maxScore: 100,
      status: savingsRate >= 20 ? "good" : savingsRate >= 10 ? "warning" : "danger",
      detail: `${Math.round(savingsRate)}% savings rate`,
    });
    totalScore += savingsScore;
    maxTotal += 100;
    if (savingsRate < 20) recommendations.push("Increase savings rate to 20%+ of income.");

    const emergencyScore = Math.min(100, (emergencyMonths / 6) * 100);
    factors.push({
      name: "Emergency Fund",
      score: Math.round(emergencyScore),
      maxScore: 100,
      status: emergencyMonths >= 6 ? "good" : emergencyMonths >= 3 ? "warning" : "danger",
      detail: `Covers ${emergencyMonths.toFixed(1)} months`,
    });
    totalScore += emergencyScore;
    maxTotal += 100;
    if (emergencyMonths < 3) recommendations.push("Build emergency fund to at least 3 months of expenses.");

    const goalScore = input.goals.length > 0
      ? Math.min(100, input.goals.reduce((s, g) => s + (g.target > 0 ? (g.current / g.target) * 100 : 0), 0) / input.goals.length)
      : 50;
    factors.push({
      name: "Goal Progress",
      score: Math.round(goalScore),
      maxScore: 100,
      status: goalScore >= 50 ? "good" : goalScore >= 25 ? "warning" : "danger",
      detail: `${Math.round(goalScore)}% average progress`,
    });
    totalScore += goalScore;
    maxTotal += 100;

    const budgetScore = input.budgets.length > 0
      ? Math.min(100, input.budgets.reduce((s, b) => {
          const ratio = b.limit > 0 ? b.spent / b.limit : 0;
          return s + (ratio <= 1 ? 100 : Math.max(0, 100 - (ratio - 1) * 200));
        }, 0) / input.budgets.length)
      : 70;
    factors.push({
      name: "Budget Adherence",
      score: Math.round(budgetScore),
      maxScore: 100,
      status: budgetScore >= 80 ? "good" : budgetScore >= 50 ? "warning" : "danger",
      detail: `${Math.round(budgetScore)}% budget adherence`,
    });
    totalScore += budgetScore;
    maxTotal += 100;

    const investmentScore = input.investments > 0 ? 70 : 30;
    factors.push({
      name: "Investments",
      score: investmentScore,
      maxScore: 100,
      status: investmentScore >= 60 ? "good" : "warning",
      detail: input.investments > 0 ? `₹${input.investments.toLocaleString("en-IN")} invested` : "No investments",
    });
    totalScore += investmentScore;
    maxTotal += 100;
    if (input.investments === 0) recommendations.push("Start investing to grow wealth systematically.");

    const overallScore = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 50;
    const overallRisk: RiskAssessment["overallRisk"] =
      overallScore >= 70 ? "low" : overallScore >= 50 ? "medium" : overallScore >= 30 ? "high" : "critical";

    return {
      overallRisk,
      score: overallScore,
      factors,
      recommendations,
    };
  },
};
