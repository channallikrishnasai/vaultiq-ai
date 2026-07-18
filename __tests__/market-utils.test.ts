import {
  normalizeSymbol,
  resolveProviderSymbol,
  detectAssetType,
  formatPrice,
  formatVolume,
  formatChange,
  formatChangePercent,
  calculateChange,
  calculateChangePercent,
  isValidSymbol,
  isValidInterval,
  deduplicateSymbols,
  createMarketError,
  parseYahooQuote,
  generateMockHistory,
} from "@/services/market/market-utils";

describe("normalizeSymbol", () => {
  it("should normalize index symbols", () => {
    expect(normalizeSymbol("NIFTY50")).toBe("^NSEI");
    expect(normalizeSymbol("SENSEX")).toBe("^BSESN");
    expect(normalizeSymbol("BANK_NIFTY")).toBe("^NSEBANK");
  });

  it("should return original symbol for unknown", () => {
    expect(normalizeSymbol("RELIANCE")).toBe("RELIANCE");
  });

  it("should uppercase symbol", () => {
    expect(normalizeSymbol("reliance")).toBe("RELIANCE");
  });

  it("should trim whitespace", () => {
    expect(normalizeSymbol("  RELIANCE  ")).toBe("RELIANCE");
  });
});

describe("resolveProviderSymbol", () => {
  it("should add .NS suffix for NSE stocks", () => {
    expect(resolveProviderSymbol("RELIANCE", "stock_nse")).toBe("RELIANCE.NS");
  });

  it("should add .BO suffix for BSE stocks", () => {
    expect(resolveProviderSymbol("RELIANCE", "stock_bse")).toBe("RELIANCE.BO");
  });

  it("should not add suffix for indices", () => {
    expect(resolveProviderSymbol("NIFTY50", "index")).toBe("^NSEI");
  });

  it("should handle already suffixed symbols", () => {
    expect(resolveProviderSymbol("RELIANCE.NS", "stock_nse")).toBe("RELIANCE.NS");
  });

  it("should not add suffix for mutual funds", () => {
    expect(resolveProviderSymbol("HDFCMF", "mutual_fund")).toBe("HDFCMF");
  });

  it("should not add suffix for gold", () => {
    expect(resolveProviderSymbol("GOLD", "gold")).toBe("GOLD");
  });
});

describe("detectAssetType", () => {
  it("should detect index symbols", () => {
    expect(detectAssetType("^NSEI")).toBe("index");
    expect(detectAssetType("NIFTY50")).toBe("index");
    expect(detectAssetType("SENSEX")).toBe("index");
    expect(detectAssetType("^BSESN")).toBe("index");
    expect(detectAssetType("^NSEBANK")).toBe("index");
  });

  it("should detect NSE stocks", () => {
    expect(detectAssetType("RELIANCE.NS")).toBe("stock_nse");
  });

  it("should detect BSE stocks", () => {
    expect(detectAssetType("RELIANCE.BO")).toBe("stock_bse");
  });

  it("should detect ETFs", () => {
    expect(detectAssetType("NIFTYBEES")).toBe("etf");
    expect(detectAssetType("GOLDBEES")).toBe("etf");
    expect(detectAssetType("SILVERBEES")).toBe("etf");
  });

  it("should detect gold", () => {
    expect(detectAssetType("GOLD")).toBe("gold");
    expect(detectAssetType("XAUUSD")).toBe("gold");
  });

  it("should detect silver", () => {
    expect(detectAssetType("SILVER")).toBe("silver");
    expect(detectAssetType("XAGUSD")).toBe("silver");
  });

  it("should detect cash/currency", () => {
    expect(detectAssetType("CASH")).toBe("cash");
    expect(detectAssetType("USDINR")).toBe("cash");
  });

  it("should default to NSE for unknown", () => {
    expect(detectAssetType("RELIANCE")).toBe("stock_nse");
  });
});

describe("formatPrice", () => {
  it("should format regular prices", () => {
    expect(formatPrice(1234.56)).toBe("1,234.56");
  });

  it("should format lakh prices", () => {
    expect(formatPrice(123456)).toBe("1.23L");
  });

  it("should format crore prices", () => {
    expect(formatPrice(12345678)).toBe("1.23Cr");
  });
});

describe("formatVolume", () => {
  it("should format regular volumes", () => {
    expect(formatVolume(1234)).toBe("1.23K");
  });

  it("should format million volumes", () => {
    expect(formatVolume(1234567)).toBe("12.35M");
  });

  it("should format billion volumes", () => {
    expect(formatVolume(1234567890)).toBe("123.46B");
  });
});

describe("formatChange", () => {
  it("should format positive change", () => {
    expect(formatChange(12.5)).toBe("+12.50");
  });

  it("should format negative change", () => {
    expect(formatChange(-12.5)).toBe("-12.50");
  });

  it("should format zero change", () => {
    expect(formatChange(0)).toBe("+0.00");
  });
});

describe("formatChangePercent", () => {
  it("should format positive percent", () => {
    expect(formatChangePercent(2.5)).toBe("+2.50%");
  });

  it("should format negative percent", () => {
    expect(formatChangePercent(-2.5)).toBe("-2.50%");
  });
});

describe("calculateChange", () => {
  it("should calculate change", () => {
    expect(calculateChange(110, 100)).toBe(10);
    expect(calculateChange(90, 100)).toBe(-10);
  });
});

describe("calculateChangePercent", () => {
  it("should calculate percent change", () => {
    expect(calculateChangePercent(110, 100)).toBe(10);
    expect(calculateChangePercent(90, 100)).toBe(-10);
  });

  it("should handle zero previous value", () => {
    expect(calculateChangePercent(100, 0)).toBe(0);
  });
});

describe("isValidSymbol", () => {
  it("should validate correct symbols", () => {
    expect(isValidSymbol("RELIANCE")).toBe(true);
    expect(isValidSymbol("TCS")).toBe(true);
    expect(isValidSymbol("^NSEI")).toBe(true);
    expect(isValidSymbol("RELIANCE.NS")).toBe(true);
  });

  it("should reject invalid symbols", () => {
    expect(isValidSymbol("")).toBe(false);
    expect(isValidSymbol("   ")).toBe(false);
    expect(isValidSymbol("A".repeat(21))).toBe(false);
    expect(isValidSymbol("RELIANCE@")).toBe(false);
  });
});

describe("isValidInterval", () => {
  it("should validate correct intervals", () => {
    expect(isValidInterval("1d")).toBe(true);
    expect(isValidInterval("1mo")).toBe(true);
    expect(isValidInterval("1y")).toBe(true);
    expect(isValidInterval("max")).toBe(true);
  });

  it("should reject invalid intervals", () => {
    expect(isValidInterval("2d")).toBe(false);
    expect(isValidInterval("2mo")).toBe(false);
  });
});

describe("deduplicateSymbols", () => {
  it("should remove duplicates", () => {
    const result = deduplicateSymbols(["RELIANCE", "reliance", "Reliance"]);
    expect(result).toEqual(["RELIANCE"]);
  });

  it("should preserve order", () => {
    const result = deduplicateSymbols(["TCS", "RELIANCE", "HDFCBANK", "RELIANCE"]);
    expect(result).toEqual(["TCS", "RELIANCE", "HDFCBANK"]);
  });

  it("should normalize index symbols", () => {
    const result = deduplicateSymbols(["NIFTY50", "^NSEI"]);
    expect(result).toEqual(["^NSEI"]);
  });
});

describe("createMarketError", () => {
  it("should create error with correct properties", () => {
    const error = createMarketError("UNKNOWN_SYMBOL", "Symbol not found", "RELIANCE", "yahoo");
    expect(error.code).toBe("UNKNOWN_SYMBOL");
    expect(error.message).toBe("Symbol not found");
    expect(error.symbol).toBe("RELIANCE");
    expect(error.provider).toBe("yahoo");
    expect(error.timestamp).toBeDefined();
  });

  it("should create error without optional fields", () => {
    const error = createMarketError("PROVIDER_ERROR", "Provider failed");
    expect(error.code).toBe("PROVIDER_ERROR");
    expect(error.message).toBe("Provider failed");
    expect(error.symbol).toBeUndefined();
    expect(error.provider).toBeUndefined();
  });

  it("should be instanceof Error", () => {
    const error = createMarketError("PROVIDER_ERROR", "Failed");
    expect(error instanceof Error).toBe(true);
    expect(error.name).toBe("MarketError");
  });
});

describe("parseYahooQuote", () => {
  it("should parse valid Yahoo quote data", () => {
    const raw = {
      symbol: "RELIANCE",
      shortName: "Reliance Industries Ltd",
      regularMarketPrice: 2845.5,
      regularMarketPreviousClose: 2813.35,
      regularMarketOpen: 2815.0,
      regularMarketDayHigh: 2852.75,
      regularMarketDayLow: 2810.25,
      regularMarketClose: 2813.35,
      regularMarketVolume: 8542100,
      marketCap: 1927500000000,
      trailingPE: 28.5,
      epsTrailingTwelveMonths: 99.84,
      fiftyTwoWeekHigh: 3024.9,
      fiftyTwoWeekLow: 2220.3,
    };

    const result = parseYahooQuote(raw);
    expect(result.symbol).toBe("RELIANCE");
    expect(result.name).toBe("Reliance Industries Ltd");
    expect(result.price).toBe(2845.5);
    expect(result.change).toBeCloseTo(32.15, 1);
    expect(result.marketCap).toBe(1927500000000);
    expect(result.pe).toBe(28.5);
  });

  it("should handle missing fields gracefully", () => {
    const raw = { symbol: "TEST" };
    const result = parseYahooQuote(raw);
    expect(result.symbol).toBe("TEST");
    expect(result.price).toBe(0);
    expect(result.change).toBe(0);
    expect(result.marketCap).toBeNull();
  });
});

describe("generateMockHistory", () => {
  it("should generate correct number of data points", () => {
    const data = generateMockHistory(1000, 30);
    expect(data.length).toBe(30);
  });

  it("should have valid OHLCV data", () => {
    const data = generateMockHistory(1000, 5);
    for (const point of data) {
      expect(point.open).toBeGreaterThan(0);
      expect(point.high).toBeGreaterThanOrEqual(point.low);
      expect(point.close).toBeGreaterThan(0);
      expect(point.volume).toBeGreaterThan(0);
      expect(point.date).toBeDefined();
    }
  });

  it("should generate 1 day of data", () => {
    const data = generateMockHistory(1000, 1);
    expect(data.length).toBe(1);
  });
});
