import { mockProvider, marketProviderService, yahooProvider } from "@/services/market/market-provider.service";
import { marketCacheService } from "@/services/market/market-cache.service";

describe("MockProvider", () => {
  beforeEach(() => {
    marketCacheService.clear();
  });

  it("should return quote for known symbol", async () => {
    const quote = await mockProvider.getQuote("RELIANCE");
    expect(quote.symbol).toBe("RELIANCE");
    expect(quote.name).toBe("Reliance Industries Ltd");
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.provider).toBe("mock");
  });

  it("should throw error for unknown symbol", async () => {
    await expect(mockProvider.getQuote("UNKNOWN")).rejects.toThrow();
  });

  it("should return quotes for multiple symbols", async () => {
    const quotes = await mockProvider.getQuotes(["RELIANCE", "TCS", "HDFCBANK"]);
    expect(quotes.length).toBe(3);
    expect(quotes.map((q) => q.symbol)).toEqual(["RELIANCE", "TCS", "HDFCBANK"]);
  });

  it("should skip unknown symbols in batch", async () => {
    const quotes = await mockProvider.getQuotes(["RELIANCE", "UNKNOWN", "TCS"]);
    expect(quotes.length).toBe(2);
  });

  it("should return history", async () => {
    const history = await mockProvider.getHistory("RELIANCE", "1mo");
    expect(history.symbol).toBe("RELIANCE");
    expect(history.data.length).toBeGreaterThan(0);
    expect(history.interval).toBe("1mo");
  });

  it("should return history for different intervals", async () => {
    const history1d = await mockProvider.getHistory("RELIANCE", "1d");
    expect(history1d.data.length).toBe(1);

    const history1y = await mockProvider.getHistory("RELIANCE", "1y");
    expect(history1y.data.length).toBe(365);
  });

  it("should return search results", async () => {
    const results = await mockProvider.search("RELIANCE");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].symbol).toBe("RELIANCE");
  });

  it("should return multiple search results", async () => {
    const results = await mockProvider.search("HDFC");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("should return empty for short query", async () => {
    const results = await mockProvider.search("R");
    expect(results.length).toBe(0);
  });

  it("should be available", () => {
    expect(mockProvider.isAvailable()).toBe(true);
  });

  it("should have correct config", () => {
    expect(mockProvider.config.name).toBe("mock");
    expect(mockProvider.config.rateLimitMs).toBe(0);
  });

  it("should provide quotes for all registered mock symbols", async () => {
    const symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "WIPRO", "BHARTIARTL", "SBIN"];
    for (const symbol of symbols) {
      const quote = await mockProvider.getQuote(symbol);
      expect(quote.symbol).toBe(symbol);
      expect(quote.price).toBeGreaterThan(0);
    }
  });

  it("should provide quotes for indices", async () => {
    const indices = ["^NSEI", "^BSESN", "^NSEBANK"];
    for (const symbol of indices) {
      const quote = await mockProvider.getQuote(symbol);
      expect(quote.symbol).toBe(symbol);
      expect(quote.assetType).toBe("index");
    }
  });

  it("should provide quotes for ETFs", async () => {
    const etfs = ["NIFTYBEES", "GOLDBEES"];
    for (const symbol of etfs) {
      const quote = await mockProvider.getQuote(symbol);
      expect(quote.symbol).toBe(symbol);
      expect(quote.assetType).toBe("etf");
    }
  });
});

describe("MarketProviderService", () => {
  beforeEach(() => {
    marketProviderService.setActiveProvider("mock");
    marketCacheService.clear();
  });

  it("should get active provider", () => {
    const provider = marketProviderService.getActiveProvider();
    expect(provider.name).toBe("mock");
  });

  it("should set active provider", () => {
    marketProviderService.setActiveProvider("yahoo");
    const provider = marketProviderService.getActiveProvider();
    expect(provider.name).toBe("yahoo");
  });

  it("should throw for unknown provider", () => {
    expect(() => {
      marketProviderService.setActiveProvider("unknown" as "yahoo");
    }).toThrow();
  });

  it("should get available providers", () => {
    const providers = marketProviderService.getAvailableProviders();
    expect(providers).toContain("mock");
    expect(providers).toContain("yahoo");
  });

  it("should register new provider", () => {
    const customProvider = {
      ...mockProvider,
      name: "custom" as const,
      isAvailable: () => true,
    };

    marketProviderService.register(customProvider);
    const provider = marketProviderService.getProvider("custom");
    expect(provider).toBeDefined();
    expect(provider?.name).toBe("custom");
  });

  it("should unregister provider", () => {
    marketProviderService.register({
      ...mockProvider,
      name: "temp" as const,
      isAvailable: () => true,
    });

    const result = marketProviderService.unregister("temp");
    expect(result).toBe(true);
    expect(marketProviderService.getProvider("temp")).toBeUndefined();
  });

  it("should get quote with fallback", async () => {
    marketProviderService.setActiveProvider("mock");
    const quote = await marketProviderService.getQuoteWithFallback("RELIANCE");
    expect(quote.symbol).toBe("RELIANCE");
  });

  it("should get quotes with fallback", async () => {
    marketProviderService.setActiveProvider("mock");
    const quotes = await marketProviderService.getQuotesWithFallback(["RELIANCE", "TCS"]);
    expect(quotes.length).toBe(2);
  });

  it("should fallback to mock when yahoo fails", async () => {
    marketProviderService.setActiveProvider("yahoo");
    const quote = await marketProviderService.getQuoteWithFallback("RELIANCE");
    expect(quote.symbol).toBe("RELIANCE");
    expect(quote.provider).toBe("mock");
  });
});

describe("YahooProvider", () => {
  it("should be available", () => {
    expect(yahooProvider.isAvailable()).toBe(true);
  });

  it("should have correct config", () => {
    expect(yahooProvider.config.name).toBe("yahoo");
    expect(yahooProvider.config.timeoutMs).toBe(10000);
    expect(yahooProvider.config.maxRetries).toBe(2);
  });
});
