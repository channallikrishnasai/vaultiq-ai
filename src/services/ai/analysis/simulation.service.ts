import type { FinancialContext, SimulationResult, Finding, Recommendation } from "./types";

export interface WhatIfScenario {
  type: "income_change" | "expense_change" | "savings_target" | "new_expense" | "new_loan" | "custom";
  description: string;
  params: {
    incomeChange?: number;
    incomePercentChange?: number;
    expenseChange?: number;
    expensePercentChange?: number;
    savingsTarget?: number;
    newExpenseAmount?: number;
    newExpenseCategory?: string;
    loanAmount?: number;
    loanInterestRate?: number;
    loanTenureMonths?: number;
    customIncome?: number;
    customExpenses?: number;
  };
}

export function simulateScenario(
  ctx: FinancialContext,
  scenario: WhatIfScenario,
): SimulationResult {
  const modified = deepCloneContext(ctx);

  applyModifications(modified, scenario);

  const findings = compareContexts(ctx, modified);
  const recommendations = generateSimulationRecommendations(ctx, modified, scenario);

  const incomeChange = modified.income.currentMonth - ctx.income.currentMonth;
  const expenseChange = modified.expenses.currentMonth - ctx.expenses.currentMonth;
  const savingsChange = modified.cashFlow.monthlyNet - ctx.cashFlow.monthlyNet;
  const netWorthChange =
    (modified.savings.totalSaved + (modified.virtualPortfolio?.totalValue ?? 0)) -
    (ctx.savings.totalSaved + (ctx.virtualPortfolio?.totalValue ?? 0));

  return {
    scenario: scenario.type,
    description: scenario.description,
    originalContext: ctx,
    modifiedContext: modified,
    summary: {
      incomeChange,
      expenseChange,
      savingsChange,
      netWorthChange,
    },
    findings,
    recommendations,
  };
}

function applyModifications(ctx: FinancialContext, scenario: WhatIfScenario): void {
  const { params } = scenario;

  switch (scenario.type) {
    case "income_change": {
      if (params.incomeChange !== undefined) {
        ctx.income.currentMonth += params.incomeChange;
        ctx.profile!.monthlyIncome += params.incomeChange;
      }
      if (params.incomePercentChange !== undefined) {
        const factor = 1 + params.incomePercentChange / 100;
        ctx.income.currentMonth = Math.round(ctx.income.currentMonth * factor);
        ctx.profile!.monthlyIncome = Math.round(ctx.profile!.monthlyIncome * factor);
      }
      break;
    }
    case "expense_change": {
      if (params.expenseChange !== undefined) {
        ctx.expenses.currentMonth += params.expenseChange;
      }
      if (params.expensePercentChange !== undefined) {
        const factor = 1 + params.expensePercentChange / 100;
        ctx.expenses.currentMonth = Math.round(ctx.expenses.currentMonth * factor);
      }
      break;
    }
    case "savings_target": {
      if (params.savingsTarget !== undefined) {
        const currentSavings = ctx.income.currentMonth - ctx.expenses.currentMonth;
        if (params.savingsTarget > currentSavings) {
          const diff = params.savingsTarget - currentSavings;
          ctx.expenses.currentMonth = Math.max(0, ctx.expenses.currentMonth - diff);
        }
      }
      break;
    }
    case "new_expense": {
      if (params.newExpenseAmount !== undefined) {
        ctx.expenses.currentMonth += params.newExpenseAmount;
        const category = params.newExpenseCategory || "Other";
        const existing = ctx.expenses.categories.find((c) => c.name === category);
        if (existing) {
          existing.amount += params.newExpenseAmount;
          existing.percent = ctx.expenses.currentMonth > 0
            ? Math.round((existing.amount / ctx.expenses.currentMonth) * 100)
            : 0;
        } else {
          ctx.expenses.categories.push({
            name: category,
            amount: params.newExpenseAmount,
            percent: ctx.expenses.currentMonth > 0
              ? Math.round((params.newExpenseAmount / ctx.expenses.currentMonth) * 100)
              : 0,
          });
        }
      }
      break;
    }
    case "new_loan": {
      if (params.loanAmount !== undefined && params.loanTenureMonths !== undefined) {
        const monthlyRate = (params.loanInterestRate ?? 10) / 100 / 12;
        const tenure = params.loanTenureMonths;
        let emi: number;
        if (monthlyRate === 0) {
          emi = params.loanAmount / tenure;
        } else {
          emi =
            (params.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
            (Math.pow(1 + monthlyRate, tenure) - 1);
        }
        ctx.expenses.currentMonth += Math.round(emi);
      }
      break;
    }
    case "custom": {
      if (params.customIncome !== undefined) {
        ctx.income.currentMonth = params.customIncome;
        ctx.profile!.monthlyIncome = params.customIncome;
      }
      if (params.customExpenses !== undefined) {
        ctx.expenses.currentMonth = params.customExpenses;
      }
      break;
    }
  }

  recalculateCashFlow(ctx);
}

function recalculateCashFlow(ctx: FinancialContext): void {
  ctx.cashFlow.monthlyNet = ctx.income.currentMonth - ctx.expenses.currentMonth;
  if (ctx.expenses.currentMonth > 0) {
    ctx.savings.savingsRate = Math.round(
      (ctx.cashFlow.monthlyNet / ctx.income.currentMonth) * 100,
    );
  }
  if (ctx.emergencyFund.target > 0) {
    ctx.emergencyFund.monthsCovered =
      Math.round((ctx.emergencyFund.current / ctx.expenses.currentMonth) * 10) / 10;
  }
}

function compareContexts(original: FinancialContext, modified: FinancialContext): Finding[] {
  const findings: Finding[] = [];

  const incomeDiff = modified.income.currentMonth - original.income.currentMonth;
  if (incomeDiff !== 0) {
    findings.push({
      category: "simulation",
      severity: incomeDiff > 0 ? "positive" : "warning",
      title: `Income ${incomeDiff > 0 ? "increases" : "decreases"} by ₹${Math.abs(incomeDiff).toLocaleString("en-IN")}`,
      detail: `Monthly income changes from ₹${original.income.currentMonth.toLocaleString("en-IN")} to ₹${modified.income.currentMonth.toLocaleString("en-IN")}.`,
      metric: `₹${modified.income.currentMonth.toLocaleString("en-IN")}/month`,
    });
  }

  const expenseDiff = modified.expenses.currentMonth - original.expenses.currentMonth;
  if (expenseDiff !== 0) {
    findings.push({
      category: "simulation",
      severity: expenseDiff > 0 ? "warning" : "positive",
      title: `Expenses ${expenseDiff > 0 ? "increase" : "decrease"} by ₹${Math.abs(expenseDiff).toLocaleString("en-IN")}`,
      detail: `Monthly expenses change from ₹${original.expenses.currentMonth.toLocaleString("en-IN")} to ₹${modified.expenses.currentMonth.toLocaleString("en-IN")}.`,
      metric: `₹${modified.expenses.currentMonth.toLocaleString("en-IN")}/month`,
    });
  }

  const savingsDiff = modified.cashFlow.monthlyNet - original.cashFlow.monthlyNet;
  if (savingsDiff !== 0) {
    findings.push({
      category: "simulation",
      severity: savingsDiff > 0 ? "positive" : savingsDiff < -5000 ? "critical" : "warning",
      title: `Net savings ${savingsDiff > 0 ? "increase" : "decrease"} by ₹${Math.abs(savingsDiff).toLocaleString("en-IN")}`,
      detail: `Monthly net cash flow changes from ₹${original.cashFlow.monthlyNet.toLocaleString("en-IN")} to ₹${modified.cashFlow.monthlyNet.toLocaleString("en-IN")}.`,
      metric: `₹${modified.cashFlow.monthlyNet.toLocaleString("en-IN")}/month`,
    });
  }

  if (modified.cashFlow.monthlyNet < 0 && original.cashFlow.monthlyNet >= 0) {
    findings.push({
      category: "simulation",
      severity: "critical",
      title: "Scenario creates negative cash flow",
      detail: "This scenario would cause expenses to exceed income, depleting savings.",
      metric: `₹${modified.cashFlow.monthlyNet.toLocaleString("en-IN")}/month`,
    });
  }

  const emergencyDiff = modified.emergencyFund.monthsCovered - original.emergencyFund.monthsCovered;
  if (Math.abs(emergencyDiff) > 0.5) {
    findings.push({
      category: "simulation",
      severity: emergencyDiff > 0 ? "positive" : "warning",
      title: `Emergency fund runway ${emergencyDiff > 0 ? "extends" : "shrinks"} by ${Math.abs(emergencyDiff).toFixed(1)} months`,
      detail: `Emergency fund coverage changes from ${original.emergencyFund.monthsCovered} to ${modified.emergencyFund.monthsCovered} months.`,
      metric: `${modified.emergencyFund.monthsCovered} months`,
    });
  }

  return findings;
}

function generateSimulationRecommendations(
  original: FinancialContext,
  modified: FinancialContext,
  scenario: WhatIfScenario,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (modified.cashFlow.monthlyNet < 0) {
    recs.push({
      priority: 1,
      category: "simulation",
      action: "This scenario is not financially viable without additional income or savings",
      reason: "Negative cash flow would deplete savings rapidly.",
      impact: "Avoids financial crisis",
      effort: "high",
    });
  }

  if (modified.savings.savingsRate < 10 && modified.savings.savingsRate >= 0) {
    recs.push({
      priority: 2,
      category: "simulation",
      action: "Consider offsetting this scenario with expense reductions elsewhere",
      reason: `Savings rate drops to ${modified.savings.savingsRate}%, below the recommended 10% minimum.`,
      impact: "Maintains financial health",
      effort: "medium",
    });
  }

  if (scenario.type === "new_loan") {
    const emi = modified.expenses.currentMonth - original.expenses.currentMonth;
    const incomePercent = modified.income.currentMonth > 0
      ? Math.round((emi / modified.income.currentMonth) * 100)
      : 0;
    if (incomePercent > 40) {
      recs.push({
        priority: 1,
        category: "simulation",
        action: "EMI would exceed 40% of income — consider a smaller loan or longer tenure",
        reason: `EMI of ₹${emi.toLocaleString("en-IN")} is ${incomePercent}% of income.`,
        impact: "Prevents debt trap",
        effort: "medium",
      });
    }
  }

  if (scenario.type === "expense_change" && (scenario.params.expensePercentChange ?? 0) > 20) {
    recs.push({
      priority: 3,
      category: "simulation",
      action: "Large expense increases should be planned with advance saving",
      reason: "Significant expense increases can derail financial goals.",
      impact: "Maintains goal progress",
      effort: "medium",
    });
  }

  return recs;
}

function deepCloneContext(ctx: FinancialContext): FinancialContext {
  return JSON.parse(JSON.stringify(ctx));
}
