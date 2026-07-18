export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationAction =
  | "buy"
  | "sell"
  | "hold"
  | "increase_sip"
  | "reduce_sip"
  | "rebalance"
  | "diversify"
  | "build_emergency_fund"
  | "reduce_cash"
  | "avoid"
  | "review_later";
export type HealthRating = "excellent" | "good" | "fair" | "poor" | "critical";
export type OpportunityType =
  | "undervalued_stock"
  | "sector_gap"
  | "emerging_trend"
  | "sip_boost"
  | "tax_harvesting"
  | "goal_realignment"
  | "cash_deployment"
  | "rebalancing";
export type WarningSeverity = "info" | "warning" | "critical" | "danger";
export type WarningType =
  | "high_cash"
  | "no_emergency_fund"
  | "overexposure"
  | "single_stock"
  | "low_diversification"
  | "high_volatility"
  | "goal_mismatch"
  | "inactive_investments"
  | "concentration_risk"
  | "risk_misalignment";

export interface InvestmentHealthScore {
  overall: number;
  portfolioHealth: number;
  investmentScore: number;
  diversificationRating: number;
  riskRating: number;
  opportunityScore: number;
  longTermGrowthScore: number;
  breakdown: HealthBreakdownItem[];
  grade: HealthRating;
  summary: string;
}

export interface HealthBreakdownItem {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  description: string;
}

export interface InvestmentRecommendation {
  id: string;
  type: RecommendationAction;
  symbol?: string;
  title: string;
  description: string;
  reason: string;
  benefits: string[];
  risks: string[];
  drawbacks: string[];
  alternatives: string[];
  priority: RecommendationPriority;
  confidence: number;
  expectedImpact: {
    portfolioReturn?: number;
    riskChange?: number;
    diversificationChange?: number;
    timeline: string;
  };
  action?: {
    amount?: number;
    frequency?: "monthly" | "quarterly" | "yearly" | "one_time";
    sipAmount?: number;
    targetAllocation?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface InvestmentOpportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  potential: number;
  risk: number;
  timeframe: string;
  expectedReturn: number;
  confidence: number;
  symbols?: string[];
  sectors?: string[];
  action: string;
  details: string;
}

export interface InvestmentWarning {
  id: string;
  type: WarningType;
  severity: WarningSeverity;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  metric?: {
    current: number;
    threshold: number;
    unit: string;
  };
}

export interface SimulationInput {
  monthlyInvestment?: number;
  monthlyIncrease?: number;
  priceChange?: {
    symbol: string;
    percentChange: number;
  };
  marketGrowth?: {
    annualReturn: number;
    years: number;
  };
  lumpSum?: {
    amount: number;
    symbol?: string;
  };
  sipChange?: {
    symbol?: string;
    currentAmount: number;
    newAmount: number;
  };
}

export interface SimulationResult {
  currentPortfolioValue: number;
  simulatedPortfolioValue: number;
  goalImpact: {
    goalName: string;
    currentProgress: number;
    newProgress: number;
    onTrackBefore: boolean;
    onTrackAfter: boolean;
    monthlyNeeded: number | null;
  }[];
  riskImpact: {
    riskScoreBefore: number;
    riskScoreAfter: number;
    volatilityBefore: number;
    volatilityAfter: number;
    diversificationBefore: number;
    diversificationAfter: number;
  };
  expectedCAGR: number;
  futureValue: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear: number;
  };
  summary: string;
  monthlyCashFlow: {
    income: number;
    investments: number;
    remaining: number;
  };
}

export interface InvestmentAnalysis {
  health: InvestmentHealthScore;
  recommendations: InvestmentRecommendation[];
  opportunities: InvestmentOpportunity[];
  warnings: InvestmentWarning[];
  simulations?: SimulationResult;
  portfolioSummary: string;
  riskSummary: string;
  actionItems: string[];
  generatedAt: string;
  dataFreshness: "live" | "cached" | "mock";
}

export interface InvestorProfile {
  age: number;
  riskAppetite: "very_conservative" | "conservative" | "moderate" | "aggressive" | "very_aggressive";
  annualIncome: number;
  monthlyIncome: number;
  savingsRate: number;
  emergencyFundMonths: number;
  investmentHorizon: "short" | "medium" | "long";
  goals: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    yearsToGoal: number;
    priority: "high" | "medium" | "low";
  }[];
  dependents: number;
  hasInsurance: boolean;
  debtToIncomeRatio: number;
}
