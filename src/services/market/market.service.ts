import type {
  MarketQuote,
  MarketHistory,
  SearchResult,
  BatchQuoteRequest,
  BatchQuoteResponse,
  HistoryInterval,
  CacheStats,
} from "./market-types";
import { MarketError } from "./market-types";
import { marketCacheService } from "./market-cache.service";
import { marketProviderService } from "./market-provider.service";
import { deduplicateSymbols, isValidSymbol, isValidInterval, createMarketError } from "./market-utils";
import { logger } from "@/lib/logger";

const TAG = "MarketService";

export const marketService = {
  async getQuote(symbol: string): Promise<MarketQuote> {
    if (!isValidSymbol(symbol)) {
      throw createMarketError("INVALID_SYMBOL", `Invalid symbol: ${symbol}`, symbol);
    }

    const cached = marketCacheService.getQuote<MarketQuote>(symbol);
    if (cached) {
      return cached;
    }

    const quote = await marketProviderService.getQuoteWithFallback(symbol);
    marketCacheService.setQuote(symbol, quote);
    return quote;
  },

  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const validSymbols = symbols.filter(isValidSymbol);
    const deduplicated = deduplicateSymbols(validSymbols);

    const cached: MarketQuote[] = [];
    const toFetch: string[] = [];

    for (const symbol of deduplicated) {
      const entry = marketCacheService.getQuote<MarketQuote>(symbol);
      if (entry) {
        cached.push(entry);
      } else {
        toFetch.push(symbol);
      }
    }

    if (toFetch.length === 0) {
      return cached;
    }

    try {
      const fetched = await marketProviderService.getQuotesWithFallback(toFetch);
      for (const quote of fetched) {
        marketCacheService.setQuote(quote.symbol, quote);
      }
      return [...cached, ...fetched];
    } catch (error) {
      logger.error(TAG, `Failed to fetch batch quotes`, error);
      return cached;
    }
  },

  async getHistory(symbol: string, interval: HistoryInterval): Promise<MarketHistory> {
    if (!isValidSymbol(symbol)) {
      throw createMarketError("INVALID_SYMBOL", `Invalid symbol: ${symbol}`, symbol);
    }

    if (!isValidInterval(interval)) {
      throw createMarketError("INVALID_INTERVAL", `Invalid interval: ${interval}`, symbol);
    }

    const cached = marketCacheService.getHistory<MarketHistory>(symbol, interval);
    if (cached) {
      return cached;
    }

    const provider = marketProviderService.getActiveProvider();
    const history = await provider.getHistory(symbol, interval);
    marketCacheService.setHistory(symbol, interval, history);
    return history;
  },

  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const cached = marketCacheService.getSearch<SearchResult[]>(trimmed);
    if (cached) {
      return cached;
    }

    const provider = marketProviderService.getActiveProvider();
    const results = await provider.search(trimmed);
    marketCacheService.setSearch(trimmed, results);
    return results;
  },

  async getBatchQuotes(request: BatchQuoteRequest): Promise<BatchQuoteResponse> {
    const errors: MarketError[] = [];
    const quotes: MarketQuote[] = [];

    const validSymbols = request.symbols.filter((s) => {
      if (!isValidSymbol(s)) {
        errors.push(createMarketError("INVALID_SYMBOL", `Invalid symbol: ${s}`, s));
        return false;
      }
      return true;
    });

    const deduplicated = deduplicateSymbols(validSymbols);
    const cached: MarketQuote[] = [];
    const toFetch: string[] = [];

    for (const symbol of deduplicated) {
      const entry = marketCacheService.getQuote<MarketQuote>(symbol);
      if (entry) {
        cached.push(entry);
      } else {
        toFetch.push(symbol);
      }
    }

    if (toFetch.length > 0) {
      try {
        const fetched = await marketProviderService.getQuotesWithFallback(toFetch);
        for (const quote of fetched) {
          marketCacheService.setQuote(quote.symbol, quote);
        }
        quotes.push(...fetched);
      } catch (error) {
        const marketError = createMarketError(
          "PROVIDER_ERROR",
          `Batch fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        errors.push(marketError);
        logger.error(TAG, "Batch quote fetch failed", error);
      }
    }

    return {
      quotes: [...cached, ...quotes],
      errors,
      timestamp: new Date().toISOString(),
    };
  },

  invalidateCache(pattern?: string): number {
    if (pattern) {
      return marketCacheService.invalidate(pattern);
    }
    marketCacheService.clear();
    return 0;
  },

  getCacheStats(): CacheStats {
    return marketCacheService.getStats();
  },
};
