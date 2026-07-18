import { marketContextService } from "@/services/ai/market-context.service";
import { marketProviderService } from "@/services/market/market-provider.service";
import { marketCacheService } from "@/services/market/market-cache.service";

describe("MarketContextService", () => {
  beforeEach(() => {
    marketCacheService.clear();
    marketProviderService.setActiveProvider("mock");
  });

  describe("detectMarketIntent", () => {
    it("should detect stock mentions", () => {
      expect(marketContextService.detectMarketIntent("What is the price of RELIANCE?")).toBe(true);
      expect(marketContextService.detectMarketIntent("How is TCS doing?")).toBe(true);
      expect(marketContextService.detectMarketIntent("Tell me about Infosys")).toBe(true);
    });

    it("should detect index mentions", () => {
      expect(marketContextService.detectMarketIntent("How is NIFTY today?")).toBe(true);
      expect(marketContextService.detectMarketIntent("SENSEX performance")).toBe(true);
      expect(marketContextService.detectMarketIntent("Bank Nifty trend")).toBe(true);
    });

    it("should detect commodity mentions", () => {
      expect(marketContextService.detectMarketIntent("What is the gold price?")).toBe(true);
      expect(marketContextService.detectMarketIntent("Silver rate today")).toBe(true);
    });

    it("should detect market keywords", () => {
      expect(marketContextService.detectMarketIntent("How is the stock market?")).toBe(true);
      expect(marketContextService.detectMarketIntent("Should I invest in equity?")).toBe(true);
      expect(marketContextService.detectMarketIntent("My portfolio performance")).toBe(true);
    });

    it("should detect ETF mentions", () => {
      expect(marketContextService.detectMarketIntent("NIFTYBEES price")).toBe(true);
      expect(marketContextService.detectMarketIntent("Gold ETF performance")).toBe(true);
    });

    it("should not detect non-market messages", () => {
      expect(marketContextService.detectMarketIntent("Hello")).toBe(false);
      expect(marketContextService.detectMarketIntent("What is my savings rate?")).toBe(false);
      expect(marketContextService.detectMarketIntent("How is my health score?")).toBe(false);
    });

    it("should detect investment keywords", () => {
      expect(marketContextService.detectMarketIntent("Should I buy or sell?")).toBe(true);
      expect(marketContextService.detectMarketIntent("IPO upcoming")).toBe(true);
      expect(marketContextService.detectMarketIntent("Dividend stocks")).toBe(true);
    });
  });

  describe("buildMarketContext", () => {
    it("should return empty context for non-market message", async () => {
      const ctx = await marketContextService.buildMarketContext("Hello, how are you?");
      expect(ctx.intentDetected).toBe(false);
      expect(ctx.quotes.length).toBe(0);
    });

    it("should fetch quote for RELIANCE", async () => {
      const ctx = await marketContextService.buildMarketContext("What is the price of RELIANCE?");
      expect(ctx.intentDetected).toBe(true);
      expect(ctx.symbols).toContain("RELIANCE");
      expect(ctx.quotes.length).toBeGreaterThan(0);
      expect(ctx.quotes[0].symbol).toBe("RELIANCE");
      expect(ctx.quotes[0].price).toBeGreaterThan(0);
    });

    it("should fetch quotes for multiple stocks", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE and TCS prices");
      expect(ctx.intentDetected).toBe(true);
      expect(ctx.quotes.length).toBeGreaterThanOrEqual(2);
    });

    it("should fetch index data for NIFTY", async () => {
      const ctx = await marketContextService.buildMarketContext("How is NIFTY performing?");
      expect(ctx.intentDetected).toBe(true);
      expect(ctx.quotes.some((q) => q.symbol === "^NSEI")).toBe(true);
    });

    it("should fetch index data for SENSEX", async () => {
      const ctx = await marketContextService.buildMarketContext("SENSEX today");
      expect(ctx.intentDetected).toBe(true);
      expect(ctx.quotes.some((q) => q.symbol === "^BSESN")).toBe(true);
    });

    it("should fetch history for stock queries", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE trend");
      expect(ctx.histories.length).toBeGreaterThan(0);
      expect(ctx.histories[0].data.length).toBeGreaterThan(0);
    });

    it("should handle batch fetch gracefully", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE TCS INFY HDFCBANK prices");
      expect(ctx.quotes.length).toBeGreaterThanOrEqual(3);
    });

    it("should set correct data source", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE price");
      expect(["live", "cached", "mock"]).toContain(ctx.dataSource);
    });

    it("should include timestamp", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE price");
      expect(ctx.timestamp).toBeDefined();
      expect(new Date(ctx.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe("formatMarketContext", () => {
    it("should return empty string for no data", () => {
      const formatted = marketContextService.formatMarketContext({
        intentDetected: false,
        symbols: [],
        queries: [],
        quotes: [],
        histories: [],
        searchResults: [],
        dataSource: "mock",
        timestamp: new Date().toISOString(),
      });
      expect(formatted).toBe("");
    });

    it("should format quotes correctly", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE price");
      const formatted = marketContextService.formatMarketContext(ctx);

      expect(formatted).toContain("=== LIVE MARKET DATA ===");
      expect(formatted).toContain("RELIANCE");
      expect(formatted).toContain("Price:");
      expect(formatted).toContain("Change:");
      expect(formatted).toContain("Day Range:");
    });

    it("should include data source in output", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE price");
      const formatted = marketContextService.formatMarketContext(ctx);

      expect(formatted).toContain("Data Source:");
    });

    it("should format history trend", async () => {
      const ctx = await marketContextService.buildMarketContext("RELIANCE trend");
      const formatted = marketContextService.formatMarketContext(ctx);

      if (ctx.histories.length > 0) {
        expect(formatted).toContain("RECENT TREND");
      }
    });

    it("should format index data", async () => {
      const ctx = await marketContextService.buildMarketContext("NIFTY 50");
      const formatted = marketContextService.formatMarketContext(ctx);

      expect(formatted).toContain("NIFTY 50");
      expect(formatted).toContain("Index".toUpperCase() || "index");
    });
  });

  describe("getSupportedSymbols", () => {
    it("should return a list of supported symbols", () => {
      const symbols = marketContextService.getSupportedSymbols();
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols).toContain("RELIANCE");
      expect(symbols).toContain("^NSEI");
      expect(symbols).toContain("^BSESN");
      expect(symbols).toContain("GOLD");
    });
  });
});
