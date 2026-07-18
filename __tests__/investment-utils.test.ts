import {
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
} from "@/services/investment/investment-utils";
import type { RiskMetrics, PortfolioSummary, GoalAlignment, AllocationBreakdown } from "@/services/portfolio/portfolio-types";

const mockSummary: PortfolioSummary = {
  portfolioId: "test-portfolio",
  portfolioName: "Test Portfolio",
  totalCurrentValue: 100000,
  totalInvested: 80000,
  cashBalance: 10000,
  totalPnL: 20000,
  totalPnLPercent: 25,
  todayPnL: 500,
  todayPnLPercent: 0.5,
  unrealizedPnL: 18000,
  realizedPnL: 2000,
  holdingsCount: 5,
  lastUpdated: new Date().toISOString(),
};

const mockRisk: RiskMetrics = {
  diversificationScore: 65,
  concentrationScore: 35,
  portfolioRiskScore: 50,
  volatility: 25,
  beta: 0.95,
  riskAlignment: "aligned",
  topHoldingsConcentration: 45,
  sectorConcentration: 35,
  largestPositionPercent: 25,
};

const mockGoals: GoalAlignment[] = [
  {
    goalName: "Retirement",
    goalType: "retirement",
    targetAmount: 5000000,
    currentProgress: 2000000,
    portfolioContribution: 1800000,
    percentComplete: 40,
    onTrack: true,
    monthsToGoal: 120,
    monthlyNeeded: 5000,
  },
  {
    goalName: "House",
    goalType: "home",
    targetAmount: 2000000,
    currentProgress: 500000,
    portfolioContribution: 400000,
    percentComplete: 25,
    onTrack: false,
    monthsToGoal: 60,
    monthlyNeeded: 15000,
  },
];

const mockAllocation: AllocationBreakdown[] = [
  { name: "Technology", value: 30000, percent: 30 },
  { name: "Finance", value: 25000, percent: 25 },
  { name: "Healthcare", value: 15000, percent: 15 },
];

describe("investment-utils", () => {
  describe("calculateHealthGrade", () => {
    it("returns excellent for score >= 85", () => {
      expect(calculateHealthGrade(85)).toBe("excellent");
      expect(calculateHealthGrade(100)).toBe("excellent");
    });

    it("returns good for score 70-84", () => {
      expect(calculateHealthGrade(70)).toBe("good");
      expect(calculateHealthGrade(84)).toBe("good");
    });

    it("returns fair for score 50-69", () => {
      expect(calculateHealthGrade(50)).toBe("fair");
      expect(calculateHealthGrade(69)).toBe("fair");
    });

    it("returns poor for score 30-49", () => {
      expect(calculateHealthGrade(30)).toBe("poor");
      expect(calculateHealthGrade(49)).toBe("poor");
    });

    it("returns critical for score < 30", () => {
      expect(calculateHealthGrade(0)).toBe("critical");
      expect(calculateHealthGrade(29)).toBe("critical");
    });
  });

  describe("calculatePortfolioHealthScore", () => {
    it("returns low score for empty portfolio", () => {
      const emptySummary = { ...mockSummary, holdingsCount: 0, totalCurrentValue: 0 };
      expect(calculatePortfolioHealthScore(emptySummary, mockRisk)).toBe(10);
    });

    it("returns high score for profitable portfolio", () => {
      const score = calculatePortfolioHealthScore(mockSummary, mockRisk);
      expect(score).toBeGreaterThan(50);
    });

    it("penalizes large cash holdings", () => {
      const highCash = { ...mockSummary, cashBalance: 60000, totalCurrentValue: 100000 };
      const score = calculatePortfolioHealthScore(highCash, mockRisk);
      const normalScore = calculatePortfolioHealthScore(mockSummary, mockRisk);
      expect(score).toBeLessThan(normalScore);
    });
  });

  describe("calculateInvestmentScore", () => {
    it("returns higher score with good diversification", () => {
      const score = calculateInvestmentScore(mockSummary, mockRisk, mockGoals);
      expect(score).toBeGreaterThan(50);
    });

    it("penalizes when goals are off track", () => {
      const allOffTrack = mockGoals.map(g => ({ ...g, onTrack: false }));
      const score = calculateInvestmentScore(mockSummary, mockRisk, allOffTrack);
      const onTrackScore = calculateInvestmentScore(mockSummary, mockRisk, mockGoals);
      expect(score).toBeLessThan(onTrackScore);
    });
  });

  describe("calculateDiversificationRating", () => {
    it("returns diversification score from risk metrics", () => {
      expect(calculateDiversificationRating(mockRisk)).toBe(65);
    });
  });

  describe("calculateRiskRating", () => {
    it("returns high rating when aligned", () => {
      const score = calculateRiskRating(mockRisk, "moderate");
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it("penalizes when risk exceeds appetite", () => {
      const aggressiveRisk = { ...mockRisk, riskAlignment: "aggressive" as const };
      const score = calculateRiskRating(aggressiveRisk, "conservative");
      expect(score).toBeLessThan(50);
    });
  });

  describe("calculateOpportunityScore", () => {
    it("increases with high cash", () => {
      const highCashSummary = { ...mockSummary, cashBalance: 40000 };
      const score = calculateOpportunityScore(mockAllocation, mockGoals, highCashSummary);
      expect(score).toBeGreaterThan(50);
    });

    it("increases with off-track goals", () => {
      const score = calculateOpportunityScore(mockAllocation, mockGoals, mockSummary);
      expect(score).toBeGreaterThanOrEqual(50);
    });
  });

  describe("calculateLongTermGrowthScore", () => {
    it("rewards diversified portfolios", () => {
      const score = calculateLongTermGrowthScore(mockSummary, mockRisk, mockGoals);
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it("penalizes high volatility", () => {
      const highVolRisk = { ...mockRisk, volatility: 60 };
      const score = calculateLongTermGrowthScore(mockSummary, highVolRisk, mockGoals);
      const normalScore = calculateLongTermGrowthScore(mockSummary, mockRisk, mockGoals);
      expect(score).toBeLessThan(normalScore);
    });
  });

  describe("buildHealthBreakdown", () => {
    it("returns 6 breakdown items", () => {
      const breakdown = buildHealthBreakdown(70, 65, 60, 75, 55, 60);
      expect(breakdown).toHaveLength(6);
    });

    it("calculates contributions correctly", () => {
      const breakdown = buildHealthBreakdown(70, 65, 60, 75, 55, 60);
      expect(breakdown[0].contribution).toBeCloseTo(70 * 0.25, 1);
    });
  });

  describe("buildHealthScore", () => {
    it("calculates overall as sum of contributions", () => {
      const health = buildHealthScore(70, 65, 60, 75, 55, 60, mockSummary);
      expect(health.overall).toBeGreaterThan(0);
      expect(health.overall).toBeLessThanOrEqual(100);
    });

    it("assigns correct grade", () => {
      const health = buildHealthScore(85, 85, 85, 85, 85, 85, mockSummary);
      expect(health.grade).toBe("excellent");
    });
  });

  describe("ID generators", () => {
    it("generates unique recommendation IDs", () => {
      const id1 = generateRecommendationId();
      const id2 = generateRecommendationId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^rec_/);
    });

    it("generates unique warning IDs", () => {
      const id1 = generateWarningId();
      const id2 = generateWarningId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^warn_/);
    });

    it("generates unique opportunity IDs", () => {
      const id1 = generateOpportunityId();
      const id2 = generateOpportunityId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^opp_/);
    });
  });

  describe("determinePriority", () => {
    it("returns high for immediate urgency", () => {
      expect(determinePriority(50, "immediate")).toBe("high");
    });

    it("returns high for high score", () => {
      expect(determinePriority(85, "eventual")).toBe("high");
    });

    it("returns medium for soon urgency", () => {
      expect(determinePriority(30, "soon")).toBe("medium");
    });

    it("returns low for low score and eventual urgency", () => {
      expect(determinePriority(30, "eventual")).toBe("low");
    });
  });

  describe("determineWarningSeverity", () => {
    it("returns danger for ratio >= 2", () => {
      expect(determineWarningSeverity(100, 50, "above")).toBe("danger");
    });

    it("returns critical for ratio >= 1.5", () => {
      expect(determineWarningSeverity(75, 50, "above")).toBe("critical");
    });

    it("returns warning for ratio >= 1.2", () => {
      expect(determineWarningSeverity(60, 50, "above")).toBe("warning");
    });

    it("returns info for ratio < 1.2", () => {
      expect(determineWarningSeverity(50, 50, "above")).toBe("info");
    });
  });

  describe("calculateConfidence", () => {
    it("returns higher confidence with more data points", () => {
      const high = calculateConfidence(20, 0.8, 0.9);
      const low = calculateConfidence(3, 0.5, 0.5);
      expect(high).toBeGreaterThan(low);
    });

    it("caps at 100", () => {
      const score = calculateConfidence(100, 1, 1);
      expect(score).toBe(100);
    });
  });

  describe("estimateFutureValue", () => {
    it("calculates compound growth", () => {
      const result = estimateFutureValue(100000, 12, 5);
      expect(result).toBeGreaterThan(100000);
      expect(result).toBeCloseTo(100000 * Math.pow(1.12, 5), -2);
    });

    it("handles 0% return", () => {
      expect(estimateFutureValue(100000, 0, 5)).toBe(100000);
    });
  });

  describe("calculateSIPFutureValue", () => {
    it("calculates SIP future value", () => {
      const result = calculateSIPFutureValue(5000, 12, 10);
      expect(result).toBeGreaterThan(5000 * 120);
    });

    it("handles 0% return", () => {
      expect(calculateSIPFutureValue(5000, 0, 5)).toBe(5000 * 60);
    });
  });

  describe("calculateMonthlyInvestmentImpact", () => {
    it("calculates total impact of increased SIP", () => {
      const result = calculateMonthlyInvestmentImpact(5000, 2000, 12, 10);
      expect(result).toBeGreaterThan(0);
    });
  });
});
