import type { FinancialContext, AnalysisResult, Finding, Recommendation } from "./types";
import { analyzeHealth } from "./health-analysis.service";
import { analyzeGoals } from "./goal-analysis.service";
import { analyzeCashFlow } from "./cashflow-analysis.service";
import { analyzeBudgets } from "./budget-analysis.service";
import { analyzeInvestments } from "./investment-analysis.service";
import { analyzeRisks } from "./risk-analysis.service";
import { generateRecommendations } from "./recommendation.service";

export { analyzeHealth } from "./health-analysis.service";
export { analyzeGoals } from "./goal-analysis.service";
export { analyzeCashFlow } from "./cashflow-analysis.service";
export { analyzeBudgets } from "./budget-analysis.service";
export { analyzeInvestments } from "./investment-analysis.service";
export { analyzeRisks } from "./risk-analysis.service";
export { generateRecommendations } from "./recommendation.service";
export { simulateScenario, type WhatIfScenario } from "./simulation.service";
export { generateMonthlyReport } from "./monthly-report.service";
export type {
  AnalysisResult,
  Finding,
  Recommendation,
  Projection,
  SimulationResult,
  MonthlyReport,
  HealthAnalysis,
  GoalAnalysis,
  CashFlowAnalysis,
  BudgetAnalysis,
  InvestmentAnalysis,
  RiskAnalysis,
} from "./types";

export function runFullAnalysis(ctx: FinancialContext): AnalysisResult {
  const health = analyzeHealth(ctx);
  const goals = analyzeGoals(ctx);
  const cashFlow = analyzeCashFlow(ctx);
  const budgets = analyzeBudgets(ctx);
  const investments = analyzeInvestments(ctx);
  const risks = analyzeRisks(ctx);

  const allFindings: Finding[] = [
    ...health.strengths,
    ...health.weaknesses,
    ...cashFlow.risks,
    ...risks.findings,
    ...investments.recommendations.map((r) => ({
      category: r.category,
      severity: (r.priority <= 2 ? "warning" : "neutral") as Finding["severity"],
      title: r.action,
      detail: r.reason,
    })),
  ];

  const strengths = allFindings.filter((f) => f.severity === "positive");
  const weaknesses = allFindings.filter((f) => f.severity === "warning" || f.severity === "neutral");
  const risksList = allFindings.filter((f) => f.severity === "critical" || f.severity === "warning");

  const recommendations = generateRecommendations(ctx, {
    healthFindings: [...health.strengths, ...health.weaknesses],
    goalFindings: goals.recommendations.map((r) => ({
      category: r.category,
      severity: "neutral" as Finding["severity"],
      title: r.action,
      detail: r.reason,
    })),
    cashFlowFindings: cashFlow.risks,
    budgetFindings: budgets.recommendations.map((r) => ({
      category: r.category,
      severity: "neutral" as Finding["severity"],
      title: r.action,
      detail: r.reason,
    })),
    investmentFindings: investments.recommendations.map((r) => ({
      category: r.category,
      severity: "neutral" as Finding["severity"],
      title: r.action,
      detail: r.reason,
    })),
    riskFindings: risks.findings,
  });

  const projections = generateProjections(ctx);
  const actionPlan = generateActionPlan(recommendations);

  const summaryParts: string[] = [];
  summaryParts.push(`Health Score: ${health.overallScore}/100 (${health.grade})`);
  summaryParts.push(`Monthly Net: ₹${ctx.cashFlow.monthlyNet.toLocaleString("en-IN")}`);
  summaryParts.push(`Savings Rate: ${ctx.savings.savingsRate}%`);
  summaryParts.push(`Emergency Fund: ${ctx.emergencyFund.monthsCovered} months`);
  if (ctx.virtualPortfolio) {
    summaryParts.push(`Virtual Portfolio: ₹${ctx.virtualPortfolio.totalValue.toLocaleString("en-IN")}`);
  }

  return {
    summary: summaryParts.join(" | "),
    strengths,
    weaknesses,
    risks: risksList,
    opportunities: allFindings.filter((f) => f.severity === "positive" && f.category === "simulation"),
    recommendations,
    projections,
    actionPlan,
  };
}

function generateProjections(ctx: FinancialContext): AnalysisResult["projections"] {
  const projections: AnalysisResult["projections"] = [];
  const monthlySavings = ctx.cashFlow.monthlyNet;

  if (monthlySavings > 0) {
    projections.push({
      label: "Emergency Fund Completion",
      current: ctx.emergencyFund.current,
      projected: ctx.emergencyFund.target,
      timeframe: ctx.emergencyFund.target > 0
        ? `${Math.ceil((ctx.emergencyFund.target - ctx.emergencyFund.current) / monthlySavings)} months`
        : "N/A",
      assumption: `Based on ₹${monthlySavings.toLocaleString("en-IN")}/month savings`,
    });
  }

  for (const goal of ctx.goals) {
    if (goal.remaining > 0 && monthlySavings > 0) {
      projections.push({
        label: goal.name,
        current: goal.current,
        projected: goal.target,
        timeframe: goal.monthsToComplete
          ? `${goal.monthsToComplete} months`
          : goal.deadline
            ? `By ${goal.deadline.split("T")[0]}`
            : "Unknown",
        assumption: `Needs ₹${goal.monthlyNeeded?.toLocaleString("en-IN") ?? "N/A"}/month`,
      });
    }
  }

  if (ctx.twin.projections) {
    projections.push({
      label: "Net Worth (1 Year) - Real Assets Only",
      current: ctx.savings.totalSaved, // Exclude virtual portfolio
      projected: ctx.twin.projections.oneYear,
      timeframe: "1 year",
      assumption: "Based on current savings rate and risk profile (excludes virtual trading portfolio)",
    });
    projections.push({
      label: "Net Worth (5 Years) - Real Assets Only",
      current: ctx.savings.totalSaved, // Exclude virtual portfolio
      projected: ctx.twin.projections.fiveYear,
      timeframe: "5 years",
      assumption: "Based on current savings rate and risk profile (excludes virtual trading portfolio)",
    });
  }

  return projections;
}

function generateActionPlan(recommendations: Recommendation[]): string[] {
  return recommendations
    .slice(0, 7)
    .map((r) => `[P${r.priority}] ${r.action} — ${r.reason}`);
}
