import type { RiskAppetite } from "@/generated/prisma/enums";

const GROWTH_RATES: Record<RiskAppetite, number> = {
  VERY_CONSERVATIVE: 0.05,
  CONSERVATIVE: 0.07,
  MODERATE: 0.10,
  GROWTH: 0.12,
  AGGRESSIVE: 0.15,
};

export interface PredictionInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsBalance: number;
  emergencyFund: number;
  emergencyFundTarget: number;
  investments: number;
  riskAppetite: RiskAppetite;
  goals: { name: string; target: number; current: number; deadline?: string | null }[];
  budgets: { category: string; limit: number; spent: number }[];
  recentTransactions: { amount: number; category: string; date: string }[];
}

export interface CashFlowPrediction {
  horizon: number;
  currentBalance: number;
  predictedBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  remainingBudget: number;
  monthlySavings: number;
  dailySpendingAllowance: number;
  confidence: number;
}

export interface GoalPrediction {
  name: string;
  target: number;
  current: number;
  remaining: number;
  percentComplete: number;
  estimatedCompletionDate: string | null;
  monthsRemaining: number | null;
  completionProbability: number;
  requiredMonthlyContribution: number;
  advice: string;
}

export interface BudgetPrediction {
  category: string;
  budget: number;
  predictedSpend: number;
  remaining: number;
  risk: "low" | "medium" | "high";
  warning: string | null;
}

export interface PortfolioPrediction {
  currentValue: number;
  predictedValue30d: number;
  predictedValue90d: number;
  predictedValue1y: number;
  riskDrift: number;
  diversificationScore: number;
  sipGrowth: number;
  allocationImbalance: string | null;
  recommendations: string[];
}

export interface PredictionAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  confidence: number;
  recommendedAction: string;
  category: string;
}

export interface TimelineEvent {
  date: string;
  label: string;
  type: "income" | "expense" | "goal" | "bill" | "insurance" | "tax" | "portfolio" | "budget" | "savings";
  amount: number | null;
  description: string;
  confidence: number;
}

export interface ScenarioResult {
  name: string;
  description: string;
  current: {
    netWorth: number;
    savingsRate: number;
    emergencyMonths: number;
    healthScore: number;
    goalProgress: number;
    monthlyBalance: number;
  };
  scenario: {
    netWorth: number;
    savingsRate: number;
    emergencyMonths: number;
    healthScore: number;
    goalProgress: number;
    monthlyBalance: number;
  };
  difference: {
    netWorth: number;
    savingsRate: number;
    emergencyMonths: number;
    healthScore: number;
    goalProgress: number;
    monthlyBalance: number;
  };
}

export interface PredictionResult {
  cashFlow: CashFlowPrediction[];
  goals: GoalPrediction[];
  budget: BudgetPrediction[];
  portfolio: PortfolioPrediction;
  alerts: PredictionAlert[];
  timeline: TimelineEvent[];
  generatedAt: string;
}

function getMonthlySavings(input: PredictionInput): number {
  return input.monthlyIncome - input.monthlyExpenses;
}

function getCategorySpend(input: PredictionInput, category: string): number {
  return input.recentTransactions
    .filter((t) => t.category.toLowerCase() === category.toLowerCase())
    .reduce((s, t) => s + t.amount, 0);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatMonth(date: Date): string {
  return date.toLocaleString("en-IN", { month: "short", year: "numeric" });
}

export const predictionEngine = {
  generateCashFlowPredictions(input: PredictionInput): CashFlowPrediction[] {
    const monthlySavings = getMonthlySavings(input);
    const currentBalance = input.savingsBalance;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dayOfMonth = new Date().getDate();
    const remainingDays = daysInMonth - dayOfMonth;

    const horizons = [7, 30, 90];
    return horizons.map((days) => {
      const months = days / 30;
      const expectedIncome = input.monthlyIncome * months;
      const expectedExpenses = input.monthlyExpenses * months;
      const predictedBalance = currentBalance + (monthlySavings * months);
      const remainingBudget = input.monthlyExpenses - input.recentTransactions.reduce((s, t) => s + t.amount, 0);
      const dailyAllowance = remainingDays > 0 ? remainingBudget / remainingDays : 0;

      const confidence = days <= 7 ? 0.92 : days <= 30 ? 0.82 : 0.68;

      return {
        horizon: days,
        currentBalance,
        predictedBalance: Math.round(predictedBalance),
        expectedIncome: Math.round(expectedIncome),
        expectedExpenses: Math.round(expectedExpenses),
        remainingBudget: Math.round(remainingBudget),
        monthlySavings: Math.round(monthlySavings),
        dailySpendingAllowance: Math.round(dailyAllowance),
        confidence,
      };
    });
  },

  generateGoalPredictions(input: PredictionInput): GoalPrediction[] {
    const monthlySavings = getMonthlySavings(input);
    const now = new Date();

    return input.goals.map((goal) => {
      const remaining = goal.target - goal.current;
      const percentComplete = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;

      let monthsRemaining: number | null = null;
      let estimatedCompletionDate: string | null = null;
      let completionProbability = 0;
      let requiredMonthlyContribution = 0;
      let advice = "";

      if (remaining <= 0) {
        completionProbability = 1;
        advice = "Goal achieved! Consider setting a new target.";
      } else if (monthlySavings > 0) {
        monthsRemaining = Math.ceil(remaining / monthlySavings);
        const completionDate = new Date(now);
        completionDate.setMonth(completionDate.getMonth() + monthsRemaining);
        estimatedCompletionDate = formatMonth(completionDate);
        requiredMonthlyContribution = monthlySavings;

        if (goal.deadline) {
          const deadline = new Date(goal.deadline);
          const monthsUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (monthsUntilDeadline > 0) {
            const requiredRate = remaining / monthsUntilDeadline;
            completionProbability = Math.min(1, monthlySavings / requiredRate);
            if (completionProbability >= 0.8) {
              advice = `On track to reach ${formatMonth(deadline)}.`;
            } else {
              const increase = Math.ceil(requiredRate - monthlySavings);
              advice = `Increase savings by ₹${increase.toLocaleString("en-IN")}/month to finish on time.`;
            }
          } else {
            completionProbability = 0.1;
            advice = "Goal is past its deadline. Consider adjusting the target.";
          }
        } else {
          completionProbability = monthlySavings > 0 ? 0.75 : 0.2;
          advice = `At current pace, you'll reach this goal in ${monthsRemaining} months.`;
        }
      } else {
        requiredMonthlyContribution = Math.ceil(remaining / 12);
        completionProbability = 0.05;
        advice = `Save ₹${requiredMonthlyContribution.toLocaleString("en-IN")}/month to reach this goal.`;
      }

      return {
        name: goal.name,
        target: goal.target,
        current: goal.current,
        remaining,
        percentComplete,
        estimatedCompletionDate,
        monthsRemaining,
        completionProbability: Math.round(completionProbability * 100) / 100,
        requiredMonthlyContribution: Math.round(requiredMonthlyContribution),
        advice,
      };
    });
  },

  generateBudgetPredictions(input: PredictionInput): BudgetPrediction[] {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgress = dayOfMonth / daysInMonth;

    return input.budgets.map((budget) => {
      const categorySpend = getCategorySpend(input, budget.category);
      const dailyRate = categorySpend / Math.max(dayOfMonth, 1);
      const predictedSpend = Math.round(dailyRate * daysInMonth);
      const remaining = budget.limit - predictedSpend;

      let risk: "low" | "medium" | "high" = "low";
      let warning: string | null = null;

      const spendRatio = budget.limit > 0 ? predictedSpend / budget.limit : 0;

      if (spendRatio > 1.1) {
        risk = "high";
        warning = `Predicted to exceed budget by ₹${Math.round(predictedSpend - budget.limit).toLocaleString("en-IN")}.`;
      } else if (spendRatio > 0.85) {
        risk = "medium";
        warning = `Approaching budget limit — ₹${Math.round(budget.limit - predictedSpend).toLocaleString("en-IN")} remaining.`;
      } else if (monthProgress > 0.5 && spendRatio < 0.3) {
        risk = "low";
        warning = `Spending is well under budget this month.`;
      }

      return {
        category: budget.category,
        budget: budget.limit,
        predictedSpend,
        remaining: Math.round(remaining),
        risk,
        warning,
      };
    });
  },

  generatePortfolioPrediction(input: PredictionInput): PortfolioPrediction {
    const rate = GROWTH_RATES[input.riskAppetite];
    const currentValue = input.investments;
    const monthlyRate = rate / 12;

    const predicted30d = Math.round(currentValue * (1 + monthlyRate));
    const predicted90d = Math.round(currentValue * Math.pow(1 + monthlyRate, 3));
    const predicted1y = Math.round(currentValue * (1 + rate));

    const riskDrift = input.riskAppetite === "AGGRESSIVE" ? 0.15 : input.riskAppetite === "GROWTH" ? 0.1 : 0.05;
    const diversificationScore = currentValue > 0 ? 0.6 : 0;
    const sipGrowth = currentValue > 0 ? Math.round(currentValue * rate) : 0;

    const recommendations: string[] = [];
    if (currentValue === 0) {
      recommendations.push("Start a SIP to begin building wealth systematically.");
    }
    if (riskDrift > 0.1) {
      recommendations.push("Portfolio risk is increasing — consider rebalancing.");
    }

    return {
      currentValue,
      predictedValue30d: predicted30d,
      predictedValue90d: predicted90d,
      predictedValue1y: predicted1y,
      riskDrift,
      diversificationScore,
      sipGrowth,
      allocationImbalance: currentValue > 0 ? null : null,
      recommendations,
    };
  },

  generateAlerts(input: PredictionInput): PredictionAlert[] {
    const alerts: PredictionAlert[] = [];
    const monthlySavings = getMonthlySavings(input);
    const emergencyMonths = input.monthlyExpenses > 0 ? input.emergencyFund / input.monthlyExpenses : 0;
    const now = new Date();

    if (emergencyMonths < 1 && input.monthlyExpenses > 0) {
      alerts.push({
        id: "emergency-critical",
        severity: "critical",
        title: "Emergency fund may fall below 1 month",
        message: `At current spending, your emergency fund covers only ${emergencyMonths.toFixed(1)} months.`,
        confidence: 0.9,
        recommendedAction: "Build emergency fund to at least 3 months of expenses.",
        category: "emergency",
      });
    }

    for (const goal of input.goals) {
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const monthsLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
        const remaining = goal.target - goal.current;
        if (monthsLeft > 0 && monthlySavings > 0) {
          const monthsToComplete = remaining / monthlySavings;
          if (monthsToComplete > monthsLeft * 1.2) {
            alerts.push({
              id: `goal-${goal.name}`,
              severity: "warning",
              title: `Goal "${goal.name}" likely to miss deadline`,
              message: `Estimated completion is ${Math.ceil(monthsToComplete)} months, but deadline is ${Math.ceil(monthsLeft)} months away.`,
              confidence: 0.75,
              recommendedAction: `Increase monthly contribution by ₹${Math.ceil((remaining / monthsLeft) - monthlySavings).toLocaleString("en-IN")}.`,
              category: "goal",
            });
          }
        }
      }
    }

    if (input.monthlyIncome > 0 && monthlySavings < input.monthlyIncome * 0.1) {
      alerts.push({
        id: "savings-declining",
        severity: "warning",
        title: "Savings rate below 10%",
        message: `Your savings rate is ${Math.round((monthlySavings / input.monthlyIncome) * 100)}% — well below the recommended 20%.`,
        confidence: 0.85,
        recommendedAction: "Review discretionary spending to increase savings.",
        category: "savings",
      });
    }

    for (const budget of input.budgets) {
      const categorySpend = getCategorySpend(input, budget.category);
      const dailyRate = categorySpend / Math.max(new Date().getDate(), 1);
      const predicted = dailyRate * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      if (predicted > budget.limit * 1.1) {
        alerts.push({
          id: `budget-${budget.category}`,
          severity: "warning",
          title: `Budget likely to exceed: ${budget.category}`,
          message: `Predicted spend: ₹${Math.round(predicted).toLocaleString("en-IN")} vs budget: ₹${budget.limit.toLocaleString("en-IN")}.`,
          confidence: 0.7,
          recommendedAction: `Reduce ${budget.category.toLowerCase()} spending by ₹${Math.round(predicted - budget.limit).toLocaleString("en-IN")}.`,
          category: "budget",
        });
      }
    }

    if (input.investments > 0 && input.investments > input.savingsBalance * 0.8) {
      alerts.push({
        id: "portfolio-concentrated",
        severity: "info",
        title: "Portfolio becoming concentrated",
        message: "High investment-to-savings ratio detected. Ensure adequate liquid reserves.",
        confidence: 0.6,
        recommendedAction: "Maintain at least 3 months of expenses in liquid savings.",
        category: "portfolio",
      });
    }

    if (emergencyMonths >= 6) {
      alerts.push({
        id: "emergency-strong",
        severity: "success",
        title: "Emergency fund is strong",
        message: `Your emergency fund covers ${emergencyMonths.toFixed(1)} months — above the 6-month target.`,
        confidence: 0.95,
        recommendedAction: "Consider investing surplus in growth instruments.",
        category: "emergency",
      });
    }

    return alerts;
  },

  generateTimeline(input: PredictionInput): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const now = new Date();
    const monthlySavings = getMonthlySavings(input);

    const salaryDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    if (input.monthlyIncome > 0) {
      events.push({
        date: formatDate(salaryDate),
        label: "Salary Expected",
        type: "income",
        amount: input.monthlyIncome,
        description: "Expected monthly salary credit",
        confidence: 0.9,
      });
    }

    if (monthlySavings > 0) {
      const savingsDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      events.push({
        date: formatDate(savingsDate),
        label: "Expected Savings",
        type: "savings",
        amount: monthlySavings,
        description: `Projected savings for ${formatMonth(savingsDate)}`,
        confidence: 0.8,
      });
    }

    const budgetReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    events.push({
      date: formatDate(budgetReset),
      label: "Budget Reset",
      type: "budget",
      amount: null,
      description: "Monthly budget cycle resets",
      confidence: 1,
    });

    for (const goal of input.goals) {
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        if (deadline > now) {
          events.push({
            date: formatDate(deadline),
            label: `Goal: ${goal.name}`,
            type: "goal",
            amount: goal.target - goal.current,
            description: `₹${(goal.target - goal.current).toLocaleString("en-IN")} remaining`,
            confidence: 0.7,
          });
        }
      }
    }

    const taxDate = new Date(now.getFullYear() + 1, 2, 31);
    events.push({
      date: formatDate(taxDate),
      label: "Tax Filing Deadline",
      type: "tax",
      amount: null,
      description: "Income tax return filing due",
      confidence: 1,
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  runScenario(
    input: PredictionInput,
    scenario: {
      extraMonthlySavings?: number;
      expenseReduction?: number;
      expenseCategory?: string;
      incomeIncrease?: number;
      oneTimeExpense?: number;
      stopSubscription?: number;
    },
    currentHealthScore: number,
  ): ScenarioResult {
    const monthlySavings = getMonthlySavings(input);
    const emergencyMonths = input.monthlyExpenses > 0 ? input.emergencyFund / input.monthlyExpenses : 0;

    const currentNetWorth = input.savingsBalance + input.investments;
    const currentSavingsRate = input.monthlyIncome > 0 ? Math.round((monthlySavings / input.monthlyIncome) * 100) : 0;

    let newIncome = input.monthlyIncome;
    let newExpenses = input.monthlyExpenses;

    if (scenario.incomeIncrease) {
      newIncome += scenario.incomeIncrease;
    }
    if (scenario.expenseReduction) {
      newExpenses -= scenario.expenseReduction;
    }
    if (scenario.stopSubscription) {
      newExpenses -= scenario.stopSubscription;
    }
    if (scenario.oneTimeExpense) {
      newExpenses += scenario.oneTimeExpense / 12;
    }

    const newMonthlySavings = newIncome - newExpenses;
    const newSavingsRate = newIncome > 0 ? Math.round((newMonthlySavings / newIncome) * 100) : 0;
    const newEmergencyMonths = newExpenses > 0 ? input.emergencyFund / newExpenses : 0;
    const newNetWorth = currentNetWorth + (newMonthlySavings - monthlySavings) * 12;

    const goalProgressIncrease = scenario.extraMonthlySavings
      ? Math.min(20, Math.round((scenario.extraMonthlySavings / input.goals.reduce((s, g) => s + (g.target - g.current), 0 || 1)) * 100))
      : 0;

    const healthScoreDelta = Math.round(
      ((newSavingsRate - currentSavingsRate) * 0.3) +
      ((newEmergencyMonths - emergencyMonths) * 2),
    );

    return {
      name: "Scenario",
      description: "What-if analysis",
      current: {
        netWorth: currentNetWorth,
        savingsRate: currentSavingsRate,
        emergencyMonths: Math.round(emergencyMonths * 10) / 10,
        healthScore: currentHealthScore,
        goalProgress: Math.round(input.goals.reduce((s, g) => s + (g.target > 0 ? (g.current / g.target) * 100 : 0), 0) / Math.max(input.goals.length, 1)),
        monthlyBalance: monthlySavings,
      },
      scenario: {
        netWorth: Math.round(newNetWorth),
        savingsRate: newSavingsRate,
        emergencyMonths: Math.round(newEmergencyMonths * 10) / 10,
        healthScore: Math.min(100, Math.max(0, currentHealthScore + healthScoreDelta)),
        goalProgress: Math.round(input.goals.reduce((s, g) => s + (g.target > 0 ? (g.current / g.target) * 100 : 0), 0) / Math.max(input.goals.length, 1)) + goalProgressIncrease,
        monthlyBalance: Math.round(newMonthlySavings),
      },
      difference: {
        netWorth: Math.round(newNetWorth - currentNetWorth),
        savingsRate: newSavingsRate - currentSavingsRate,
        emergencyMonths: Math.round((newEmergencyMonths - emergencyMonths) * 10) / 10,
        healthScore: healthScoreDelta,
        goalProgress: goalProgressIncrease,
        monthlyBalance: Math.round(newMonthlySavings - monthlySavings),
      },
    };
  },
};
