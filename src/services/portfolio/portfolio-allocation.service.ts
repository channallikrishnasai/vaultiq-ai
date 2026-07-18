import type { PortfolioAllocation, AllocationBreakdown, Holding } from "./portfolio-types";
import { ASSET_TYPE_COLORS, SECTOR_DEFAULTS } from "./portfolio-types";

export const portfolioAllocationService = {
  calculateAllocation(
    holdings: Holding[],
    cashBalance: number,
  ): PortfolioAllocation {
    const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0) + cashBalance;

    return {
      byAssetClass: this.calculateByAssetClass(holdings, cashBalance, totalValue),
      bySector: this.calculateBySector(holdings, totalValue),
      byMarketCap: this.calculateByMarketCap(holdings, totalValue),
      byRisk: this.calculateByRisk(holdings, totalValue),
      byCurrency: this.calculateByCurrency(holdings, cashBalance, totalValue),
    };
  },

  calculateByAssetClass(
    holdings: Holding[],
    cashBalance: number,
    totalValue: number,
  ): AllocationBreakdown[] {
    const assetMap = new Map<string, number>();

    for (const holding of holdings) {
      const existing = assetMap.get(holding.assetType) ?? 0;
      assetMap.set(holding.assetType, existing + holding.currentValue);
    }

    if (cashBalance > 0) {
      assetMap.set("cash", cashBalance);
    }

    const result: AllocationBreakdown[] = [];
    for (const [assetType, value] of assetMap) {
      result.push({
        name: assetType.replace(/_/g, " ").toUpperCase(),
        value: Number(value.toFixed(2)),
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
        color: ASSET_TYPE_COLORS[assetType as keyof typeof ASSET_TYPE_COLORS] ?? "#9E9E9E",
      });
    }

    return result.sort((a, b) => b.percent - a.percent);
  },

  calculateBySector(holdings: Holding[], totalValue: number): AllocationBreakdown[] {
    const sectorMap = new Map<string, number>();

    for (const holding of holdings) {
      const sector = holding.sector ?? "Other";
      const existing = sectorMap.get(sector) ?? 0;
      sectorMap.set(sector, existing + holding.currentValue);
    }

    const result: AllocationBreakdown[] = [];
    for (const [sector, value] of sectorMap) {
      result.push({
        name: sector,
        value: Number(value.toFixed(2)),
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
        color: SECTOR_DEFAULTS[sector] ?? "#9E9E9E",
      });
    }

    return result.sort((a, b) => b.percent - a.percent);
  },

  calculateByMarketCap(holdings: Holding[], totalValue: number): AllocationBreakdown[] {
    const capMap = new Map<string, number>();

    for (const holding of holdings) {
      let cap = "Unknown";
      if (holding.currentValue > 200000) cap = "Large Cap";
      else if (holding.currentValue > 50000) cap = "Mid Cap";
      else cap = "Small Cap";

      const existing = capMap.get(cap) ?? 0;
      capMap.set(cap, existing + holding.currentValue);
    }

    const result: AllocationBreakdown[] = [];
    for (const [cap, value] of capMap) {
      result.push({
        name: cap,
        value: Number(value.toFixed(2)),
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
      });
    }

    return result.sort((a, b) => b.percent - a.percent);
  },

  calculateByRisk(holdings: Holding[], totalValue: number): AllocationBreakdown[] {
    const riskMap = new Map<string, number>();

    for (const holding of holdings) {
      let risk = "Medium";
      if (holding.assetType === "gold" || holding.assetType === "silver") risk = "Low";
      else if (holding.assetType === "crypto") risk = "Very High";
      else if (holding.assetType === "etf" || holding.assetType === "mutual_fund") risk = "Low-Medium";
      else if (holding.assetType === "bond") risk = "Low";
      else if (holding.assetType === "index") risk = "Medium";

      const existing = riskMap.get(risk) ?? 0;
      riskMap.set(risk, existing + holding.currentValue);
    }

    const result: AllocationBreakdown[] = [];
    for (const [risk, value] of riskMap) {
      result.push({
        name: risk,
        value: Number(value.toFixed(2)),
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
      });
    }

    return result.sort((a, b) => b.percent - a.percent);
  },

  calculateByCurrency(
    holdings: Holding[],
    cashBalance: number,
    totalValue: number,
  ): AllocationBreakdown[] {
    const currMap = new Map<string, number>();

    for (const holding of holdings) {
      const curr = holding.exchange === "NSE" || holding.exchange === "BSE" ? "INR" : "INR";
      const existing = currMap.get(curr) ?? 0;
      currMap.set(curr, existing + holding.currentValue);
    }

    if (cashBalance > 0) {
      const existing = currMap.get("INR") ?? 0;
      currMap.set("INR", existing + cashBalance);
    }

    const result: AllocationBreakdown[] = [];
    for (const [currency, value] of currMap) {
      result.push({
        name: currency,
        value: Number(value.toFixed(2)),
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
      });
    }

    return result.sort((a, b) => b.percent - a.percent);
  },
};
