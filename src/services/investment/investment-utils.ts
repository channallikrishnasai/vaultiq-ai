import type {
  HealthBreakdownItem,
  InvestmentHealthScore,
  HealthRating,
  RecommendationAction,
  RecommendationPriority,
  WarningType,
  WarningSeverity,
  OpportunityType,
} from "./investment-types";
import type { RiskMetrics, PortfolioSummary, GoalAlignment, AllocationBreakdown } from "../portfolio/portfolio-types";

const HEALTH_WEIGHTS = {
  portfolioHealth: 0.25,
  investmentScore: 0.20,
  diversificationRating: 0.15,
  riskRating: 0.20,
  opportunityScore: 0.10,
  longTermGrowthScore: 0.10,
};

export function calculateHealthGrade(score: number): HealthRating {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "poor";
  return "critical";
}

export function calculatePortfolioHealthScore(
  summary: PortfolioSummary,
  risk: RiskMetrics
): number {
  let score = 50;
  if (summary.holdingsCount === 0) return 10;
  if (summary.totalPnLPercent > 20) score += 20;
  else if (summary.totalPnLPercent > 10) score += 15;
  else if (summary.totalPnLPercent > 0) score += 10;
  else if (summary.totalPnLPercent > -10) score += 0;
  else if (summary.totalPnLPercent > -20) score -= 10;
  else score -= 20;
  if (summary.todayPnLPercent > 0) score += 5;
  else if (summary.todayPnLPercent < -2) score -= 5;
  const cashPercent = summary.totalCurrentValue > 0
    ? (summary.cashBalance / summary.totalCurrentValue) * 100
    : 100;
  if (cashPercent < 10) score += 5;
  else if (cashPercent > 30) score -= 10;
  else if (cashPercent > 50) score -= 20;
  return clamp(score, 0, 100);
}

export function calculateInvestmentScore(
  summary: PortfolioSummary,
  risk: RiskMetrics,
  goalAlignment: GoalAlignment[]
): number {
  let score = 50;
  if (summary.holdingsCount >= 5) score += 10;
  if (summary.holdingsCount >= 10) score += 5;
  if (summary.holdingsCount < 3) score -= 10;
  if (risk.diversificationScore >= 70) score += 15;
  else if (risk.diversificationScore >= 50) score += 5;
  else score -= 10;
  if (risk.concentrationScore < 30) score += 10;
  else if (risk.concentrationScore > 60) score -= 10;
  const onTrackGoals = goalAlignment.filter(g => g.onTrack).length;
  const totalGoals = goalAlignment.length;
  if (totalGoals > 0) {
    const goalPercent = (onTrackGoals / totalGoals) * 100;
    if (goalPercent >= 80) score += 15;
    else if (goalPercent >= 50) score += 5;
    else score -= 10;
  }
  if (summary.totalPnLPercent > 10) score += 10;
  else if (summary.totalPnLPercent > 0) score += 5;
  else if (summary.totalPnLPercent < -15) score -= 10;
  return clamp(score, 0, 100);
}

export function calculateDiversificationRating(risk: RiskMetrics): number {
  return clamp(risk.diversificationScore, 0, 100);
}

export function calculateRiskRating(risk: RiskMetrics, riskAppetite: string): number {
  let score = 50;
  if (risk.riskAlignment === "aligned") score = 80;
  else if (risk.riskAlignment === "conservative") score = 60;
  else score = 30;
  if (risk.portfolioRiskScore < 30 && riskAppetite === "very_conservative") score += 10;
  else if (risk.portfolioRiskScore > 70 && riskAppetite === "aggressive") score += 10;
  else if (risk.portfolioRiskScore > 70 && riskAppetite === "conservative") score -= 20;
  else if (risk.portfolioRiskScore < 30 && riskAppetite === "aggressive") score -= 10;
  if (risk.volatility > 40) score -= 10;
  if (risk.sectorConcentration > 60) score -= 10;
  return clamp(score, 0, 100);
}

export function calculateOpportunityScore(
  allocation: AllocationBreakdown[],
  goalAlignment: GoalAlignment[],
  summary: PortfolioSummary
): number {
  let score = 50;
  const cashPercent = summary.totalCurrentValue > 0
    ? (summary.cashBalance / summary.totalCurrentValue) * 100
    : 100;
  if (cashPercent > 20) score += 15;
  else if (cashPercent > 10) score += 5;
  if (goalAlignment.some(g => !g.onTrack && g.monthlyNeeded && g.monthlyNeeded > 0)) score += 10;
  if (allocation.length > 0) {
    const maxAllocation = Math.max(...allocation.map(a => a.percent));
    if (maxAllocation > 50) score += 10;
    if (allocation.length < 3) score += 5;
  }
  return clamp(score, 0, 100);
}

export function calculateLongTermGrowthScore(
  summary: PortfolioSummary,
  risk: RiskMetrics,
  goalAlignment: GoalAlignment[]
): number {
  let score = 50;
  if (summary.holdingsCount >= 8) score += 10;
  if (risk.diversificationScore >= 60) score += 10;
  if (risk.beta && risk.beta > 0.8 && risk.beta < 1.3) score += 10;
  const onTrackGoals = goalAlignment.filter(g => g.onTrack).length;
  if (goalAlignment.length > 0 && onTrackGoals / goalAlignment.length >= 0.7) score += 15;
  if (summary.totalPnLPercent > 0 && summary.totalPnLPercent < 30) score += 10;
  if (risk.volatility < 25) score += 5;
  else if (risk.volatility > 50) score -= 10;
  return clamp(score, 0, 100);
}

export function buildHealthBreakdown(
  portfolioHealth: number,
  investmentScore: number,
  diversificationRating: number,
  riskRating: number,
  opportunityScore: number,
  longTermGrowthScore: number
): HealthBreakdownItem[] {
  return [
    {
      name: "Portfolio Health",
      score: portfolioHealth,
      weight: HEALTH_WEIGHTS.portfolioHealth,
      contribution: portfolioHealth * HEALTH_WEIGHTS.portfolioHealth,
      description: "Overall portfolio performance and stability",
    },
    {
      name: "Investment Score",
      score: investmentScore,
      weight: HEALTH_WEIGHTS.investmentScore,
      contribution: investmentScore * HEALTH_WEIGHTS.investmentScore,
      description: "Quality of investment decisions and portfolio construction",
    },
    {
      name: "Diversification",
      score: diversificationRating,
      weight: HEALTH_WEIGHTS.diversificationRating,
      contribution: diversificationRating * HEALTH_WEIGHTS.diversificationRating,
      description: "Spread of investments across assets and sectors",
    },
    {
      name: "Risk Rating",
      score: riskRating,
      weight: HEALTH_WEIGHTS.riskRating,
      contribution: riskRating * HEALTH_WEIGHTS.riskRating,
      description: "Risk alignment with your profile and goals",
    },
    {
      name: "Opportunity",
      score: opportunityScore,
      weight: HEALTH_WEIGHTS.opportunityScore,
      contribution: opportunityScore * HEALTH_WEIGHTS.opportunityScore,
      description: "Potential for improvement and growth",
    },
    {
      name: "Long-Term Growth",
      score: longTermGrowthScore,
      weight: HEALTH_WEIGHTS.longTermGrowthScore,
      contribution: longTermGrowthScore * HEALTH_WEIGHTS.longTermGrowthScore,
      description: "Sustainability for long-term wealth creation",
    },
  ];
}

export function buildHealthScore(
  portfolioHealth: number,
  investmentScore: number,
  diversificationRating: number,
  riskRating: number,
  opportunityScore: number,
  longTermGrowthScore: number,
  summary: PortfolioSummary
): InvestmentHealthScore {
  const breakdown = buildHealthBreakdown(
    portfolioHealth,
    investmentScore,
    diversificationRating,
    riskRating,
    opportunityScore,
    longTermGrowthScore
  );
  const overall = Math.round(
    breakdown.reduce((sum, item) => sum + item.contribution, 0)
  );
  const grade = calculateHealthGrade(overall);
  const summaryText = generateHealthSummary(overall, grade, breakdown, summary);
  return {
    overall,
    portfolioHealth,
    investmentScore,
    diversificationRating,
    riskRating,
    opportunityScore,
    longTermGrowthScore,
    breakdown,
    grade,
    summary: summaryText,
  };
}

function generateHealthSummary(
  overall: number,
  grade: HealthRating,
  breakdown: HealthBreakdownItem[],
  summary: PortfolioSummary
): string {
  const strongest = [...breakdown].sort((a, b) => b.score - a.score)[0];
  const weakest = [...breakdown].sort((a, b) => a.score - b.score)[0];
  const gradeText = {
    excellent: "Your portfolio is in excellent condition.",
    good: "Your portfolio is performing well with room for improvement.",
    fair: "Your portfolio needs attention in several areas.",
    poor: "Your portfolio requires significant improvements.",
    critical: "Your portfolio needs immediate attention.",
  };
  return `${gradeText[grade]} Overall score: ${overall}/100. ` +
    `Strongest area: ${strongest.name} (${strongest.score}/100). ` +
    `Area needing improvement: ${weakest.name} (${weakest.score}/100). ` +
    `Portfolio value: ₹${formatLargeNumber(summary.totalCurrentValue)}. ` +
    `Total P&L: ${summary.totalPnLPercent >= 0 ? "+" : ""}${summary.totalPnLPercent.toFixed(1)}%.`;
}

function formatLargeNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

export function generateRecommendationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `rec_${timestamp}_${random}`;
}

export function generateWarningId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `warn_${timestamp}_${random}`;
}

export function generateOpportunityId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `opp_${timestamp}_${random}`;
}

export function determinePriority(
  score: number,
  urgency: "immediate" | "soon" | "eventual"
): RecommendationPriority {
  if (urgency === "immediate" || score >= 80) return "high";
  if (urgency === "soon" || score >= 50) return "medium";
  return "low";
}

export function determineWarningSeverity(
  metric: number,
  threshold: number,
  direction: "above" | "below"
): WarningSeverity {
  const ratio = direction === "above" ? metric / threshold : threshold / metric;
  if (ratio >= 2) return "danger";
  if (ratio >= 1.5) return "critical";
  if (ratio >= 1.2) return "warning";
  return "info";
}

export function calculateConfidence(
  dataPoints: number,
  consistency: number,
  recency: number
): number {
  const dataScore = Math.min(dataPoints / 10, 1) * 40;
  const consistencyScore = consistency * 30;
  const recencyScore = recency * 30;
  return Math.round(dataScore + consistencyScore + recencyScore);
}

export function estimateFutureValue(
  presentValue: number,
  annualReturn: number,
  years: number
): number {
  return presentValue * Math.pow(1 + annualReturn / 100, years);
}

export function calculateMonthlyInvestmentImpact(
  currentSIP: number,
  increase: number,
  annualReturn: number,
  years: number
): number {
  const totalMonthly = currentSIP + increase;
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;
  if (monthlyRate === 0) return totalMonthly * months;
  return totalMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export function calculateSIPFutureValue(
  monthlyAmount: number,
  annualReturn: number,
  years: number
): number {
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;
  if (monthlyRate === 0) return monthlyAmount * months;
  return monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
