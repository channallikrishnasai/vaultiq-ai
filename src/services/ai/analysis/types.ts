import type { FinancialContext } from "../financial-context.service";

export type { FinancialContext };

export interface Finding {
  category: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  title: string;
  detail: string;
  metric?: string;
  benchmark?: string;
}

export interface Recommendation {
  priority: 1 | 2 | 3 | 4 | 5;
  category: string;
  action: string;
  reason: string;
  impact: string;
  effort: "low" | "medium" | "high";
}

export interface Projection {
  label: string;
  current: number;
  projected: number;
  timeframe: string;
  assumption: string;
}

export interface SimulationResult {
  scenario: string;
  description: string;
  originalContext: FinancialContext;
  modifiedContext: FinancialContext;
  summary: {
    incomeChange: number;
    expenseChange: number;
    savingsChange: number;
    netWorthChange: number;
  };
  findings: Finding[];
  recommendations: Recommendation[];
}

export interface MonthlyReport {
  period: string;
  generatedAt: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    healthScore: number;
    healthGrade: string;
  };
  achievements: string[];
  concerns: string[];
  goalStatus: {
    name: string;
    progress: number;
    onTrack: boolean;
    projectedCompletion: string | null;
  }[];
  healthBreakdown: {
    factor: string;
    score: number;
    maxScore: number;
    tip: string;
  }[];
  recommendations: Recommendation[];
  nextMonthPriorities: string[];
}

export interface AnalysisResult {
  summary: string;
  strengths: Finding[];
  weaknesses: Finding[];
  risks: Finding[];
  opportunities: Finding[];
  recommendations: Recommendation[];
  projections: Projection[];
  actionPlan: string[];
}

export interface HealthAnalysis {
  overallScore: number;
  grade: string;
  label: string;
  strengths: Finding[];
  weaknesses: Finding[];
  factors: {
    name: string;
    score: number;
    maxScore: number;
    percent: number;
    status: "excellent" | "good" | "needs_improvement" | "critical";
    insight: string;
  }[];
}

export interface GoalAnalysis {
  goals: {
    id: string;
    name: string;
    type: string;
    target: number;
    current: number;
    percent: number;
    onTrack: boolean;
    monthsToComplete: number | null;
    monthlyNeeded: number | null;
    projectedCompletion: string | null;
    risk: "on_track" | "behind" | "at_risk" | "critical";
    insight: string;
  }[];
  overallProgress: number;
  totalTarget: number;
  totalCurrent: number;
  recommendations: Recommendation[];
}

export interface CashFlowAnalysis {
  monthlyNet: number;
  incomeStability: "stable" | "variable" | "declining";
  expenseStability: "stable" | "increasing" | "volatile";
  emergencyMonths: number;
  runway: number;
  trends: {
    label: string;
    value: number;
    trend: "improving" | "stable" | "declining";
  }[];
  risks: Finding[];
  recommendations: Recommendation[];
}

export interface BudgetAnalysis {
  totalBudget: number;
  totalSpent: number;
  utilization: number;
  categories: {
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    utilization: number;
    status: "under" | "on_track" | "over" | "critical";
    insight: string;
  }[];
  overBudgetCategories: string[];
  savingsFromBudget: number;
  recommendations: Recommendation[];
}

export interface InvestmentAnalysis {
  hasPortfolio: boolean;
  totalValue: number;
  cashBalance: number;
  investedAmount: number;
  allocation: { name: string; percent: number }[];
  diversification: "poor" | "moderate" | "good" | "excellent";
  riskAlignment: "aligned" | "conservative" | "aggressive";
  topHoldings: { symbol: string; value: number; percent: number }[];
  recommendations: Recommendation[];
}

export interface RiskAnalysis {
  overallRisk: "low" | "moderate" | "high" | "critical";
  emergencyFundRisk: Finding;
  incomeRisk: Finding;
  investmentRisk: Finding;
  fraudRisk: Finding;
  debtRisk: Finding;
  insuranceRisk: Finding;
  findings: Finding[];
  recommendations: Recommendation[];
}
