import { investmentOpportunityService } from "@/services/investment/investment-opportunity.service";
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
    dayChange: -100,
    dayChangePercent: -3.85,
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
    dayChange: 20,
    dayChangePercent: 0.53,
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
  sectorConcentration: 45,
  largestPositionPercent: 25,
};

const mockSummary: PortfolioSummary = {
  portfolioId: "test-portfolio",
  portfolioName: "Test Portfolio",
  totalCurrentValue: 100000,
  totalInvested: 80000,
  cashBalance: 40000,
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
  todayPerformance: { gainers: 1, losers: 1, unchanged: 0, totalDayChange: -80 },
  overallPerformance: { totalReturn: 20000, totalReturnPercent: 25 },
  monthlyPerformance: { estimatedMonthlyReturn: 660, estimatedMonthlyReturnPercent: 0.66 },
  yearToDatePerformance: { estimatedYTDReturn: 8000, estimatedYTDReturnPercent: 10 },
};

const mockAllocation: PortfolioAllocation = {
  byAssetClass: [
    { name: "stock_nse", value: 44000, percent: 44 },
    { name: "etf", value: 16000, percent: 16 },
  ],
  bySector: [
    { name: "Technology", value: 30000, percent: 30 },
    { name: "Finance", value: 25000, percent: 25 },
    { name: "Energy", value: 25000, percent: 25 },
  ],
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

describe("investment-opportunity-service", () => {
  const ctx = {
    holdings: mockHoldings,
    risk: mockRisk,
    summary: mockSummary,
    goalAlignment: mockGoals,
    performance: mockPerformance,
    allocation: mockAllocation,
    investorProfile: mockInvestorProfile,
  };

  describe("detectOpportunities", () => {
    it("returns array of opportunities", () => {
      const opps = investmentOpportunityService.detectOpportunities(ctx);
      expect(Array.isArray(opps)).toBe(true);
    });

    it("detects cash deployment opportunity", () => {
      const opps = investmentOpportunityService.detectOpportunities(ctx);
      const cashOpp = opps.find(o => o.type === "cash_deployment");
      expect(cashOpp).toBeDefined();
    });

    it("detects goal gaps", () => {
      const offTrackGoals = [mockGoals[1]];
      const goalCtx = { ...ctx, goalAlignment: offTrackGoals };
      const opps = investmentOpportunityService.detectOpportunities(goalCtx);
      const goalOpp = opps.find(o => o.type === "goal_realignment");
      expect(goalOpp).toBeDefined();
    });

    it("detects rebalancing opportunity", () => {
      const highSectorCtx = { ...ctx, risk: { ...mockRisk, sectorConcentration: 50 } };
      const opps = investmentOpportunityService.detectOpportunities(highSectorCtx);
      const rebalOpp = opps.find(o => o.type === "rebalancing");
      expect(rebalOpp).toBeDefined();
    });

    it("detects undervalued holdings", () => {
      const opps = investmentOpportunityService.detectOpportunities(ctx);
      const undervaluedOpp = opps.find(o => o.type === "undervalued_stock");
      expect(undervaluedOpp).toBeDefined();
    });

    it("detects missing gold allocation", () => {
      const noGoldAllocation = {
        ...ctx,
        allocation: {
          byAssetClass: [
            { name: "stock_nse", value: 60000, percent: 60 },
            { name: "etf", value: 40000, percent: 40 },
          ],
          bySector: [],
          byMarketCap: [],
          byRisk: [],
          byCurrency: [],
        },
      };
      const opps = investmentOpportunityService.detectOpportunities(noGoldAllocation);
      const goldOpp = opps.find(o => o.title.includes("Gold"));
      expect(goldOpp).toBeDefined();
    });

    it("detects SIP boost opportunity", () => {
      const lowSavingsProfile = { ...mockInvestorProfile, savingsRate: 10, monthlyIncome: 300000 };
      const lowPnLSummary = { ...mockSummary, totalPnLPercent: -5 };
      const lowSavingsCtx = { ...ctx, investorProfile: lowSavingsProfile, summary: lowPnLSummary };
      const opps = investmentOpportunityService.detectOpportunities(lowSavingsCtx);
      const sipOpp = opps.find(o => o.type === "sip_boost");
      expect(sipOpp).toBeDefined();
    });

    it("includes required fields in opportunities", () => {
      const opps = investmentOpportunityService.detectOpportunities(ctx);
      for (const opp of opps) {
        expect(opp.id).toBeDefined();
        expect(opp.type).toBeDefined();
        expect(opp.title).toBeDefined();
        expect(opp.description).toBeDefined();
        expect(opp.potential).toBeGreaterThanOrEqual(0);
        expect(opp.potential).toBeLessThanOrEqual(10);
        expect(opp.risk).toBeGreaterThanOrEqual(0);
        expect(opp.risk).toBeLessThanOrEqual(10);
        expect(opp.confidence).toBeGreaterThanOrEqual(0);
        expect(opp.confidence).toBeLessThanOrEqual(100);
        expect(opp.action).toBeDefined();
      }
    });
  });

  describe("formatOpportunities", () => {
    it("formats opportunities as string", () => {
      const opps = investmentOpportunityService.detectOpportunities(ctx);
      const formatted = investmentOpportunityService.formatOpportunities(opps);
      expect(typeof formatted).toBe("string");
      expect(formatted).toContain("Investment Opportunities");
    });

    it("returns message for empty opportunities", () => {
      const formatted = investmentOpportunityService.formatOpportunities([]);
      expect(formatted).toContain("No specific opportunities");
    });
  });
});
