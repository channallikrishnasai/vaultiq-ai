import type { AssetType, MarketQuote } from "@/services/market/market-types";
import { detectAssetType } from "@/services/market/market-utils";
import type { Holding, TradeRecord, AllocationBreakdown } from "./portfolio-types";

export function aggregateTrades(trades: TradeRecord[]): Map<string, { quantity: number; totalCost: number; averageCost: number }> {
  const holdings = new Map<string, { quantity: number; totalCost: number; averageCost: number }>();

  const sorted = [...trades].sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());

  for (const trade of sorted) {
    const existing = holdings.get(trade.symbol) ?? { quantity: 0, totalCost: 0, averageCost: 0 };

    if (trade.type === "BUY") {
      const newTotalCost = existing.totalCost + trade.totalAmount;
      const newQuantity = existing.quantity + trade.quantity;
      holdings.set(trade.symbol, {
        quantity: newQuantity,
        totalCost: newTotalCost,
        averageCost: newQuantity > 0 ? newTotalCost / newQuantity : 0,
      });
    } else {
      const newQuantity = existing.quantity - trade.quantity;
      const costReduction = existing.averageCost * trade.quantity;
      const newTotalCost = existing.totalCost - costReduction;
      holdings.set(trade.symbol, {
        quantity: Math.max(0, newQuantity),
        totalCost: Math.max(0, newTotalCost),
        averageCost: newQuantity > 0 ? newTotalCost / newQuantity : 0,
      });
    }
  }

  for (const [symbol, holding] of holdings) {
    if (holding.quantity <= 0) {
      holdings.delete(symbol);
    }
  }

  return holdings;
}

export function calculateRealizedPnL(trades: TradeRecord[]): number {
  const realizedMap = new Map<string, { quantity: number; avgCost: number; realized: number }>();
  const sorted = [...trades].sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());

  let totalRealized = 0;

  for (const trade of sorted) {
    const existing = realizedMap.get(trade.symbol) ?? { quantity: 0, avgCost: 0, realized: 0 };

    if (trade.type === "BUY") {
      const newQty = existing.quantity + trade.quantity;
      const newAvg = newQty > 0 ? (existing.quantity * existing.avgCost + trade.totalAmount) / newQty : 0;
      realizedMap.set(trade.symbol, { quantity: newQty, avgCost: newAvg, realized: existing.realized });
    } else {
      if (existing.quantity > 0) {
        const sellPnL = (trade.price - existing.avgCost) * trade.quantity;
        totalRealized += sellPnL;
        realizedMap.set(trade.symbol, {
          quantity: existing.quantity - trade.quantity,
          avgCost: existing.avgCost,
          realized: existing.realized + sellPnL,
        });
      }
    }
  }

  return totalRealized;
}

export function buildHoldings(
  aggregated: Map<string, { quantity: number; totalCost: number; averageCost: number }>,
  quotes: Map<string, MarketQuote>,
  totalPortfolioValue: number,
): Holding[] {
  const holdings: Holding[] = [];

  for (const [symbol, agg] of aggregated) {
    const quote = quotes.get(symbol);
    const currentPrice = quote?.price ?? agg.averageCost;
    const currentValue = agg.quantity * currentPrice;
    const unrealizedPnL = currentValue - agg.totalCost;
    const unrealizedPnLPercent = agg.totalCost > 0 ? (unrealizedPnL / agg.totalCost) * 100 : 0;
    const dayChange = quote ? quote.change * agg.quantity : 0;
    const dayChangePercent = quote?.changePercent ?? 0;
    const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

    holdings.push({
      symbol,
      assetType: quote?.assetType ?? detectAssetType(symbol),
      quantity: agg.quantity,
      averageCost: Number(agg.averageCost.toFixed(2)),
      totalCost: Number(agg.totalCost.toFixed(2)),
      currentPrice: Number(currentPrice.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      unrealizedPnLPercent: Number(unrealizedPnLPercent.toFixed(2)),
      dayChange: Number(dayChange.toFixed(2)),
      dayChangePercent: Number(dayChangePercent.toFixed(2)),
      weight: Number(weight.toFixed(2)),
      sector: quote?.name ? guessSector(quote.name) : null,
      exchange: quote?.assetType === "stock_bse" ? "BSE" : quote?.assetType === "stock_nse" ? "NSE" : null,
    });
  }

  return holdings.sort((a, b) => b.currentValue - a.currentValue);
}

export function guessSector(companyName: string): string {
  const name = companyName.toLowerCase();
  if (name.includes("bank") || name.includes("financial") || name.includes("insurance") || name.includes("capital"))
    return "Finance";
  if (name.includes("tech") || name.includes("computer") || name.includes("software") || name.includes("digital") || name.includes("info") || name.includes("sys") || name.includes("consult"))
    return "Technology";
  if (name.includes("pharma") || name.includes("health") || name.includes("medical") || name.includes("life"))
    return "Healthcare";
  if (name.includes("energy") || name.includes("oil") || name.includes("gas") || name.includes("power"))
    return "Energy";
  if (name.includes("auto") || name.includes("motor") || name.includes("car"))
    return "Consumer";
  if (name.includes("telecom") || name.includes("airtel") || name.includes("jio"))
    return "Communication";
  if (name.includes("realty") || name.includes("estate") || name.includes("property"))
    return "Real_Estate";
  if (name.includes("metal") || name.includes("mining") || name.includes("steel"))
    return "Materials";
  if (name.includes("consumer") || name.includes("food") || name.includes("fmcg"))
    return "Consumer";
  if (name.includes("infra") || name.includes("engineering") || name.includes("construction"))
    return "Industrial";
  return "Other";
}

export function calculateCAGR(
  beginningValue: number,
  endingValue: number,
  years: number,
): number {
  if (beginningValue <= 0 || endingValue <= 0 || years <= 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
}

export function calculateXIRR(
  cashflows: { date: Date; amount: number }[],
  guess: number = 0.1,
): number {
  if (cashflows.length < 2) return 0;

  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const baseDate = sorted[0].date;

  function npv(rate: number): number {
    let sum = 0;
    for (const cf of sorted) {
      const years = (cf.date.getTime() - baseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      sum += cf.amount / Math.pow(1 + rate, years);
    }
    return sum;
  }

  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const currentNpv = npv(rate);
    if (Math.abs(currentNpv) < 0.01) break;

    const derivative = (npv(rate + 0.0001) - currentNpv) / 0.0001;
    if (Math.abs(derivative) < 1e-10) break;

    rate = rate - currentNpv / derivative;
  }

  return rate * 100;
}

export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }

  if (returns.length === 0) return 0;

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function groupByCategory<T extends { name: string }>(
  items: T[],
  totalValue: number,
): AllocationBreakdown[] {
  const groups = new Map<string, number>();

  for (const item of items) {
    const existing = groups.get(item.name) ?? 0;
    groups.set(item.name, existing + 1);
  }

  const result: AllocationBreakdown[] = [];
  for (const [name, count] of groups) {
    result.push({
      name,
      value: count,
      percent: totalValue > 0 ? Math.round((count / totalValue) * 10000) / 100 : 0,
    });
  }

  return result.sort((a, b) => b.percent - a.percent);
}

export function generateAllocationBreakdown(
  values: Map<string, number>,
  totalValue: number,
): AllocationBreakdown[] {
  const result: AllocationBreakdown[] = [];

  for (const [name, value] of values) {
    if (value > 0) {
      result.push({
        name,
        value: Number(value.toFixed(2)),
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
      });
    }
  }

  return result.sort((a, b) => b.percent - a.percent);
}
