import type { PerformanceMetrics, Holding } from "./portfolio-types";

export const portfolioPerformanceService = {
  calculatePerformance(holdings: Holding[]): PerformanceMetrics {
    const topGainers = this.getTopGainers(holdings);
    const topLosers = this.getTopLosers(holdings);
    const bestPerforming = this.getBestPerforming(holdings);
    const worstPerforming = this.getWorstPerforming(holdings);
    const todayPerformance = this.getTodayPerformance(holdings);
    const overallPerformance = this.getOverallPerformance(holdings);
    const monthlyPerformance = this.getMonthlyPerformance(holdings);
    const yearToDatePerformance = this.getYearToDatePerformance(holdings);

    return {
      topGainers,
      topLosers,
      bestPerforming,
      worstPerforming,
      todayPerformance,
      overallPerformance,
      monthlyPerformance,
      yearToDatePerformance,
    };
  },

  getTopGainers(holdings: Holding[], limit = 3): Holding[] {
    return [...holdings]
      .filter((h) => h.dayChangePercent > 0)
      .sort((a, b) => b.dayChangePercent - a.dayChangePercent)
      .slice(0, limit);
  },

  getTopLosers(holdings: Holding[], limit = 3): Holding[] {
    return [...holdings]
      .filter((h) => h.dayChangePercent < 0)
      .sort((a, b) => a.dayChangePercent - b.dayChangePercent)
      .slice(0, limit);
  },

  getBestPerforming(holdings: Holding[]): Holding | null {
    if (holdings.length === 0) return null;
    return [...holdings].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)[0];
  },

  getWorstPerforming(holdings: Holding[]): Holding | null {
    if (holdings.length === 0) return null;
    return [...holdings].sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)[0];
  },

  getTodayPerformance(holdings: Holding[]): PerformanceMetrics["todayPerformance"] {
    let gainers = 0;
    let losers = 0;
    let unchanged = 0;
    let totalDayChange = 0;

    for (const holding of holdings) {
      if (holding.dayChangePercent > 0) gainers++;
      else if (holding.dayChangePercent < 0) losers++;
      else unchanged++;
      totalDayChange += holding.dayChange;
    }

    return {
      gainers,
      losers,
      unchanged,
      totalDayChange: Number(totalDayChange.toFixed(2)),
    };
  },

  getOverallPerformance(holdings: Holding[]): PerformanceMetrics["overallPerformance"] {
    const totalReturn = holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
    const totalInvested = holdings.reduce((s, h) => s + h.totalCost, 0);
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalReturn: Number(totalReturn.toFixed(2)),
      totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
    };
  },

  getMonthlyPerformance(holdings: Holding[]): PerformanceMetrics["monthlyPerformance"] {
    const totalDayChange = holdings.reduce((s, h) => s + h.dayChange, 0);
    const estimatedMonthlyReturn = totalDayChange * 22;
    const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
    const estimatedMonthlyReturnPercent = totalValue > 0 ? (estimatedMonthlyReturn / totalValue) * 100 : 0;

    return {
      estimatedMonthlyReturn: Number(estimatedMonthlyReturn.toFixed(2)),
      estimatedMonthlyReturnPercent: Number(estimatedMonthlyReturnPercent.toFixed(2)),
    };
  },

  getYearToDatePerformance(holdings: Holding[]): PerformanceMetrics["yearToDatePerformance"] {
    const totalReturn = holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
    const estimatedYTDReturn = totalReturn * 0.4;
    const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
    const estimatedYTDReturnPercent = totalValue > 0 ? (estimatedYTDReturn / totalValue) * 100 : 0;

    return {
      estimatedYTDReturn: Number(estimatedYTDReturn.toFixed(2)),
      estimatedYTDReturnPercent: Number(estimatedYTDReturnPercent.toFixed(2)),
    };
  },
};
