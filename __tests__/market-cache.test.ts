import { marketCacheService } from "@/services/market/market-cache.service";

describe("MarketCacheService", () => {
  beforeEach(() => {
    marketCacheService.clear();
  });

  describe("get and set", () => {
    it("should store and retrieve data", () => {
      const data = { price: 100 };
      marketCacheService.set("test-key", data, 5000);
      const result = marketCacheService.get<typeof data>("test-key");
      expect(result).toEqual(data);
    });

    it("should return null for missing key", () => {
      const result = marketCacheService.get("nonexistent");
      expect(result).toBeNull();
    });

    it("should return null for expired entry", async () => {
      marketCacheService.set("expired-key", { value: 1 }, 10);
      await new Promise((resolve) => setTimeout(resolve, 20));
      const result = marketCacheService.get("expired-key");
      expect(result).toBeNull();
    });

    it("should overwrite existing entry", () => {
      marketCacheService.set("key", "value1", 5000);
      marketCacheService.set("key", "value2", 5000);
      const result = marketCacheService.get<string>("key");
      expect(result).toBe("value2");
    });
  });

  describe("quote cache", () => {
    it("should store and retrieve quotes", () => {
      const quote = { symbol: "RELIANCE", price: 2845.5 };
      marketCacheService.setQuote("RELIANCE", quote);
      const result = marketCacheService.getQuote("RELIANCE");
      expect(result).toEqual(quote);
    });

    it("should use correct key format", () => {
      const key = marketCacheService.getQuoteKey("reliance");
      expect(key).toBe("quote:RELIANCE");
    });

    it("should be case insensitive for symbol", () => {
      const quote = { symbol: "TCS", price: 4125 };
      marketCacheService.setQuote("tcs", quote);
      const result = marketCacheService.getQuote("TCS");
      expect(result).toEqual(quote);
    });
  });

  describe("history cache", () => {
    it("should store and retrieve history", () => {
      const history = { symbol: "TCS", data: [] };
      marketCacheService.setHistory("TCS", "1mo", history);
      const result = marketCacheService.getHistory("TCS", "1mo");
      expect(result).toEqual(history);
    });

    it("should use correct key format", () => {
      const key = marketCacheService.getHistoryKey("tcs", "1mo");
      expect(key).toBe("history:TCS:1mo");
    });

    it("should not return history for different interval", () => {
      const history = { symbol: "TCS", data: [] };
      marketCacheService.setHistory("TCS", "1mo", history);
      const result = marketCacheService.getHistory("TCS", "1y");
      expect(result).toBeNull();
    });
  });

  describe("search cache", () => {
    it("should store and retrieve search results", () => {
      const results = [{ symbol: "HDFC", name: "HDFC Bank" }];
      marketCacheService.setSearch("hdfc", results);
      const result = marketCacheService.getSearch("hdfc");
      expect(result).toEqual(results);
    });

    it("should use correct key format", () => {
      const key = marketCacheService.getSearchKey("HDFC");
      expect(key).toBe("search:hdfc");
    });
  });

  describe("invalidation", () => {
    it("should invalidate by pattern", () => {
      marketCacheService.set("quote:RELIANCE", { price: 100 });
      marketCacheService.set("quote:TCS", { price: 200 });
      marketCacheService.set("history:TCS:1mo", { data: [] });

      const count = marketCacheService.invalidate("^quote:.*");
      expect(count).toBe(2);
      expect(marketCacheService.get("quote:RELIANCE")).toBeNull();
      expect(marketCacheService.get("quote:TCS")).toBeNull();
      expect(marketCacheService.get("history:TCS:1mo")).not.toBeNull();
    });

    it("should invalidate by symbol", () => {
      marketCacheService.set("quote:RELIANCE", { price: 100 });
      marketCacheService.set("history:RELIANCE:1mo", { data: [] });

      const count = marketCacheService.invalidateSymbol("RELIANCE");
      expect(count).toBe(2);
    });

    it("should return 0 for non-matching pattern", () => {
      marketCacheService.set("quote:RELIANCE", { price: 100 });
      const count = marketCacheService.invalidate("^xyz:.*");
      expect(count).toBe(0);
    });
  });

  describe("eviction", () => {
    it("should evict oldest entry when max reached", () => {
      marketCacheService.configure({ maxEntries: 3 });

      marketCacheService.set("key1", "value1");
      marketCacheService.set("key2", "value2");
      marketCacheService.set("key3", "value3");
      marketCacheService.set("key4", "value4");

      expect(marketCacheService.size).toBe(3);
      expect(marketCacheService.get("key1")).toBeNull();
    });

    it("should keep newer entries after eviction", () => {
      marketCacheService.configure({ maxEntries: 3 });

      marketCacheService.set("key1", "value1");
      marketCacheService.set("key2", "value2");
      marketCacheService.set("key3", "value3");
      marketCacheService.set("key4", "value4");

      expect(marketCacheService.get("key2")).toBe("value2");
      expect(marketCacheService.get("key3")).toBe("value3");
      expect(marketCacheService.get("key4")).toBe("value4");
    });
  });

  describe("TTL", () => {
    it("should return remaining TTL", () => {
      marketCacheService.set("ttl-key", "value", 10000);
      const ttl = marketCacheService.getRemainingTtl("ttl-key");
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10000);
    });

    it("should return 0 for missing key", () => {
      const ttl = marketCacheService.getRemainingTtl("nonexistent");
      expect(ttl).toBe(0);
    });

    it("should return 0 for expired key", async () => {
      marketCacheService.set("expired-ttl", "value", 10);
      await new Promise((resolve) => setTimeout(resolve, 20));
      const ttl = marketCacheService.getRemainingTtl("expired-ttl");
      expect(ttl).toBe(0);
    });
  });

  describe("has", () => {
    it("should return true for existing key", () => {
      marketCacheService.set("exists", "value");
      expect(marketCacheService.has("exists")).toBe(true);
    });

    it("should return false for missing key", () => {
      expect(marketCacheService.has("missing")).toBe(false);
    });

    it("should return false for expired key", async () => {
      marketCacheService.set("expired", "value", 10);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(marketCacheService.has("expired")).toBe(false);
    });
  });

  describe("stats", () => {
    beforeEach(() => {
      marketCacheService.configure({ maxEntries: 1000 });
    });

    it("should track hit and miss counts", () => {
      marketCacheService.set("key", "value", 5000);

      marketCacheService.get("key");
      marketCacheService.get("key");
      marketCacheService.get("missing");

      const stats = marketCacheService.getStats();
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(1);
    });

    it("should calculate hit rate", () => {
      marketCacheService.set("key", "value", 5000);

      marketCacheService.get("key");
      marketCacheService.get("missing");

      const hitRate = marketCacheService.getHitRate();
      expect(hitRate).toBe(0.5);
    });

    it("should return 0 hit rate for no accesses", () => {
      const hitRate = marketCacheService.getHitRate();
      expect(hitRate).toBe(0);
    });

    it("should reset stats on clear", () => {
      marketCacheService.set("key", "value", 5000);
      marketCacheService.get("key");
      marketCacheService.get("missing");

      marketCacheService.clear();

      const stats = marketCacheService.getStats();
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
    });

    it("should return correct config in stats", () => {
      const stats = marketCacheService.getStats();
      expect(stats.quoteTtl).toBe(30000);
      expect(stats.historyTtl).toBe(300000);
      expect(stats.searchTtl).toBe(600000);
      expect(stats.maxEntries).toBe(1000);
    });
  });

  describe("configure", () => {
    it("should update config partially", () => {
      marketCacheService.configure({ quoteTtlMs: 60000 });
      expect(marketCacheService.config.quoteTtlMs).toBe(60000);
      expect(marketCacheService.config.historyTtlMs).toBe(300000);
    });

    it("should reset after test", () => {
      marketCacheService.configure({ quoteTtlMs: 99999 });
      marketCacheService.clear();
      marketCacheService.configure({ quoteTtlMs: 30000 });
    });
  });
});
