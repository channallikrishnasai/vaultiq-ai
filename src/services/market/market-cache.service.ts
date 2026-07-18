import type { MarketCacheEntry, CacheConfig, CacheStats } from "./market-types";
import { logger } from "@/lib/logger";

const TAG = "MarketCache";

const DEFAULT_CONFIG: CacheConfig = {
  quoteTtlMs: 30_000,
  historyTtlMs: 300_000,
  searchTtlMs: 600_000,
  maxEntries: 1000,
};

export const marketCacheService = {
  store: new Map<string, MarketCacheEntry<unknown>>(),
  config: { ...DEFAULT_CONFIG },
  hitCount: 0,
  missCount: 0,

  configure(partial: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...partial };
  },

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as MarketCacheEntry<T> | undefined;
    if (!entry) {
      this.missCount++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      this.missCount++;
      logger.debug(TAG, `Cache expired: ${key}`);
      return null;
    }

    this.hitCount++;
    logger.debug(TAG, `Cache hit: ${key}`);
    return entry.data;
  },

  set<T>(key: string, data: T, ttlMs?: number): void {
    if (this.store.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    const entry: MarketCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs ?? this.config.quoteTtlMs,
    };

    this.store.set(key, entry);
    logger.debug(TAG, `Cache set: ${key}`);
  },

  getQuoteKey(symbol: string): string {
    return `quote:${symbol.toUpperCase()}`;
  },

  getHistoryKey(symbol: string, interval: string): string {
    return `history:${symbol.toUpperCase()}:${interval}`;
  },

  getSearchKey(query: string): string {
    return `search:${query.toLowerCase().trim()}`;
  },

  setQuote<T>(symbol: string, data: T): void {
    this.set(this.getQuoteKey(symbol), data, this.config.quoteTtlMs);
  },

  getQuote<T>(symbol: string): T | null {
    return this.get<T>(this.getQuoteKey(symbol));
  },

  setHistory<T>(symbol: string, interval: string, data: T): void {
    this.set(this.getHistoryKey(symbol, interval), data, this.config.historyTtlMs);
  },

  getHistory<T>(symbol: string, interval: string): T | null {
    return this.get<T>(this.getHistoryKey(symbol, interval));
  },

  setSearch<T>(query: string, data: T): void {
    this.set(this.getSearchKey(query), data, this.config.searchTtlMs);
  },

  getSearch<T>(query: string): T | null {
    return this.get<T>(this.getSearchKey(query));
  },

  invalidate(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern, "i");
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    logger.info(TAG, `Invalidated ${count} entries matching: ${pattern}`);
    return count;
  },

  invalidateSymbol(symbol: string): number {
    const upper = symbol.toUpperCase();
    return this.invalidate(`^.*:${upper}`);
  },

  clear(): void {
    const size = this.store.size;
    this.store.clear();
    this.hitCount = 0;
    this.missCount = 0;
    logger.info(TAG, `Cleared ${size} cache entries`);
  },

  evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      logger.debug(TAG, `Evicted oldest entry: ${oldestKey}`);
    }
  },

  get size(): number {
    return this.store.size;
  },

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return false;
    }

    return true;
  },

  getRemainingTtl(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;

    const elapsed = Date.now() - entry.timestamp;
    const remaining = entry.ttl - elapsed;
    return remaining > 0 ? remaining : 0;
  },

  getStats(): CacheStats {
    return {
      size: this.store.size,
      quoteTtl: this.config.quoteTtlMs,
      historyTtl: this.config.historyTtlMs,
      searchTtl: this.config.searchTtlMs,
      maxEntries: this.config.maxEntries,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  },

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    if (total === 0) return 0;
    return this.hitCount / total;
  },
};
