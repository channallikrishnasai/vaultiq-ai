import { prisma } from "@/lib/prisma";
import { computeSavingsRate } from "@/lib/finance-utils";

export interface DailyBrief {
  greeting: string;
  summary: string;
  highlights: string[];
}

export interface SmartAlert {
  id: string;
  type: "warning" | "danger" | "success" | "info";
  title: string;
  message: string;
  action?: string;
}

export interface HealthExplanation {
  overall: string;
  factors: {
    name: string;
    passed: boolean;
    detail: string;
  }[];
}

export interface GoalForecast {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  percentComplete: number;
  projectedCompletionDate: string | null;
  monthlyContributionNeeded: number;
  onTrack: boolean;
  recommendation: string;
}

export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TwinInsight {
  profile: string;
  strengths: string[];
  weaknesses: string[];
  riskLevel: string;
  nextAction: string;
}

export interface DashboardIntelligence {
  dailyBrief: DailyBrief;
  smartAlerts: SmartAlert[];
  healthExplanation: HealthExplanation;
  goalForecasts: GoalForecast[];
  cashFlowTimeline: CashFlowMonth[];
  twinInsight: TwinInsight;
  emptyStates: string[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatMonth(date: Date): string {
  return date.toLocaleString("en-IN", { month: "short", year: "numeric" });
}

export async function generateIntelligence(userId: string): Promise<DashboardIntelligence> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [profile, expenses, incomes, goals, budgets, bills, portfolio, twin, fraudReports] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.expense.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.bill.findMany({ where: { userId } }),
      prisma.portfolio.findFirst({ where: { userId, isDefault: true } }),
      prisma.financialTwin.findFirst({ where: { userId, isActive: true } }),
      prisma.fraudReport.findMany({ where: { userId } }),
    ]);

  const monthlyIncome = profile?.income ?? 0;

  const currentMonthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d >= startOfMonth && d <= endOfMonth;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const currentMonthIncomes = incomes
    .filter((i) => {
      const d = new Date(i.date);
      return d >= startOfMonth && d <= endOfMonth;
    })
    .reduce((sum, i) => sum + i.amount, 0);

  const actualIncome = currentMonthIncomes > 0 ? currentMonthIncomes : monthlyIncome;
  const savingsRate = computeSavingsRate(actualIncome, currentMonthExpenses);
  const savingsBalance = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const investments = portfolio?.totalValue ?? 0;
  const emergencyGoal = goals.find((g) => g.type === "EMERGENCY");
  const emergencyCurrent = emergencyGoal?.currentAmount ?? 0;
  const emergencyTarget = emergencyGoal?.targetAmount ?? monthlyIncome * 6;
  const emergencyMonths = currentMonthExpenses > 0 ? emergencyCurrent / currentMonthExpenses : 0;

  const totalGoals = goals.length;
  const avgGoalProgress =
    totalGoals > 0
      ? goals.reduce((sum, g) => sum + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) /
        totalGoals
      : 0;

  const unpaidBills = bills.filter((b) => !b.paid);
  const totalUnpaid = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

  const highRiskFraud = fraudReports.filter((r) => r.riskScore > 60).length;

  // ── Cash flow timeline (last 6 months) ──────────────────────────────────────
  const cashFlowTimeline: CashFlowMonth[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const label = formatMonth(monthDate);

    const mExpenses = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d >= monthDate && d <= monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const mIncome = incomes
      .filter((inc) => {
        const d = new Date(inc.date);
        return d >= monthDate && d <= monthEnd;
      })
      .reduce((sum, inc) => sum + inc.amount, 0);

    const mIncomeFinal = i === 0 && actualIncome > 0 ? actualIncome : mIncome;

    cashFlowTimeline.push({
      month: label,
      income: mIncomeFinal,
      expenses: mExpenses,
      net: mIncomeFinal - mExpenses,
    });
  }

  // ── Daily Brief ─────────────────────────────────────────────────────────────
  const highlights: string[] = [];
  if (actualIncome > 0) {
    highlights.push(
      `You're saving ${savingsRate}% of your income each month.`,
    );
  }
  if (currentMonthExpenses > actualIncome && actualIncome > 0) {
    highlights.push(
      `Expenses exceed income by ₹${(currentMonthExpenses - actualIncome).toLocaleString("en-IN")} this month.`,
    );
  }

  const behindScheduleGoals = goals.filter((g) => {
    if (!g.deadline || g.targetAmount <= 0) return false;
    const deadline = new Date(g.deadline);
    const monthsLeft =
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const remaining = g.targetAmount - g.currentAmount;
    const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
    return monthlyNeeded > actualIncome * 0.5;
  });

  if (behindScheduleGoals.length > 0) {
    highlights.push(
      `${behindScheduleGoals.length} goal${behindScheduleGoals.length > 1 ? "s" : ""} may need more contributions to stay on track.`,
    );
  }

  if (emergencyMonths < 3 && emergencyCurrent > 0) {
    highlights.push(
      `Emergency fund covers ${emergencyMonths.toFixed(1)} months — aim for 6 months.`,
    );
  } else if (emergencyMonths >= 6) {
    highlights.push(
      `Emergency fund is solid at ${emergencyMonths.toFixed(1)} months of expenses.`,
    );
  }

  if (unpaidBills.length > 0) {
    highlights.push(
      `${unpaidBills.length} unpaid bill${unpaidBills.length > 1 ? "s" : ""} totaling ₹${totalUnpaid.toLocaleString("en-IN")}.`,
    );
  }

  if (highlights.length === 0) {
    if (actualIncome === 0 && currentMonthExpenses === 0) {
      highlights.push("Start tracking your income and expenses to unlock personalized insights.");
    } else {
      highlights.push("Your finances are looking steady — keep it up!");
    }
  }

  const summary =
    actualIncome > 0
      ? `You're earning ₹${actualIncome.toLocaleString("en-IN")}/month and spending ₹${currentMonthExpenses.toLocaleString("en-IN")}/month. Your savings rate is ${savingsRate}%.`
      : "Add your income and expenses to see a personalized financial summary.";

  const greeting = getGreeting();

  // ── Smart Alerts ────────────────────────────────────────────────────────────
  const smartAlerts: SmartAlert[] = [];

  if (actualIncome > 0 && currentMonthExpenses > actualIncome) {
    smartAlerts.push({
      id: "over-budget",
      type: "danger",
      title: "Expenses exceed income",
      message: `You've spent ₹${(currentMonthExpenses - actualIncome).toLocaleString("en-IN")} more than you earned this month.`,
      action: "Review spending",
    });
  }

  if (emergencyMonths < 3 && monthlyIncome > 0) {
    const gap = emergencyTarget - emergencyCurrent;
    smartAlerts.push({
      id: "emergency-low",
      type: "warning",
      title: "Emergency fund below target",
      message: `Your emergency fund is ₹${gap.toLocaleString("en-IN")} short of the recommended 6-month target.`,
      action: "Build emergency fund",
    });
  }

  if (savingsRate >= 20) {
    smartAlerts.push({
      id: "savings-good",
      type: "success",
      title: "Savings rate on track",
      message: `Great job! You're saving ${savingsRate}% of your income — above the 20% benchmark.`,
    });
  }

  const behindGoals = goals.filter((g) => {
    if (!g.deadline) return false;
    const deadline = new Date(g.deadline);
    const monthsLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const remaining = g.targetAmount - g.currentAmount;
    return monthsLeft > 0 && remaining / monthsLeft > actualIncome * 0.3;
  });

  if (behindGoals.length > 0) {
    smartAlerts.push({
      id: "goals-behind",
      type: "warning",
      title: "Goals behind schedule",
      message: `${behindGoals.map((g) => g.name).join(", ")} ${behindGoals.length > 1 ? "need" : "needs"} higher monthly contributions.`,
      action: "Adjust contributions",
    });
  }

  if (portfolio && investments > 0) {
    const cashPercent = portfolio.cashBalance / investments;
    if (cashPercent > 0.6) {
      smartAlerts.push({
        id: "allocation-imbalance",
        type: "info",
        title: "Investment allocation imbalance",
        message: `${Math.round(cashPercent * 100)}% of your portfolio is in cash. Consider investing more for growth.`,
        action: "Rebalance portfolio",
      });
    }
  }

  if (highRiskFraud > 0) {
    smartAlerts.push({
      id: "fraud-alerts",
      type: "danger",
      title: "High-risk fraud detected",
      message: `${highRiskFraud} suspicious content ${highRiskFraud > 1 ? "alerts" : "alert"} found. Review your fraud reports.`,
      action: "View reports",
    });
  }

  // ── Health Explanation ──────────────────────────────────────────────────────
  const savingsScore = actualIncome > 0 ? (actualIncome - currentMonthExpenses) / actualIncome : 0;
  const debtRatio = monthlyIncome > 0 ? 0 / (monthlyIncome * 12) : 1;
  const investScore = monthlyIncome > 0 ? investments / (monthlyIncome * 6) : 0;

  const healthExplanation: HealthExplanation = {
    overall: `Your financial health is ${savingsScore >= 0.2 && investScore >= 0.5 ? "strong" : savingsScore >= 0.1 ? "moderate" : "needs attention"}.`,
    factors: [
      {
        name: "Income Stability",
        passed: actualIncome > 0,
        detail: actualIncome > 0
          ? `Monthly income of ₹${actualIncome.toLocaleString("en-IN")} is ${actualIncome >= monthlyIncome * 0.9 ? "stable" : "variable"}.`
          : "No income recorded yet.",
      },
      {
        name: "Emergency Fund",
        passed: emergencyMonths >= 3,
        detail: emergencyMonths >= 6
          ? `Covers ${emergencyMonths.toFixed(1)} months — excellent safety net.`
          : emergencyMonths >= 3
            ? `Covers ${emergencyMonths.toFixed(1)} months — meets minimum target.`
            : emergencyCurrent > 0
              ? `Only covers ${emergencyMonths.toFixed(1)} months — aim for 6.`
              : "No emergency fund set up yet.",
      },
      {
        name: "Savings Rate",
        passed: savingsRate >= 20,
        detail: savingsRate >= 30
          ? `${savingsRate}% savings rate — outstanding.`
          : savingsRate >= 20
            ? `${savingsRate}% savings rate — on track.`
            : actualIncome > 0
              ? `${savingsRate}% savings rate — aim for 20%+.`
              : "Track your income to calculate savings rate.",
      },
      {
        name: "Goal Progress",
        passed: avgGoalProgress >= 25,
        detail: avgGoalProgress >= 50
          ? `Goals are ${Math.round(avgGoalProgress)}% complete — great progress.`
          : avgGoalProgress > 0
            ? `Goals are ${Math.round(avgGoalProgress)}% complete — keep going.`
            : totalGoals > 0
              ? "Goals are just getting started."
              : "No financial goals set yet.",
      },
      {
        name: "Debt Management",
        passed: debtRatio < 0.3,
        detail: debtRatio === 0
          ? "No outstanding debt — clean slate."
          : `Debt-to-income ratio is ${Math.round(debtRatio * 100)}%.`,
      },
    ],
  };

  // ── Goal Forecasts ──────────────────────────────────────────────────────────
  const goalForecasts: GoalForecast[] = goals.map((g) => {
    const remaining = g.targetAmount - g.currentAmount;
    const percentComplete = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;

    let monthsToComplete = 0;
    let monthlyContributionNeeded = 0;
    let projectedCompletionDate: string | null = null;

    if (remaining > 0 && actualIncome > 0) {
      const monthlySavings = actualIncome - currentMonthExpenses;
      if (monthlySavings > 0) {
        monthsToComplete = Math.ceil(remaining / monthlySavings);
        const completionDate = new Date(now);
        completionDate.setMonth(completionDate.getMonth() + monthsToComplete);
        projectedCompletionDate = formatMonth(completionDate);
        monthlyContributionNeeded = monthlySavings;
      } else {
        monthlyContributionNeeded = Math.ceil(remaining / 12);
      }
    }

    let onTrack = true;
    let recommendation = "";

    if (g.deadline) {
      const deadline = new Date(g.deadline);
      const monthsUntilDeadline =
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsUntilDeadline > 0) {
        const requiredMonthly = remaining / monthsUntilDeadline;
        const currentMonthly = actualIncome - currentMonthExpenses;
        onTrack = currentMonthly >= requiredMonthly * 0.8;

        if (!onTrack) {
          const increase = Math.ceil(requiredMonthly - currentMonthly);
          recommendation = `Increase monthly contribution by ₹${increase.toLocaleString("en-IN")} to meet your ${formatMonth(deadline)} deadline.`;
        } else {
          recommendation = `On track to reach ${formatMonth(deadline)}. Keep it up!`;
        }
      } else {
        onTrack = false;
        recommendation = "This goal is past its deadline. Consider extending or adjusting the target.";
      }
    } else if (remaining > 0) {
      recommendation = `Set a deadline to stay motivated. At current pace, this goal will be reached in ${monthsToComplete} months.`;
    } else {
      recommendation = "Goal achieved! Consider setting a new financial target.";
    }

    return {
      goalId: g.id,
      goalName: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      percentComplete,
      projectedCompletionDate,
      monthlyContributionNeeded,
      onTrack,
      recommendation,
    };
  });

  // ── Twin Insight ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (savingsRate >= 20) strengths.push(`Strong ${savingsRate}% savings rate`);
  else if (actualIncome > 0) weaknesses.push(`Savings rate is ${savingsRate}% — aim for 20%+`);

  if (emergencyMonths >= 6) strengths.push("Emergency fund fully funded");
  else if (emergencyMonths >= 3) strengths.push("Emergency fund meets minimum target");
  else if (emergencyCurrent > 0) weaknesses.push("Emergency fund needs growth");
  else weaknesses.push("No emergency fund established");

  if (investments > monthlyIncome * 3) strengths.push("Solid investment base");
  else if (monthlyIncome > 0) weaknesses.push("Investments are below 3x monthly income");

  if (totalGoals > 0 && avgGoalProgress > 30) strengths.push("Active goal progress");
  else if (totalGoals === 0) weaknesses.push("No financial goals set");

  if (debtRatio === 0) strengths.push("Debt-free");
  else if (debtRatio > 0.3) weaknesses.push("High debt-to-income ratio");

  const riskLabels: Record<string, string> = {
    VERY_CONSERVATIVE: "Very Conservative",
    CONSERVATIVE: "Conservative",
    MODERATE: "Moderate",
    GROWTH: "Growth",
    AGGRESSIVE: "Aggressive",
  };

  let riskLevel = "Moderate";
  if (profile?.riskAppetite) {
    riskLevel = riskLabels[profile.riskAppetite] || "Moderate";
  }

  let nextAction = "Complete your profile to get personalized recommendations.";
  if (actualIncome > 0) {
    if (emergencyMonths < 3) {
      nextAction = "Priority: Build your emergency fund to 3 months of expenses.";
    } else if (savingsRate < 20) {
      nextAction = "Focus on increasing your savings rate to 20%+.";
    } else if (investments < monthlyIncome * 3) {
      nextAction = "Consider starting a SIP to grow your investments.";
    } else if (behindGoals.length > 0) {
      nextAction = `Review progress on "${behindGoals[0].name}" and adjust contributions.`;
    } else {
      nextAction = "Your finances are well-managed. Consider exploring new investment opportunities.";
    }
  }

  const twinInsight: TwinInsight = {
    profile: profile?.occupation
      ? `${profile.occupation} earning ₹${actualIncome.toLocaleString("en-IN")}/month`
      : "Complete your profile for a personalized financial twin.",
    strengths,
    weaknesses,
    riskLevel,
    nextAction,
  };

  // ── Empty States ────────────────────────────────────────────────────────────
  const emptyStates: string[] = [];
  if (expenses.length === 0) emptyStates.push("Add your first expense to unlock spending insights.");
  if (goals.length === 0) emptyStates.push("Set a financial goal to start tracking your progress.");
  if (!portfolio) emptyStates.push("Create a portfolio to monitor your investments.");
  if (incomes.length === 0 && actualIncome === 0) emptyStates.push("Record your income to see a complete financial picture.");

  return {
    dailyBrief: {
      greeting,
      summary,
      highlights,
    },
    smartAlerts,
    healthExplanation,
    goalForecasts,
    cashFlowTimeline,
    twinInsight,
    emptyStates,
  };
}
