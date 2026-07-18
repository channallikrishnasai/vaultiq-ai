import { prisma } from "@/lib/prisma";
import { marketService } from "@/services/market/market.service";
import { logger } from "@/lib/logger";
import type { MarketQuote } from "@/services/market/market-types";
import type { PortfolioCalculation, TradeRecord, PortfolioSummary } from "./portfolio-types";
import { aggregateTrades, calculateRealizedPnL, buildHoldings, calculateCAGR, calculateXIRR } from "./portfolio-utils";

const TAG = "PortfolioCalculation";

export const portfolioCalculationService = {
  async calculatePortfolio(portfolioId: string, userId: string): Promise<PortfolioCalculation> {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: { trades: { orderBy: { executedAt: "asc" } } },
    });

    if (!portfolio) {
      throw new Error("Portfolio not found");
    }

    const tradeRecords: TradeRecord[] = portfolio.trades.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      type: t.type,
      quantity: t.quantity,
      price: t.price,
      totalAmount: t.totalAmount,
      executedAt: t.executedAt,
    }));

    const aggregated = aggregateTrades(tradeRecords);

    const symbols = Array.from(aggregated.keys());
    let quotesMap = new Map<string, MarketQuote>();

    try {
      if (symbols.length > 0) {
        const batchResponse = await marketService.getBatchQuotes({ symbols });
        const quotes = batchResponse.quotes;
        quotesMap = new Map(quotes.map((q) => [q.symbol, q]));
      }
    } catch (error) {
      logger.warn(TAG, "Failed to fetch market quotes, using cost basis", error);
    }

    let holdingsValue = 0;
    let todayPnL = 0;

    for (const [symbol, agg] of aggregated) {
      const quote = quotesMap.get(symbol);
      const currentPrice = quote?.price ?? agg.averageCost;
      holdingsValue += agg.quantity * currentPrice;
      if (quote) {
        todayPnL += quote.change * agg.quantity;
      }
    }

    const totalCurrentValue = holdingsValue + portfolio.cashBalance;
    const totalInvested = portfolio.cashBalance + holdingsValue;
    const realizedPnL = calculateRealizedPnL(tradeRecords);

    const holdings = buildHoldings(aggregated, quotesMap, totalCurrentValue);

    const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0);
    const unrealizedPnL = holdingsValue - totalCost;

    const totalPnL = unrealizedPnL + realizedPnL;
    const totalPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
    const todayPnLPercent = totalCurrentValue > 0 ? (todayPnL / totalCurrentValue) * 100 : 0;

    return {
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
      totalInvested: Number(totalInvested.toFixed(2)),
      cashBalance: Number(portfolio.cashBalance.toFixed(2)),
      holdingsValue: Number(holdingsValue.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
      totalPnLPercent: Number(totalPnLPercent.toFixed(2)),
      todayPnL: Number(todayPnL.toFixed(2)),
      todayPnLPercent: Number(todayPnLPercent.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      realizedPnL: Number(realizedPnL.toFixed(2)),
      holdings,
      tradeHistory: tradeRecords,
    };
  },

  async getSummary(portfolioId: string, userId: string): Promise<PortfolioSummary> {
    const calc = await this.calculatePortfolio(portfolioId, userId);

    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      select: { name: true },
    });

    return {
      portfolioId,
      portfolioName: portfolio?.name ?? "Portfolio",
      totalCurrentValue: calc.totalCurrentValue,
      totalInvested: calc.totalInvested,
      cashBalance: calc.cashBalance,
      totalPnL: calc.totalPnL,
      totalPnLPercent: calc.totalPnLPercent,
      todayPnL: calc.todayPnL,
      todayPnLPercent: calc.todayPnLPercent,
      unrealizedPnL: calc.unrealizedPnL,
      realizedPnL: calc.realizedPnL,
      holdingsCount: calc.holdings.length,
      lastUpdated: new Date().toISOString(),
    };
  },

  async getDefaultPortfolioId(userId: string): Promise<string | null> {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId, isDefault: true },
      select: { id: true },
    });
    return portfolio?.id ?? null;
  },

  calculateCAGR,

  calculateXIRR,

  async getCAGR(portfolioId: string, userId: string): Promise<number> {
    const calc = await this.calculatePortfolio(portfolioId, userId);

    if (calc.tradeHistory.length === 0) return 0;

    const firstTrade = calc.tradeHistory[0];
    const yearsSinceFirst = (Date.now() - firstTrade.executedAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    if (yearsSinceFirst < 0.01) return 0;

    const beginningValue = calc.cashBalance + calc.holdingsValue;

    return calculateCAGR(beginningValue, calc.totalCurrentValue, yearsSinceFirst);
  },

  async getXIRR(portfolioId: string, userId: string): Promise<number> {
    const calc = await this.calculatePortfolio(portfolioId, userId);

    if (calc.tradeHistory.length < 2) return 0;

    const cashflows: { date: Date; amount: number }[] = [];

    for (const trade of calc.tradeHistory) {
      if (trade.type === "BUY") {
        cashflows.push({ date: trade.executedAt, amount: -trade.totalAmount });
      } else {
        cashflows.push({ date: trade.executedAt, amount: trade.totalAmount });
      }
    }

    cashflows.push({ date: new Date(), amount: calc.holdingsValue });

    return calculateXIRR(cashflows);
  },
};
