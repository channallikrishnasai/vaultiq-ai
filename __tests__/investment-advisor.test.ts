import { investmentAdvisorService } from "@/services/investment/investment-advisor.service";

jest.mock("@/services/portfolio/portfolio-calculation.service", () => ({
  portfolioCalculationService: {
    getDefaultPortfolioId: jest.fn().mockResolvedValue("test-portfolio"),
    calculatePortfolio: jest.fn().mockResolvedValue({
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
      holdings: [
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
        {
          symbol: "HDFCBANK",
          assetType: "stock_nse",
          quantity: 15,
          averageCost: 1500,
          totalCost: 22500,
          currentPrice: 1600,
          currentValue: 24000,
          unrealizedPnL: 1500,
          unrealizedPnLPercent: 6.67,
          dayChange: 10,
          dayChangePercent: 0.63,
          weight: 24,
          sector: "Finance",
          exchange: "NSE",
        },
        {
          symbol: "GOLDBEES",
          assetType: "etf",
          quantity: 50,
          averageCost: 400,
          totalCost: 20000,
          currentPrice: 450,
          currentValue: 22500,
          unrealizedPnL: 2500,
          unrealizedPnLPercent: 12.5,
          dayChange: 5,
          dayChangePercent: 1.12,
          weight: 22.5,
          sector: "Finance",
          exchange: "NSE",
        },
      ],
      tradeHistory: [],
      lastUpdated: new Date().toISOString(),
    }),
  },
}));

jest.mock("@/services/portfolio/portfolio-allocation.service", () => ({
  portfolioAllocationService: {
    calculateAllocation: jest.fn().mockReturnValue({
      byAssetClass: [
        { name: "stock_nse", value: 68000, percent: 68 },
        { name: "etf", value: 22500, percent: 22.5 },
        { name: "cash", value: 10000, percent: 10 },
      ],
      bySector: [
        { name: "Technology", value: 19000, percent: 19 },
        { name: "Finance", value: 46500, percent: 46.5 },
        { name: "Energy", value: 25000, percent: 25 },
      ],
      byMarketCap: [],
      byRisk: [],
      byCurrency: [],
    }),
  },
}));

jest.mock("@/services/portfolio/portfolio-risk.service", () => ({
  portfolioRiskService: {
    calculateRiskMetrics: jest.fn().mockReturnValue({
      diversificationScore: 65,
      concentrationScore: 35,
      portfolioRiskScore: 50,
      volatility: 25,
      beta: 0.95,
      riskAlignment: "aligned",
      topHoldingsConcentration: 68,
      sectorConcentration: 46.5,
      largestPositionPercent: 25,
    }),
  },
}));

jest.mock("@/services/portfolio/portfolio-performance.service", () => ({
  portfolioPerformanceService: {
    calculatePerformance: jest.fn().mockReturnValue({
      topGainers: [],
      topLosers: [],
      bestPerforming: null,
      worstPerforming: null,
      todayPerformance: { gainers: 2, losers: 2, unchanged: 0, totalDayChange: 45 },
      overallPerformance: { totalReturn: 20000, totalReturnPercent: 25 },
      monthlyPerformance: { estimatedMonthlyReturn: 660, estimatedMonthlyReturnPercent: 0.66 },
      yearToDatePerformance: { estimatedYTDReturn: 8000, estimatedYTDReturnPercent: 10 },
    }),
  },
}));

jest.mock("@/services/portfolio/portfolio-engine.service", () => ({
  portfolioEngineService: {
    getGoalAlignment: jest.fn().mockResolvedValue([
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
    ]),
  },
}));

describe("investment-advisor-service", () => {
  describe("getInvestmentAdvice", () => {
    it("returns complete investment analysis", async () => {
      const advice = await investmentAdvisorService.getInvestmentAdvice({ userId: "test-user" });
      expect(advice).toBeDefined();
      expect(advice.health).toBeDefined();
      expect(advice.recommendations).toBeDefined();
      expect(advice.opportunities).toBeDefined();
      expect(advice.warnings).toBeDefined();
      expect(advice.actionItems).toBeDefined();
      expect(advice.generatedAt).toBeDefined();
    });

    it("includes health score breakdown", async () => {
      const advice = await investmentAdvisorService.getInvestmentAdvice({ userId: "test-user" });
      expect(advice.health.overall).toBeGreaterThanOrEqual(0);
      expect(advice.health.overall).toBeLessThanOrEqual(100);
      expect(advice.health.grade).toBeDefined();
      expect(advice.health.breakdown).toHaveLength(6);
    });

    it("generates recommendations", async () => {
      const advice = await investmentAdvisorService.getInvestmentAdvice({ userId: "test-user" });
      expect(advice.recommendations.length).toBeGreaterThan(0);
      for (const rec of advice.recommendations) {
        expect(rec.id).toBeDefined();
        expect(rec.type).toBeDefined();
        expect(rec.reason).toBeDefined();
      }
    });

    it("generates warnings", async () => {
      const advice = await investmentAdvisorService.getInvestmentAdvice({ userId: "test-user" });
      expect(Array.isArray(advice.warnings)).toBe(true);
    });

    it("generates opportunities", async () => {
      const advice = await investmentAdvisorService.getInvestmentAdvice({ userId: "test-user" });
      expect(Array.isArray(advice.opportunities)).toBe(true);
    });

    it("generates action items", async () => {
      const advice = await investmentAdvisorService.getInvestmentAdvice({ userId: "test-user" });
      expect(advice.actionItems.length).toBeGreaterThan(0);
    });
  });

  describe("getHealthScore", () => {
    it("returns health score", async () => {
      const health = await investmentAdvisorService.getHealthScore("test-user");
      expect(health.overall).toBeGreaterThanOrEqual(0);
      expect(health.overall).toBeLessThanOrEqual(100);
      expect(health.grade).toBeDefined();
    });
  });

  describe("getRecommendations", () => {
    it("returns recommendations", async () => {
      const recs = await investmentAdvisorService.getRecommendations("test-user");
      expect(Array.isArray(recs)).toBe(true);
    });
  });

  describe("getOpportunities", () => {
    it("returns opportunities", async () => {
      const opps = await investmentAdvisorService.getOpportunities("test-user");
      expect(Array.isArray(opps)).toBe(true);
    });
  });

  describe("getWarnings", () => {
    it("returns warnings", async () => {
      const warnings = await investmentAdvisorService.getWarnings("test-user");
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe("runSimulation", () => {
    it("simulates monthly investment", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        monthlyInvestment: 5000,
      });
      expect(result).toBeDefined();
      expect(result.currentPortfolioValue).toBe(100000);
      expect(result.simulatedPortfolioValue).toBeGreaterThan(100000);
      expect(result.expectedCAGR).toBeGreaterThan(0);
      expect(result.futureValue.oneYear).toBeGreaterThan(0);
    });

    it("simulates SIP increase", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        monthlyIncrease: 2000,
      });
      expect(result.simulatedPortfolioValue).toBeGreaterThan(result.currentPortfolioValue);
    });

    it("simulates price change", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        priceChange: { symbol: "RELIANCE", percentChange: -15 },
      });
      expect(result.simulatedPortfolioValue).toBeLessThan(result.currentPortfolioValue);
    });

    it("simulates market growth", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        marketGrowth: { annualReturn: 12, years: 5 },
      });
      expect(result.futureValue.fiveYear).toBeGreaterThan(result.currentPortfolioValue);
    });

    it("simulates lump sum", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        lumpSum: { amount: 50000 },
      });
      expect(result.simulatedPortfolioValue).toBe(150000);
    });

    it("includes goal impact", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        monthlyInvestment: 5000,
      });
      expect(result.goalImpact).toBeDefined();
      expect(result.goalImpact.length).toBeGreaterThan(0);
    });

    it("includes risk impact", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        marketGrowth: { annualReturn: 15, years: 5 },
      });
      expect(result.riskImpact).toBeDefined();
      expect(result.riskImpact.riskScoreBefore).toBeDefined();
    });

    it("returns future value projections", async () => {
      const result = await investmentAdvisorService.runSimulation("test-user", {
        monthlyInvestment: 5000,
      });
      expect(result.futureValue.oneYear).toBeGreaterThan(0);
      expect(result.futureValue.threeYear).toBeGreaterThan(0);
      expect(result.futureValue.fiveYear).toBeGreaterThan(0);
      expect(result.futureValue.tenYear).toBeGreaterThan(0);
    });
  });
});
