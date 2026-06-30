import { DEMO_PROFILE } from "@/lib/demo-profile";

export interface HealthBreakdownItem {
  name: string;
  value: number;
}

export interface HealthScoreResult {
  score: number;
  label: string;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: HealthBreakdownItem[];
  factors: { name: string; score: number; maxScore: number; tip: string }[];
  summary: string;
}

export interface HealthMetrics {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsBalance: number;
  investments: number;
  debt: number;
  emergencyFundCurrent: number;
  emergencyFundTarget: number;
  goalProgressAvg: number;
  hasBudgets: boolean;
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Needs Work";
  return "Getting Started";
}

function scoreGrade(score: number): HealthScoreResult["grade"] {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

export function computeHealthScore(metrics: HealthMetrics): HealthScoreResult {
  const savingsRate =
    metrics.monthlyIncome > 0
      ? (metrics.monthlyIncome - metrics.monthlyExpenses) / metrics.monthlyIncome
      : 0;

  const savingsScore = Math.min(100, Math.max(0, Math.round(savingsRate * 200)));
  const debtRatio =
    metrics.monthlyIncome > 0 ? metrics.debt / (metrics.monthlyIncome * 12) : 1;
  const debtScore = Math.min(100, Math.max(0, Math.round((1 - Math.min(debtRatio, 1)) * 100)));
  const investScore = Math.min(
    100,
    Math.max(0, Math.round((metrics.investments / Math.max(metrics.monthlyIncome * 6, 1)) * 100)),
  );
  const emergencyMonths =
    metrics.monthlyExpenses > 0
      ? metrics.emergencyFundCurrent / metrics.monthlyExpenses
      : 0;
  const protectScore = Math.min(100, Math.round(Math.min(emergencyMonths / 6, 1) * 100));
  const expenseRatio =
    metrics.monthlyIncome > 0 ? metrics.monthlyExpenses / metrics.monthlyIncome : 1;
  const spendScore = Math.min(100, Math.max(0, Math.round((1 - expenseRatio) * 100 + 30)));
  const planScore = Math.min(100, Math.round(metrics.goalProgressAvg));

  const breakdown: HealthBreakdownItem[] = [
    { name: "Savings", value: savingsScore },
    { name: "Debt", value: debtScore },
    { name: "Invest", value: investScore },
    { name: "Protect", value: protectScore },
    { name: "Spend", value: spendScore },
    { name: "Plan", value: planScore },
  ];

  const score = Math.round(
    breakdown.reduce((sum, item) => sum + item.value, 0) / breakdown.length,
  );

  const factors = [
    {
      name: "Savings Rate",
      score: Math.round(savingsScore * 0.25),
      maxScore: 25,
      tip:
        savingsRate < 0.2
          ? "Aim to save at least 20% of income"
          : `Strong ${Math.round(savingsRate * 100)}% savings rate — keep it up!`,
    },
    {
      name: "Debt Management",
      score: Math.round(debtScore * 0.25),
      maxScore: 25,
      tip:
        metrics.debt > metrics.savingsBalance
          ? "Prioritize paying down high-interest debt"
          : "Debt levels are manageable relative to savings",
    },
    {
      name: "Investments",
      score: Math.round(investScore * 0.25),
      maxScore: 25,
      tip:
        metrics.investments < metrics.monthlyIncome * 3
          ? "Start or increase SIP investments for long-term growth"
          : "Healthy investment base — consider rebalancing quarterly",
    },
    {
      name: "Emergency Fund",
      score: Math.round(protectScore * 0.25),
      maxScore: 25,
      tip:
        emergencyMonths < 3
          ? "Build 3–6 months of expenses as emergency fund"
          : `${emergencyMonths.toFixed(1)} months covered — solid safety net`,
    },
  ];

  return {
    score,
    label: scoreLabel(score),
    grade: scoreGrade(score),
    breakdown,
    factors,
    summary: `Your financial health score is ${score}/100 (Grade ${scoreGrade(score)}). ${
      score >= 65
        ? "You're on a solid path — keep optimizing."
        : "Focus on savings, debt, and your emergency fund."
    }`,
  };
}

export function getDemoHealthMetrics(): HealthMetrics {
  const goals = Object.values(DEMO_PROFILE.goals);
  const goalProgressAvg =
    goals.reduce((sum, g) => sum + Math.min(100, (g.current / g.target) * 100), 0) /
    goals.length;

  return {
    monthlyIncome: DEMO_PROFILE.monthlyIncome,
    monthlyExpenses: DEMO_PROFILE.monthlyExpenses,
    savingsBalance: DEMO_PROFILE.savingsBalance,
    investments: DEMO_PROFILE.investments,
    debt: DEMO_PROFILE.debt,
    emergencyFundCurrent: DEMO_PROFILE.goals.emergency.current,
    emergencyFundTarget: DEMO_PROFILE.goals.emergency.target,
    goalProgressAvg,
    hasBudgets: true,
  };
}

export function getDemoHealthScore(): HealthScoreResult {
  return computeHealthScore(getDemoHealthMetrics());
}
