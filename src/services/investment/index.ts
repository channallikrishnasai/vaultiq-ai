export type {
  InvestmentHealthScore,
  HealthBreakdownItem,
  HealthRating,
  InvestmentRecommendation,
  RecommendationAction,
  RecommendationPriority,
  InvestmentOpportunity,
  OpportunityType,
  InvestmentWarning,
  WarningType,
  WarningSeverity,
  SimulationInput,
  SimulationResult,
  InvestmentAnalysis,
  InvestorProfile,
} from "./investment-types";

export {
  calculateHealthGrade,
  calculatePortfolioHealthScore,
  calculateInvestmentScore,
  calculateDiversificationRating,
  calculateRiskRating,
  calculateOpportunityScore,
  calculateLongTermGrowthScore,
  buildHealthBreakdown,
  buildHealthScore,
  generateRecommendationId,
  generateWarningId,
  generateOpportunityId,
  determinePriority,
  determineWarningSeverity,
  calculateConfidence,
  estimateFutureValue,
  calculateMonthlyInvestmentImpact,
  calculateSIPFutureValue,
} from "./investment-utils";

export { investmentRiskService } from "./investment-risk.service";
export { investmentRecommendationService } from "./investment-recommendation.service";
export { investmentOpportunityService } from "./investment-opportunity.service";
export { investmentAdvisorService } from "./investment-advisor.service";
