import {
  aggregateTrades,
  calculateRealizedPnL,
  buildHoldings,
  guessSector,
  calculateCAGR,
  calculateXIRR,
  calculateVolatility,
} from "@/services/portfolio/portfolio-utils";
import type { TradeRecord } from "@/services/portfolio/portfolio-types";
import type { MarketQuote } from "@/services/market/market-types";

function makeTrade(
  symbol: string,
  type: "BUY" | "SELL",
  quantity: number,
  price: number,
  daysAgo: number,
): TradeRecord {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `${symbol}-${type}-${daysAgo}`,
    symbol,
    type,
    quantity,
    price,
    totalAmount: quantity * price,
    executedAt: date,
  };
}

function makeQuote(symbol: string, price: number, change: number = 0): MarketQuote {
  return {
    symbol,
    name: symbol,
    assetType: "stock_nse",
    price,
    change,
    changePercent: price > 0 ? (change / (price - change)) * 100 : 0,
    open: price - change,
    high: price + 10,
    low: price - 10,
    close: price - change,
    previousClose: price - change,
    volume: 1000000,
    marketCap: 1000000000,
    pe: 25,
    eps: price / 25,
    week52High: price * 1.2,
    week52Low: price * 0.8,
    dayHigh: price + 5,
    dayLow: price - 5,
    timestamp: new Date().toISOString(),
    provider: "mock",
  };
}

describe("aggregateTrades", () => {
  it("should aggregate BUY trades correctly", () => {
    const trades = [
      makeTrade("RELIANCE", "BUY", 10, 2500, 30),
      makeTrade("RELIANCE", "BUY", 5, 2600, 15),
    ];

    const result = aggregateTrades(trades);
    const holding = result.get("RELIANCE");

    expect(holding).toBeDefined();
    expect(holding!.quantity).toBe(15);
    expect(holding!.totalCost).toBe(38000);
    expect(holding!.averageCost).toBeCloseTo(2533.33, 0);
  });

  it("should handle SELL trades correctly", () => {
    const trades = [
      makeTrade("TCS", "BUY", 10, 4000, 30),
      makeTrade("TCS", "SELL", 3, 4200, 15),
    ];

    const result = aggregateTrades(trades);
    const holding = result.get("TCS");

    expect(holding).toBeDefined();
    expect(holding!.quantity).toBe(7);
  });

  it("should remove fully sold positions", () => {
    const trades = [
      makeTrade("INFY", "BUY", 10, 1500, 30),
      makeTrade("INFY", "SELL", 10, 1600, 15),
    ];

    const result = aggregateTrades(trades);
    expect(result.has("INFY")).toBe(false);
  });

  it("should handle multiple symbols", () => {
    const trades = [
      makeTrade("RELIANCE", "BUY", 10, 2500, 30),
      makeTrade("TCS", "BUY", 5, 4000, 25),
      makeTrade("INFY", "BUY", 8, 1500, 20),
    ];

    const result = aggregateTrades(trades);
    expect(result.size).toBe(3);
  });

  it("should handle empty trades", () => {
    const result = aggregateTrades([]);
    expect(result.size).toBe(0);
  });

  it("should process trades in chronological order", () => {
    const trades = [
      makeTrade("RELIANCE", "BUY", 5, 2600, 15),
      makeTrade("RELIANCE", "BUY", 10, 2500, 30),
    ];

    const result = aggregateTrades(trades);
    const holding = result.get("RELIANCE");

    expect(holding!.quantity).toBe(15);
    expect(holding!.averageCost).toBeCloseTo(2533.33, 0);
  });
});

describe("calculateRealizedPnL", () => {
  it("should calculate profit on SELL", () => {
    const trades = [
      makeTrade("RELIANCE", "BUY", 10, 2500, 30),
      makeTrade("RELIANCE", "SELL", 10, 2800, 15),
    ];

    const pnl = calculateRealizedPnL(trades);
    expect(pnl).toBe(3000);
  });

  it("should calculate loss on SELL", () => {
    const trades = [
      makeTrade("TCS", "BUY", 10, 4000, 30),
      makeTrade("TCS", "SELL", 10, 3500, 15),
    ];

    const pnl = calculateRealizedPnL(trades);
    expect(pnl).toBe(-5000);
  });

  it("should handle no SELL trades", () => {
    const trades = [makeTrade("RELIANCE", "BUY", 10, 2500, 30)];
    const pnl = calculateRealizedPnL(trades);
    expect(pnl).toBe(0);
  });

  it("should handle empty trades", () => {
    const pnl = calculateRealizedPnL([]);
    expect(pnl).toBe(0);
  });
});

describe("buildHoldings", () => {
  it("should build holdings from aggregated data", () => {
    const aggregated = new Map([
      ["RELIANCE", { quantity: 10, totalCost: 25000, averageCost: 2500 }],
    ]);
    const quotes = new Map([["RELIANCE", makeQuote("RELIANCE", 2800)]]);

    const holdings = buildHoldings(aggregated, quotes, 53000);

    expect(holdings.length).toBe(1);
    expect(holdings[0].currentPrice).toBe(2800);
    expect(holdings[0].currentValue).toBe(28000);
    expect(holdings[0].unrealizedPnL).toBe(3000);
  });

  it("should use cost basis when no quote available", () => {
    const aggregated = new Map([
      ["UNKNOWN", { quantity: 10, totalCost: 10000, averageCost: 1000 }],
    ]);
    const quotes = new Map<string, MarketQuote>();

    const holdings = buildHoldings(aggregated, quotes, 20000);

    expect(holdings[0].currentPrice).toBe(1000);
  });

  it("should calculate weight correctly", () => {
    const aggregated = new Map([
      ["RELIANCE", { quantity: 10, totalCost: 25000, averageCost: 2500 }],
    ]);
    const quotes = new Map([["RELIANCE", makeQuote("RELIANCE", 2800)]]);

    const holdings = buildHoldings(aggregated, quotes, 28000);

    expect(holdings[0].weight).toBe(100);
  });

  it("should sort by value descending", () => {
    const aggregated = new Map([
      ["A", { quantity: 10, totalCost: 5000, averageCost: 500 }],
      ["B", { quantity: 10, totalCost: 15000, averageCost: 1500 }],
    ]);
    const quotes = new Map([
      ["A", makeQuote("A", 500)],
      ["B", makeQuote("B", 1500)],
    ]);

    const holdings = buildHoldings(aggregated, quotes, 20000);

    expect(holdings[0].symbol).toBe("B");
    expect(holdings[1].symbol).toBe("A");
  });
});

describe("guessSector", () => {
  it("should detect finance sector", () => {
    expect(guessSector("HDFC Bank Ltd")).toBe("Finance");
    expect(guessSector("ICICI Bank")).toBe("Finance");
  });

  it("should detect technology sector", () => {
    expect(guessSector("Tata Consultancy Services")).toBe("Technology");
    expect(guessSector("Infosys Ltd")).toBe("Technology");
  });

  it("should detect healthcare sector", () => {
    expect(guessSector("Sun Pharma")).toBe("Healthcare");
  });

  it("should detect energy sector", () => {
    expect(guessSector("Reliance Industries")).toBe("Other");
  });

  it("should return Other for unknown", () => {
    expect(guessSector("Unknown Corp")).toBe("Other");
  });
});

describe("calculateCAGR", () => {
  it("should calculate CAGR correctly", () => {
    const cagr = calculateCAGR(100000, 150000, 3);
    expect(cagr).toBeGreaterThan(14);
    expect(cagr).toBeLessThan(15);
  });

  it("should return 0 for zero values", () => {
    expect(calculateCAGR(0, 100000, 3)).toBe(0);
    expect(calculateCAGR(100000, 0, 3)).toBe(0);
  });

  it("should return 0 for zero years", () => {
    expect(calculateCAGR(100000, 150000, 0)).toBe(0);
  });
});

describe("calculateXIRR", () => {
  it("should calculate XIRR for simple cashflows", () => {
    const cashflows = [
      { date: new Date("2024-01-01"), amount: -100000 },
      { date: new Date("2025-01-01"), amount: 120000 },
    ];

    const xirr = calculateXIRR(cashflows);
    expect(xirr).toBeGreaterThan(15);
    expect(xirr).toBeLessThan(25);
  });

  it("should return 0 for less than 2 cashflows", () => {
    expect(calculateXIRR([{ date: new Date(), amount: -100000 }])).toBe(0);
  });
});

describe("calculateVolatility", () => {
  it("should calculate volatility from price series", () => {
    const prices = [100, 102, 98, 105, 103, 108, 106, 110];
    const vol = calculateVolatility(prices);
    expect(vol).toBeGreaterThan(0);
  });

  it("should return 0 for empty array", () => {
    expect(calculateVolatility([])).toBe(0);
  });

  it("should return 0 for single price", () => {
    expect(calculateVolatility([100])).toBe(0);
  });
});
