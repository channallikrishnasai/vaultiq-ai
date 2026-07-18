import { investmentRecommendationService } from "@/services/investment/investment-recommendation.service";
import type { Holding, RiskMetrics, PortfolioSummary, GoalAlignment, PortfolioAllocation, PerformanceMetrics } from "@/services/portfolio/portfolio-types";
import type { InvestorProfile } from "@/services/investment/investment-types";

const mockHoldings: Holding[] = [
  {
    symbol: "RELIANCE",
    assetType: "stock_nse",
    quantity: 10,
    averageCost: 2000,
    totalCost: 20000,
    currentPrice: 2500,
    currentValue: 25000,
    unrealizedPnL: 5000,
    unrealizedPnLPercent: 25,
    dayChange: 50,
    dayChangePercent: 2,
    weight: 25,
    sector: "Energy",
    exchange: "NSE",
  },
  {
    symbol: "TCS",
    assetType: "stock_nse",
    quantity: 5,
    averageCost: 3500,
    totalCost: 17500,
    currentPrice: 3800,
    currentValue: 19000,
    unrealizedPnL: 1500,
    unrealizedPnLPercent: 8.57,
    dayChange: -20,
    dayChangePercent: -0.52,
    weight: 19,
    sector: "Technology",
    exchange: "NSE",
  },
];

const mockRisk: RiskMetrics = {
  diversificationScore: 65,
  concentrationScore: 35,
  portfolioRiskScore: 50,
  volatility: 25,
  beta: 0.95,
  riskAlignment: "aligned",
  topHoldingsConcentration: 68,
  sectorConcentration: 25,
  largestPositionPercent: 25,
};

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
  holdingsCount: 2,
  lastUpdated: new Date().toISOString(),
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

const mockPerformance: PerformanceMetrics = {
  topGainers: [mockHoldings[0]],
  topLosers: [],
  bestPerforming: mockHoldings[0],
  worstPerforming: mockHoldings[1],
  todayPerformance: { gainers: 1, losers: 1, unchanged: 0, totalDayChange: 30 },
  overallPerformance: { totalReturn: 20000, totalReturnPercent: 25 },
  monthlyPerformance: { estimatedMonthlyReturn: 660, estimatedMonthlyReturnPercent: 0.66 },
  yearToDatePerformance: { estimatedYTDReturn: 8000, estimatedYTDReturnPercent: 10 },
};

const mockAllocation: PortfolioAllocation = {
  byAssetClass: [
    { name: "Technology", value: 30000, percent: 30 },
    { name: "Finance", value: 25000, percent: 25 },
    { name: "Healthcare", value: 15000, percent: 15 },
  ],
  bySector: [],
  byMarketCap: [],
  byRisk: [],
  byCurrency: [],
};

const mockInvestorProfile: InvestorProfile = {
  age: 30,
  riskAppetite: "moderate",
  annualIncome: 1200000,
  monthlyIncome: 100000,
  savingsRate: 25,
  emergencyFundMonths: 6,
  investmentHorizon: "long",
  goals: [],
  dependents: 0,
  hasInsurance: true,
  debtToIncomeRatio: 0.2,
};

describe("investment-recommendation-service", () => {
  const ctx = {
    holdings: mockHoldings,
    risk: mockRisk,
    summary: mockSummary,
    goalAlignment: mockGoals,
    performance: mockPerformance,
    allocation: mockAllocation,
    investorProfile: mockInvestorProfile,
  };

  describe("generateRecommendations", () => {
    it("returns array of recommendations", () => {
      const recs = investmentRecommendationService.generateRecommendations(ctx);
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });

    it("includes required fields", () => {
      const recs = investmentRecommendationService.generateRecommendations(ctx);
      for (const rec of recs) {
        expect(rec.id).toBeDefined();
        expect(rec.type).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.reason).toBeDefined();
        expect(rec.benefits).toBeDefined();
        expect(rec.risks).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      }
    });

    it("generates cash deployment recommendation for high cash", () => {
      const highCashSummary = { ...mockSummary, cashBalance: 40000 };
      const highCashCtx = { ...ctx, summary: highCashSummary };
      const recs = investmentRecommendationService.generateRecommendations(highCashCtx);
      const cashRec = recs.find(r => r.type === "reduce_cash");
      expect(cashRec).toBeDefined();
    });

    it("generates diversification recommendation for low score", () => {
      const lowDivRisk = { ...mockRisk, diversificationScore: 25 };
      const lowDivCtx = { ...ctx, risk: lowDivRisk };
      const recs = investmentRecommendationService.generateRecommendations(lowDivCtx);
      const divRec = recs.find(r => r.type === "diversify");
      expect(divRec).toBeDefined();
    });

    it("generates SIP increase recommendation when below ideal", () => {
      const lowSavingsProfile = { ...mockInvestorProfile, savingsRate: 10, monthlyIncome: 200000 };
      const lowSavingsCtx = { ...ctx, investorProfile: lowSavingsProfile };
      const recs = investmentRecommendationService.generateRecommendations(lowSavingsCtx);
      const sipRec = recs.find(r => r.type === "increase_sip");
      expect(sipRec).toBeDefined();
    });

    it("generates goal-specific recommendations", () => {
      const offTrackGoals = [mockGoals[1]];
      const goalCtx = { ...ctx, goalAlignment: offTrackGoals };
      const recs = investmentRecommendationService.generateRecommendations(goalCtx);
      const goalRec = recs.find(r => r.title.includes("House"));
      expect(goalRec).toBeDefined();
    });

    it("generates rebalancing recommendation for concentration", () => {
      const highConcentrationRisk = { ...mockRisk, largestPositionPercent: 40 };
      const highConcCtx = { ...ctx, risk: highConcentrationRisk };
      const recs = investmentRecommendationService.generateRecommendations(highConcCtx);
      const rebalRec = recs.find(r => r.type === "rebalance");
      expect(rebalRec).toBeDefined();
    });

    it("generates emergency fund recommendation", () => {
      const lowCashSummary = { ...mockSummary, cashBalance: 5000 };
      const lowCashCtx = { ...ctx, summary: lowCashSummary };
      const recs = investmentRecommendationService.generateRecommendations(lowCashCtx);
      const emergencyRec = recs.find(r => r.type === "build_emergency_fund");
      expect(emergencyRec).toBeDefined();
    });

    it("deduplicates recommendations", () => {
      const recs = investmentRecommendationService.generateRecommendations(ctx);
      const ids = recs.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("sorts by priority and confidence", () => {
      const recs = investmentRecommendationService.generateRecommendations(ctx);
      for (let i = 1; i < recs.length; i++) {
        const prev = recs[i - 1];
        const curr = recs[i];
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const prevPriority = priorityOrder[prev.priority];
        const currPriority = priorityOrder[curr.priority];
        expect(prevPriority).toBeLessThanOrEqual(currPriority);
      }
    });
  });

  describe("formatRecommendations", () => {
    it("formats recommendations as string", () => {
      const recs = investmentRecommendationService.generateRecommendations(ctx);
      const formatted = investmentRecommendationService.formatRecommendations(recs);
      expect(typeof formatted).toBe("string");
      expect(formatted).toContain("Investment Recommendations");
    });

    it("returns message for empty recommendations", () => {
      const formatted = investmentRecommendationService.formatRecommendations([]);
      expect(formatted).toContain("No specific recommendations");
    });
  });
});
