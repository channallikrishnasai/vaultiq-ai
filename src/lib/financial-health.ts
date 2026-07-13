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
  const spendScore = Math.min(100, Math.max(0, Math.round((1 - expenseRatio) * 100)));
  const planScore = Math.min(100, Math.round(metrics.goalProgressAvg));

  const factors = [
    {
      name: "Savings Rate",
      score: savingsScore,
      maxScore: 100,
      tip:
        savingsRate < 0.2
          ? "Aim to save at least 20% of income"
          : `Strong ${Math.round(savingsRate * 100)}% savings rate — keep it up!`,
    },
    {
      name: "Debt Management",
      score: debtScore,
      maxScore: 100,
      tip:
        metrics.debt > metrics.savingsBalance
          ? "Prioritize paying down high-interest debt"
          : "Debt levels are manageable relative to savings",
    },
    {
      name: "Investments",
      score: investScore,
      maxScore: 100,
      tip:
        metrics.investments < metrics.monthlyIncome * 3
          ? "Start or increase SIP investments for long-term growth"
          : "Healthy investment base — consider rebalancing quarterly",
    },
    {
      name: "Emergency Fund",
      score: protectScore,
      maxScore: 100,
      tip:
        emergencyMonths < 3
          ? "Build 3–6 months of expenses as emergency fund"
          : `${emergencyMonths.toFixed(1)} months covered — solid safety net`,
    },
    {
      name: "Spending Control",
      score: spendScore,
      maxScore: 100,
      tip:
        expenseRatio > 0.9
          ? "Expenses consume most of your income — look for cuts"
          : `Spending ${Math.round(expenseRatio * 100)}% of income — room to optimize`,
    },
    {
      name: "Goal Planning",
      score: planScore,
      maxScore: 100,
      tip:
        metrics.goalProgressAvg < 30
          ? "Set clear financial goals and track progress"
          : `Goal progress averaging ${Math.round(metrics.goalProgressAvg)}% — stay consistent`,
    },
  ];

  const score = Math.round(
    factors.reduce((sum, f) => sum + f.score, 0) / factors.length,
  );

  const breakdown: HealthBreakdownItem[] = factors.map((f) => ({
    name: f.name,
    value: f.score,
  }));

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
