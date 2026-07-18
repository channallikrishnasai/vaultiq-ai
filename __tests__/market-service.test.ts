import { marketService } from "@/services/market/market.service";
import { marketCacheService } from "@/services/market/market-cache.service";
import { marketProviderService } from "@/services/market/market-provider.service";

describe("MarketService", () => {
  beforeEach(() => {
    marketCacheService.clear();
    marketProviderService.setActiveProvider("mock");
  });

  describe("getQuote", () => {
    it("should return quote for valid symbol", async () => {
      const quote = await marketService.getQuote("RELIANCE");
      expect(quote.symbol).toBe("RELIANCE");
      expect(quote.price).toBeGreaterThan(0);
    });

    it("should cache quote after first fetch", async () => {
      await marketService.getQuote("RELIANCE");
      const cached = marketCacheService.getQuote("RELIANCE");
      expect(cached).not.toBeNull();
    });

    it("should return cached quote on second call", async () => {
      const first = await marketService.getQuote("RELIANCE");
      const second = await marketService.getQuote("RELIANCE");
      expect(first.symbol).toBe(second.symbol);
      expect(first.price).toBe(second.price);
    });

    it("should throw for invalid symbol", async () => {
      await expect(marketService.getQuote("")).rejects.toThrow();
      await expect(marketService.getQuote("   ")).rejects.toThrow();
    });

    it("should throw for unknown symbol", async () => {
      await expect(marketService.getQuote("UNKNOWNXYZ")).rejects.toThrow();
    });
  });

  describe("getQuotes", () => {
    it("should return quotes for multiple symbols", async () => {
      const quotes = await marketService.getQuotes(["RELIANCE", "TCS", "HDFCBANK"]);
      expect(quotes.length).toBe(3);
    });

    it("should deduplicate symbols", async () => {
      const quotes = await marketService.getQuotes(["RELIANCE", "reliance", "Reliance"]);
      expect(quotes.length).toBe(1);
    });

    it("should filter invalid symbols", async () => {
      const quotes = await marketService.getQuotes(["RELIANCE", "", "TCS"]);
      expect(quotes.length).toBe(2);
    });

    it("should use cache for already fetched symbols", async () => {
      await marketService.getQuote("RELIANCE");
      const quotes = await marketService.getQuotes(["RELIANCE", "TCS"]);
      expect(quotes.length).toBe(2);
    });

    it("should return empty array for empty input", async () => {
      const quotes = await marketService.getQuotes([]);
      expect(quotes.length).toBe(0);
    });
  });

  describe("getHistory", () => {
    it("should return history for valid symbol", async () => {
      const history = await marketService.getHistory("RELIANCE", "1mo");
      expect(history.symbol).toBe("RELIANCE");
      expect(history.data.length).toBeGreaterThan(0);
      expect(history.interval).toBe("1mo");
    });

    it("should cache history after first fetch", async () => {
      await marketService.getHistory("RELIANCE", "1mo");
      const cached = marketCacheService.getHistory("RELIANCE", "1mo");
      expect(cached).not.toBeNull();
    });

    it("should throw for invalid symbol", async () => {
      await expect(marketService.getHistory("", "1mo")).rejects.toThrow();
    });

    it("should throw for invalid interval", async () => {
      await expect(marketService.getHistory("RELIANCE", "2d" as "1d")).rejects.toThrow();
    });

    it("should return different intervals separately", async () => {
      const history1 = await marketService.getHistory("RELIANCE", "1d");
      const history5 = await marketService.getHistory("RELIANCE", "5d");
      expect(history1.data.length).toBeLessThan(history5.data.length);
    });
  });

  describe("search", () => {
    it("should return results for valid query", async () => {
      const results = await marketService.search("RELIANCE");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should cache search results", async () => {
      await marketService.search("RELIANCE");
      const cached = marketCacheService.getSearch("RELIANCE");
      expect(cached).not.toBeNull();
    });

    it("should return empty for short query", async () => {
      const results = await marketService.search("R");
      expect(results.length).toBe(0);
    });

    it("should return empty for empty query", async () => {
      const results = await marketService.search("");
      expect(results.length).toBe(0);
    });

    it("should return empty for whitespace only", async () => {
      const results = await marketService.search("   ");
      expect(results.length).toBe(0);
    });
  });

  describe("getBatchQuotes", () => {
    it("should return batch response with quotes", async () => {
      const response = await marketService.getBatchQuotes({
        symbols: ["RELIANCE", "TCS"],
      });
      expect(response.quotes.length).toBe(2);
      expect(response.errors.length).toBe(0);
      expect(response.timestamp).toBeDefined();
    });

    it("should handle invalid symbols in batch", async () => {
      const response = await marketService.getBatchQuotes({
        symbols: ["RELIANCE", ""],
      });
      expect(response.quotes.length).toBe(1);
      expect(response.errors.length).toBe(1);
      expect(response.errors[0].code).toBe("INVALID_SYMBOL");
    });

    it("should use cache in batch", async () => {
      await marketService.getQuote("RELIANCE");
      const response = await marketService.getBatchQuotes({
        symbols: ["RELIANCE", "TCS"],
      });
      expect(response.quotes.length).toBe(2);
    });
  });

  describe("invalidateCache", () => {
    it("should clear all cache when no pattern", () => {
      marketCacheService.set("quote:TEST", { price: 100 });
      marketService.invalidateCache();
      expect(marketCacheService.size).toBe(0);
    });

    it("should invalidate by pattern", () => {
      marketCacheService.set("quote:RELIANCE", { price: 100 });
      marketCacheService.set("quote:TCS", { price: 200 });
      marketService.invalidateCache("^quote:.*");
      expect(marketCacheService.size).toBe(0);
    });
  });

  describe("getCacheStats", () => {
    it("should return cache stats", () => {
      const stats = marketService.getCacheStats();
      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("quoteTtl");
      expect(stats).toHaveProperty("hitCount");
      expect(stats).toHaveProperty("missCount");
    });
  });
});
