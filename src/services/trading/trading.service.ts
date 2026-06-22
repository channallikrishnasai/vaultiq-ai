const MARKET_PRICES: Record<string, number> = {
  RELIANCE: 2850,
  TCS: 4200,
  INFY: 1850,
  HDFCBANK: 1720,
  ICICIBANK: 1280,
  WIPRO: 520,
  SBIN: 820,
  BHARTIARTL: 1580,
  ITC: 480,
  HINDUNILVR: 2380,
};

export const tradingService = {
  getMarketPrice(symbol: string): number {
    return MARKET_PRICES[symbol.toUpperCase()] ?? 100 + Math.random() * 500;
  },

  getMarketOverview() {
    return Object.entries(MARKET_PRICES).map(([symbol, price]) => ({
      symbol,
      price,
      change: +(Math.random() * 4 - 2).toFixed(2),
      changePercent: +(Math.random() * 3 - 1.5).toFixed(2),
    }));
  },

  validateTrade(type: "BUY" | "SELL", cashBalance: number, totalAmount: number) {
    if (type === "BUY" && cashBalance < totalAmount) {
      throw new Error("Insufficient funds for this trade");
    }
    return true;
  },
};
