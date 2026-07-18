import { portfolioAllocationService } from "@/services/portfolio/portfolio-allocation.service";
import { portfolioRiskService } from "@/services/portfolio/portfolio-risk.service";
import { portfolioPerformanceService } from "@/services/portfolio/portfolio-performance.service";
import type { Holding } from "@/services/portfolio/portfolio-types";

function makeHolding(
  symbol: string,
  assetType: "stock_nse" | "etf" | "gold" | "mutual_fund" | "bond" = "stock_nse",
  overrides: Partial<Holding> = {},
): Holding {
  return {
    symbol,
    assetType,
    quantity: 10,
    averageCost: 1000,
    totalCost: 10000,
    currentPrice: 1100,
    currentValue: 11000,
    unrealizedPnL: 1000,
    unrealizedPnLPercent: 10,
    dayChange: 50,
    dayChangePercent: 0.45,
    weight: 20,
    sector: "Technology",
    exchange: "NSE",
    ...overrides,
  };
}

describe("PortfolioAllocationService", () => {
  describe("calculateByAssetClass", () => {
    it("should group by asset type", () => {
      const holdings = [
        makeHolding("RELIANCE", "stock_nse", { currentValue: 50000, weight: 50 }),
        makeHolding("GOLDBEES", "etf", { currentValue: 30000, weight: 30 }),
        makeHolding("HDFCGOLD", "gold", { currentValue: 20000, weight: 20 }),
      ];

      const result = portfolioAllocationService.calculateByAssetClass(holdings, 0, 100000);

      expect(result.length).toBe(3);
      expect(result[0].name).toBe("STOCK NSE");
      expect(result[0].percent).toBe(50);
    });

    it("should include cash", () => {
      const holdings = [makeHolding("RELIANCE", "stock_nse", { currentValue: 70000 })];
      const result = portfolioAllocationService.calculateByAssetClass(holdings, 30000, 100000);

      expect(result.length).toBe(2);
      const cashEntry = result.find((r) => r.name === "CASH");
      expect(cashEntry).toBeDefined();
      expect(cashEntry!.percent).toBe(30);
    });
  });

  describe("calculateBySector", () => {
    it("should group by sector", () => {
      const holdings = [
        makeHolding("TCS", "stock_nse", { sector: "Technology", currentValue: 50000, weight: 50 }),
        makeHolding("HDFCBANK", "stock_nse", { sector: "Finance", currentValue: 30000, weight: 30 }),
        makeHolding("INFY", "stock_nse", { sector: "Technology", currentValue: 20000, weight: 20 }),
      ];

      const result = portfolioAllocationService.calculateBySector(holdings, 100000);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe("Technology");
      expect(result[0].percent).toBe(70);
    });
  });

  describe("calculateAllocation", () => {
    it("should return all allocation dimensions", () => {
      const holdings = [
        makeHolding("RELIANCE", "stock_nse", { currentValue: 50000, weight: 50 }),
        makeHolding("GOLDBEES", "etf", { currentValue: 30000, weight: 30 }),
      ];

      const result = portfolioAllocationService.calculateAllocation(holdings, 20000);

      expect(result.byAssetClass.length).toBeGreaterThan(0);
      expect(result.bySector.length).toBeGreaterThan(0);
      expect(result.byMarketCap.length).toBeGreaterThan(0);
      expect(result.byRisk.length).toBeGreaterThan(0);
      expect(result.byCurrency.length).toBeGreaterThan(0);
    });
  });
});

describe("PortfolioRiskService", () => {
  describe("calculateDiversificationScore", () => {
    it("should return 0 for empty holdings", () => {
      expect(portfolioRiskService.calculateDiversificationScore([])).toBe(0);
    });

    it("should return low score for single holding", () => {
      expect(portfolioRiskService.calculateDiversificationScore([makeHolding("RELIANCE")])).toBe(20);
    });

    it("should increase with more holdings", () => {
      const holdings = [
        makeHolding("RELIANCE", "stock_nse", { sector: "Energy" }),
        makeHolding("TCS", "stock_nse", { sector: "Technology" }),
        makeHolding("HDFCBANK", "stock_nse", { sector: "Finance" }),
        makeHolding("GOLDBEES", "etf", { sector: "Other" }),
        makeHolding("INFY", "stock_nse", { sector: "Technology" }),
      ];

      const score = portfolioRiskService.calculateDiversificationScore(holdings);
      expect(score).toBeGreaterThan(50);
    });
  });

  describe("calculateConcentrationScore", () => {
    it("should return 0 for empty holdings", () => {
      expect(portfolioRiskService.calculateConcentrationScore([])).toBe(0);
    });

    it("should be high for concentrated portfolio", () => {
      const holdings = [
        makeHolding("RELIANCE", "stock_nse", { weight: 80 }),
        makeHolding("TCS", "stock_nse", { weight: 20 }),
      ];

      const score = portfolioRiskService.calculateConcentrationScore(holdings);
      expect(score).toBeGreaterThan(60);
    });

    it("should be lower for diversified portfolio", () => {
      const holdings = [
        makeHolding("RELIANCE", "stock_nse", { weight: 20 }),
        makeHolding("TCS", "stock_nse", { weight: 20 }),
        makeHolding("INFY", "stock_nse", { weight: 20 }),
        makeHolding("HDFCBANK", "stock_nse", { weight: 20 }),
        makeHolding("SBIN", "stock_nse", { weight: 20 }),
      ];

      const score = portfolioRiskService.calculateConcentrationScore(holdings);
      expect(score).toBeLessThan(30);
    });
  });

  describe("calculatePortfolioRiskScore", () => {
    it("should return 50 for empty holdings", () => {
      expect(portfolioRiskService.calculatePortfolioRiskScore([])).toBe(50);
    });

    it("should be lower for bonds and gold", () => {
      const holdings = [
        makeHolding("GOLD1", "gold", { weight: 50 }),
        makeHolding("BOND1", "bond", { weight: 50 }),
      ];

      const score = portfolioRiskService.calculatePortfolioRiskScore(holdings);
      expect(score).toBeLessThan(30);
    });

    it("should be higher for stocks", () => {
      const holdings = [
        makeHolding("RELIANCE", "stock_nse", { weight: 100 }),
      ];

      const score = portfolioRiskService.calculatePortfolioRiskScore(holdings);
      expect(score).toBeGreaterThan(50);
    });
  });

  describe("calculateRiskAlignment", () => {
    it("should be aligned when risk matches appetite", () => {
      expect(portfolioRiskService.calculateRiskAlignment(50, "MODERATE")).toBe("aligned");
    });

    it("should be aggressive when risk is too high", () => {
      expect(portfolioRiskService.calculateRiskAlignment(80, "CONSERVATIVE")).toBe("aggressive");
    });

    it("should be conservative when risk is too low", () => {
      expect(portfolioRiskService.calculateRiskAlignment(20, "AGGRESSIVE")).toBe("conservative");
    });
  });

  describe("getDiversificationLevel", () => {
    it("should return correct levels", () => {
      expect(portfolioRiskService.getDiversificationLevel(80)).toBe("excellent");
      expect(portfolioRiskService.getDiversificationLevel(60)).toBe("good");
      expect(portfolioRiskService.getDiversificationLevel(30)).toBe("fair");
      expect(portfolioRiskService.getDiversificationLevel(10)).toBe("poor");
    });
  });

  describe("calculateTopNConcentration", () => {
    it("should calculate top N concentration", () => {
      const holdings = [
        makeHolding("RELIANCE", "stock_nse", { weight: 40 }),
        makeHolding("TCS", "stock_nse", { weight: 30 }),
        makeHolding("INFY", "stock_nse", { weight: 20 }),
        makeHolding("HDFCBANK", "stock_nse", { weight: 10 }),
      ];

      expect(portfolioRiskService.calculateTopNConcentration(holdings, 3)).toBe(90);
    });
  });
});

describe("PortfolioPerformanceService", () => {
  const holdings = [
    makeHolding("RELIANCE", "stock_nse", {
      dayChange: 50,
      dayChangePercent: 0.45,
      unrealizedPnL: 2000,
      unrealizedPnLPercent: 10,
      weight: 40,
    }),
    makeHolding("TCS", "stock_nse", {
      dayChange: -30,
      dayChangePercent: -0.7,
      unrealizedPnL: -500,
      unrealizedPnLPercent: -2,
      weight: 30,
    }),
    makeHolding("INFY", "stock_nse", {
      dayChange: 20,
      dayChangePercent: 1.2,
      unrealizedPnL: 1500,
      unrealizedPnLPercent: 8,
      weight: 30,
    }),
  ];

  describe("getTopGainers", () => {
    it("should return top gainers sorted by change", () => {
      const gainers = portfolioPerformanceService.getTopGainers(holdings);
      expect(gainers.length).toBe(2);
      expect(gainers[0].symbol).toBe("INFY");
      expect(gainers[1].symbol).toBe("RELIANCE");
    });
  });

  describe("getTopLosers", () => {
    it("should return top losers sorted by change", () => {
      const losers = portfolioPerformanceService.getTopLosers(holdings);
      expect(losers.length).toBe(1);
      expect(losers[0].symbol).toBe("TCS");
    });
  });

  describe("getBestPerforming", () => {
    it("should return best performing holding", () => {
      const best = portfolioPerformanceService.getBestPerforming(holdings);
      expect(best?.symbol).toBe("RELIANCE");
    });

    it("should return null for empty holdings", () => {
      expect(portfolioPerformanceService.getBestPerforming([])).toBeNull();
    });
  });

  describe("getWorstPerforming", () => {
    it("should return worst performing holding", () => {
      const worst = portfolioPerformanceService.getWorstPerforming(holdings);
      expect(worst?.symbol).toBe("TCS");
    });
  });

  describe("getTodayPerformance", () => {
    it("should calculate today stats", () => {
      const perf = portfolioPerformanceService.getTodayPerformance(holdings);
      expect(perf.gainers).toBe(2);
      expect(perf.losers).toBe(1);
      expect(perf.totalDayChange).toBe(40);
    });
  });

  describe("getOverallPerformance", () => {
    it("should calculate overall return", () => {
      const perf = portfolioPerformanceService.getOverallPerformance(holdings);
      expect(perf.totalReturn).toBe(3000);
    });
  });

  describe("calculatePerformance", () => {
    it("should return full performance metrics", () => {
      const perf = portfolioPerformanceService.calculatePerformance(holdings);

      expect(perf.topGainers.length).toBeGreaterThan(0);
      expect(perf.topLosers.length).toBeGreaterThan(0);
      expect(perf.bestPerforming).toBeDefined();
      expect(perf.worstPerforming).toBeDefined();
      expect(perf.todayPerformance).toBeDefined();
      expect(perf.overallPerformance).toBeDefined();
      expect(perf.monthlyPerformance).toBeDefined();
      expect(perf.yearToDatePerformance).toBeDefined();
    });
  });
});
