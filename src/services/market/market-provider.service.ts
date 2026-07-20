import type {
  MarketQuote,
  MarketHistory,
  SearchResult,
  MarketProviderConfig,
  HistoryInterval,
  ProviderName,
} from "./market-types";
import { createMarketError, resolveProviderSymbol, parseYahooQuote, parseYahooHistory, parseYahooSearch, detectAssetType, generateMockHistory } from "./market-utils";
import { logger } from "@/lib/logger";

const TAG = "MarketProvider";

export interface MarketProvider {
  readonly name: ProviderName;
  readonly config: MarketProviderConfig;

  getQuote(symbol: string): Promise<MarketQuote>;
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
  getHistory(symbol: string, interval: HistoryInterval): Promise<MarketHistory>;
  search(query: string): Promise<SearchResult[]>;
  isAvailable(): boolean;
}

const YAHOO_CONFIG: MarketProviderConfig = {
  name: "yahoo",
  baseUrl: "https://query1.finance.yahoo.com/v8",
  rateLimitMs: 1000,
  timeoutMs: 10000,
  maxRetries: 2,
};

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.warn(TAG, `Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export const yahooProvider: MarketProvider = {
  name: "yahoo",
  config: YAHOO_CONFIG,

  async getQuote(symbol: string): Promise<MarketQuote> {
    const providerSymbol = resolveProviderSymbol(symbol, detectAssetType(symbol));
    const url = `${YAHOO_CONFIG.baseUrl}/finance/quote/${providerSymbol}`;

    try {
      const response = await retryWithBackoff(
        () => fetchWithTimeout(url, YAHOO_CONFIG.timeoutMs),
        YAHOO_CONFIG.maxRetries,
        YAHOO_CONFIG.rateLimitMs,
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw createMarketError("UNKNOWN_SYMBOL", `Symbol not found: ${symbol}`, symbol, "yahoo");
        }
        if (response.status === 429) {
          throw createMarketError("RATE_LIMITED", "Rate limit exceeded", symbol, "yahoo");
        }
        throw createMarketError("PROVIDER_ERROR", `Provider returned ${response.status}`, symbol, "yahoo");
      }

      const data = await response.json();
      const quoteResult = data?.quoteResponse?.result?.[0];

      if (!quoteResult) {
        throw createMarketError("MALFORMED_RESPONSE", "No quote data in response", symbol, "yahoo");
      }

      const parsed = parseYahooQuote(quoteResult);
      const assetType = detectAssetType(symbol);

      return {
        symbol: symbol.toUpperCase(),
        name: parsed.name ?? "",
        assetType,
        price: parsed.price ?? 0,
        change: parsed.change ?? 0,
        changePercent: parsed.changePercent ?? 0,
        open: parsed.open ?? 0,
        high: parsed.high ?? 0,
        low: parsed.low ?? 0,
        close: parsed.close ?? 0,
        previousClose: parsed.previousClose ?? 0,
        volume: parsed.volume ?? 0,
        marketCap: parsed.marketCap ?? null,
        pe: parsed.pe ?? null,
        eps: parsed.eps ?? null,
        week52High: parsed.week52High ?? null,
        week52Low: parsed.week52Low ?? null,
        dayHigh: parsed.dayHigh ?? 0,
        dayLow: parsed.dayLow ?? 0,
        timestamp: new Date().toISOString(),
        provider: "yahoo",
      };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        throw error;
      }
      throw createMarketError(
        "PROVIDER_ERROR",
        `Failed to fetch quote: ${error instanceof Error ? error.message : String(error)}`,
        symbol,
        "yahoo",
      );
    }
  },

  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const results: MarketQuote[] = [];
    const batchSize = 5;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map((symbol) => this.getQuote(symbol));
      const settled = await Promise.allSettled(promises);

      for (const result of settled) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        }
      }

      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, YAHOO_CONFIG.rateLimitMs));
      }
    }

    return results;
  },

  async getHistory(symbol: string, interval: HistoryInterval): Promise<MarketHistory> {
    const providerSymbol = resolveProviderSymbol(symbol, detectAssetType(symbol));
    const url = `${YAHOO_CONFIG.baseUrl}/finance/chart/${providerSymbol}?interval=${interval}`;

    try {
      const response = await retryWithBackoff(
        () => fetchWithTimeout(url, YAHOO_CONFIG.timeoutMs),
        YAHOO_CONFIG.maxRetries,
        YAHOO_CONFIG.rateLimitMs,
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw createMarketError("UNKNOWN_SYMBOL", `Symbol not found: ${symbol}`, symbol, "yahoo");
        }
        throw createMarketError("PROVIDER_ERROR", `Provider returned ${response.status}`, symbol, "yahoo");
      }

      const data = await response.json();
      const chartResult = data?.chart?.result?.[0];

      if (!chartResult) {
        throw createMarketError("MALFORMED_RESPONSE", "No history data in response", symbol, "yahoo");
      }

      const meta = chartResult.meta ?? {};
      const parsedData = parseYahooHistory(chartResult);

      return {
        symbol: symbol.toUpperCase(),
        name: meta.shortName ?? meta.longName ?? "",
        assetType: detectAssetType(symbol),
        interval,
        data: parsedData,
        provider: "yahoo",
      };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        throw error;
      }
      throw createMarketError(
        "PROVIDER_ERROR",
        `Failed to fetch history: ${error instanceof Error ? error.message : String(error)}`,
        symbol,
        "yahoo",
      );
    }
  },

  async search(query: string): Promise<SearchResult[]> {
    const url = `${YAHOO_CONFIG.baseUrl}/finance/search?q=${encodeURIComponent(query)}`;

    try {
      const response = await retryWithBackoff(
        () => fetchWithTimeout(url, YAHOO_CONFIG.timeoutMs),
        YAHOO_CONFIG.maxRetries,
        YAHOO_CONFIG.rateLimitMs,
      );

      if (!response.ok) {
        throw createMarketError("PROVIDER_ERROR", `Search returned ${response.status}`);
      }

      const data = await response.json();
      return parseYahooSearch(data);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        throw error;
      }
      throw createMarketError(
        "PROVIDER_ERROR",
        `Failed to search: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  isAvailable(): boolean {
    return true;
  },
};

const MOCK_QUOTES: Record<string, MarketQuote> = {
  RELIANCE: {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    assetType: "stock_nse",
    price: 2845.5,
    change: 32.15,
    changePercent: 1.14,
    open: 2815.0,
    high: 2852.75,
    low: 2810.25,
    close: 2813.35,
    previousClose: 2813.35,
    volume: 8542100,
    marketCap: 1927500000000,
    pe: 28.5,
    eps: 99.84,
    week52High: 3024.9,
    week52Low: 2220.3,
    dayHigh: 2852.75,
    dayLow: 2810.25,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  TCS: {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd",
    assetType: "stock_nse",
    price: 4125.8,
    change: -18.45,
    changePercent: -0.45,
    open: 4145.0,
    high: 4158.3,
    low: 4112.6,
    close: 4144.25,
    previousClose: 4144.25,
    volume: 3215400,
    marketCap: 1498000000000,
    pe: 34.2,
    eps: 120.64,
    week52High: 4592.25,
    week52Low: 3056.2,
    dayHigh: 4158.3,
    dayLow: 4112.6,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  HDFCBANK: {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    assetType: "stock_nse",
    price: 1687.3,
    change: 22.7,
    changePercent: 1.36,
    open: 1668.0,
    high: 1692.45,
    low: 1662.1,
    close: 1664.6,
    previousClose: 1664.6,
    volume: 12456800,
    marketCap: 1287000000000,
    pe: 19.8,
    eps: 85.22,
    week52High: 1794.0,
    week52Low: 1363.55,
    dayHigh: 1692.45,
    dayLow: 1662.1,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  INFY: {
    symbol: "INFY",
    name: "Infosys Ltd",
    assetType: "stock_nse",
    price: 1542.6,
    change: 15.3,
    changePercent: 1.0,
    open: 1528.0,
    high: 1548.9,
    low: 1522.4,
    close: 1527.3,
    previousClose: 1527.3,
    volume: 6789200,
    marketCap: 641200000000,
    pe: 28.9,
    eps: 53.38,
    week52High: 1672.0,
    week52Low: 1230.5,
    dayHigh: 1548.9,
    dayLow: 1522.4,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  ICICIBANK: {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd",
    assetType: "stock_nse",
    price: 1123.45,
    change: 18.9,
    changePercent: 1.71,
    open: 1106.0,
    high: 1128.75,
    low: 1101.3,
    close: 1104.55,
    previousClose: 1104.55,
    volume: 15234500,
    marketCap: 787500000000,
    pe: 18.2,
    eps: 61.73,
    week52High: 1230.15,
    week52Low: 898.2,
    dayHigh: 1128.75,
    dayLow: 1101.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  WIPRO: {
    symbol: "WIPRO",
    name: "Wipro Ltd",
    assetType: "stock_nse",
    price: 478.25,
    change: -5.6,
    changePercent: -1.16,
    open: 484.0,
    high: 486.5,
    low: 475.8,
    close: 483.85,
    previousClose: 483.85,
    volume: 4567800,
    marketCap: 248900000000,
    pe: 22.4,
    eps: 21.35,
    week52High: 524.6,
    week52Low: 380.15,
    dayHigh: 486.5,
    dayLow: 475.8,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  BHARTIARTL: {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Ltd",
    assetType: "stock_nse",
    price: 1456.8,
    change: 28.45,
    changePercent: 1.99,
    open: 1430.0,
    high: 1462.3,
    low: 1425.5,
    close: 1428.35,
    previousClose: 1428.35,
    volume: 3456700,
    marketCap: 875600000000,
    pe: 72.5,
    eps: 20.09,
    week52High: 1510.2,
    week52Low: 1025.8,
    dayHigh: 1462.3,
    dayLow: 1425.5,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  SBIN: {
    symbol: "SBIN",
    name: "State Bank of India",
    assetType: "stock_nse",
    price: 782.35,
    change: 12.8,
    changePercent: 1.66,
    open: 770.0,
    high: 786.9,
    low: 766.25,
    close: 769.55,
    previousClose: 769.55,
    volume: 22345600,
    marketCap: 698700000000,
    pe: 10.2,
    eps: 76.7,
    week52High: 825.35,
    week52Low: 555.75,
    dayHigh: 786.9,
    dayLow: 766.25,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  "^NSEI": {
    symbol: "^NSEI",
    name: "NIFTY 50",
    assetType: "index",
    price: 24567.8,
    change: 145.3,
    changePercent: 0.6,
    open: 24450.0,
    high: 24589.2,
    low: 24412.5,
    close: 24422.5,
    previousClose: 24422.5,
    volume: 0,
    marketCap: null,
    pe: null,
    eps: null,
    week52High: 26277.35,
    week52Low: 21285.2,
    dayHigh: 24589.2,
    dayLow: 24412.5,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  "^BSESN": {
    symbol: "^BSESN",
    name: "SENSEX",
    assetType: "index",
    price: 81234.5,
    change: 478.2,
    changePercent: 0.59,
    open: 80800.0,
    high: 81350.75,
    low: 80650.25,
    close: 80756.3,
    previousClose: 80756.3,
    volume: 0,
    marketCap: null,
    pe: null,
    eps: null,
    week52High: 85456.9,
    week52Low: 68234.5,
    dayHigh: 81350.75,
    dayLow: 80650.25,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  "^NSEBANK": {
    symbol: "^NSEBANK",
    name: "NIFTY Bank",
    assetType: "index",
    price: 52345.6,
    change: -234.8,
    changePercent: -0.45,
    open: 52600.0,
    high: 52750.4,
    low: 52180.9,
    close: 52580.4,
    previousClose: 52580.4,
    volume: 0,
    marketCap: null,
    pe: null,
    eps: null,
    week52High: 54890.25,
    week52Low: 44520.6,
    dayHigh: 52750.4,
    dayLow: 52180.9,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  NIFTYBEES: {
    symbol: "NIFTYBEES",
    name: "Nippon India ETF Nifty BeES",
    assetType: "etf",
    price: 245.8,
    change: 1.45,
    changePercent: 0.59,
    open: 244.5,
    high: 246.2,
    low: 243.9,
    close: 244.35,
    previousClose: 244.35,
    volume: 8923400,
    marketCap: null,
    pe: null,
    eps: null,
    week52High: 262.8,
    week52Low: 212.5,
    dayHigh: 246.2,
    dayLow: 243.9,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  GOLDBEES: {
    symbol: "GOLDBEES",
    name: "Nippon India ETF Gold BeES",
    assetType: "etf",
    price: 52.45,
    change: 0.85,
    changePercent: 1.65,
    open: 51.8,
    high: 52.6,
    low: 51.6,
    close: 51.6,
    previousClose: 51.6,
    volume: 3456700,
    marketCap: null,
    pe: null,
    eps: null,
    week52High: 54.2,
    week52Low: 42.8,
    dayHigh: 52.6,
    dayLow: 51.6,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  HDFCGOLD: {
    symbol: "HDFCGOLD",
    name: "HDFC Gold ETF",
    assetType: "etf",
    price: 51.9,
    change: 0.75,
    changePercent: 1.47,
    open: 51.2,
    high: 52.1,
    low: 51.0,
    close: 51.15,
    previousClose: 51.15,
    volume: 2345600,
    marketCap: null,
    pe: null,
    eps: null,
    week52High: 53.8,
    week52Low: 41.9,
    dayHigh: 52.1,
    dayLow: 51.0,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  SBINEQ: {
    symbol: "SBINEQ",
    name: "SBI Nifty Next 50 Index Fund",
    assetType: "mutual_fund",
    price: 178.45,
    change: 2.3,
    changePercent: 1.31,
    open: 176.5,
    high: 179.1,
    low: 175.8,
    close: 176.15,
    previousClose: 176.15,
    volume: 0,
    marketCap: null,
    pe: null,
    eps: null,
    week52High: 192.4,
    week52Low: 148.6,
    dayHigh: 179.1,
    dayLow: 175.8,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  LT: {
    symbol: "LT",
    name: "Larsen & Toubro Ltd",
    assetType: "stock_nse",
    price: 3456.75,
    change: 45.2,
    changePercent: 1.32,
    open: 3415.0,
    high: 3468.5,
    low: 3402.3,
    close: 3411.55,
    previousClose: 3411.55,
    volume: 4567800,
    marketCap: 476800000000,
    pe: 36.2,
    eps: 95.49,
    week52High: 3756.8,
    week52Low: 2680.4,
    dayHigh: 3468.5,
    dayLow: 3402.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  ITC: {
    symbol: "ITC",
    name: "ITC Ltd",
    assetType: "stock_nse",
    price: 462.3,
    change: 5.8,
    changePercent: 1.27,
    open: 457.0,
    high: 464.5,
    low: 455.2,
    close: 456.5,
    previousClose: 456.5,
    volume: 18234500,
    marketCap: 576800000000,
    pe: 28.9,
    eps: 15.99,
    week52High: 500.2,
    week52Low: 399.6,
    dayHigh: 464.5,
    dayLow: 455.2,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  HINDUNILVR: {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever Ltd",
    assetType: "stock_nse",
    price: 2345.6,
    change: -18.9,
    changePercent: -0.8,
    open: 2365.0,
    high: 2372.4,
    low: 2338.5,
    close: 2364.5,
    previousClose: 2364.5,
    volume: 2345600,
    marketCap: 551200000000,
    pe: 58.2,
    eps: 40.3,
    week52High: 2769.7,
    week52Low: 2136.0,
    dayHigh: 2372.4,
    dayLow: 2338.5,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  KOTAKBANK: {
    symbol: "KOTAKBANK",
    name: "Kotak Mahindra Bank Ltd",
    assetType: "stock_nse",
    price: 1876.45,
    change: 24.3,
    changePercent: 1.31,
    open: 1855.0,
    high: 1882.7,
    low: 1848.6,
    close: 1852.15,
    previousClose: 1852.15,
    volume: 8765400,
    marketCap: 372800000000,
    pe: 22.4,
    eps: 83.77,
    week52High: 1992.0,
    week52Low: 1543.8,
    dayHigh: 1882.7,
    dayLow: 1848.6,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  AXISBANK: {
    symbol: "AXISBANK",
    name: "Axis Bank Ltd",
    assetType: "stock_nse",
    price: 1134.8,
    change: 15.6,
    changePercent: 1.39,
    open: 1120.0,
    high: 1139.5,
    low: 1115.3,
    close: 1119.2,
    previousClose: 1119.2,
    volume: 12345600,
    marketCap: 352800000000,
    pe: 15.8,
    eps: 71.82,
    week52High: 1240.5,
    week52Low: 920.3,
    dayHigh: 1139.5,
    dayLow: 1115.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  BAJFINANCE: {
    symbol: "BAJFINANCE",
    name: "Bajaj Finance Ltd",
    assetType: "stock_nse",
    price: 7234.5,
    change: 89.3,
    changePercent: 1.25,
    open: 7150.0,
    high: 7256.8,
    low: 7125.4,
    close: 7145.2,
    previousClose: 7145.2,
    volume: 3456700,
    marketCap: 447800000000,
    pe: 32.5,
    eps: 222.6,
    week52High: 7999.0,
    week52Low: 5825.3,
    dayHigh: 7256.8,
    dayLow: 7125.4,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  MARUTI: {
    symbol: "MARUTI",
    name: "Maruti Suzuki India Ltd",
    assetType: "stock_nse",
    price: 11234.6,
    change: 156.8,
    changePercent: 1.41,
    open: 11085.0,
    high: 11268.5,
    low: 11052.3,
    close: 11077.8,
    previousClose: 11077.8,
    volume: 1234500,
    marketCap: 354200000000,
    pe: 28.9,
    eps: 388.74,
    week52High: 12500.0,
    week52Low: 9738.5,
    dayHigh: 11268.5,
    dayLow: 11052.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  TATAMOTORS: {
    symbol: "TATAMOTORS",
    name: "Tata Motors Ltd",
    assetType: "stock_nse",
    price: 987.6,
    change: 18.4,
    changePercent: 1.9,
    open: 970.0,
    high: 992.3,
    low: 965.8,
    close: 969.2,
    previousClose: 969.2,
    volume: 23456700,
    marketCap: 361200000000,
    pe: 8.5,
    eps: 116.19,
    week52High: 1180.0,
    week52Low: 614.0,
    dayHigh: 992.3,
    dayLow: 965.8,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  SUNPHARMA: {
    symbol: "SUNPHARMA",
    name: "Sun Pharmaceutical Industries Ltd",
    assetType: "stock_nse",
    price: 1678.45,
    change: 22.3,
    changePercent: 1.35,
    open: 1658.0,
    high: 1684.7,
    low: 1652.3,
    close: 1656.15,
    previousClose: 1656.15,
    volume: 4567800,
    marketCap: 402800000000,
    pe: 34.8,
    eps: 48.23,
    week52High: 1788.0,
    week52Low: 1208.5,
    dayHigh: 1684.7,
    dayLow: 1652.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  ADANIENT: {
    symbol: "ADANIENT",
    name: "Adani Enterprises Ltd",
    assetType: "stock_nse",
    price: 3124.5,
    change: -45.8,
    changePercent: -1.45,
    open: 3175.0,
    high: 3182.4,
    low: 3108.6,
    close: 3170.3,
    previousClose: 3170.3,
    volume: 5678900,
    marketCap: 356800000000,
    pe: 68.5,
    eps: 45.61,
    week52High: 3743.8,
    week52Low: 1942.0,
    dayHigh: 3182.4,
    dayLow: 3108.6,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  TATASTEEL: {
    symbol: "TATASTEEL",
    name: "Tata Steel Ltd",
    assetType: "stock_nse",
    price: 145.6,
    change: 2.8,
    changePercent: 1.96,
    open: 143.0,
    high: 146.8,
    low: 142.3,
    close: 142.8,
    previousClose: 142.8,
    volume: 45678900,
    marketCap: 176800000000,
    pe: 62.5,
    eps: 2.33,
    week52High: 168.5,
    week52Low: 116.1,
    dayHigh: 146.8,
    dayLow: 142.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  ONGC: {
    symbol: "ONGC",
    name: "Oil & Natural Gas Corporation Ltd",
    assetType: "stock_nse",
    price: 278.45,
    change: 4.3,
    changePercent: 1.57,
    open: 274.5,
    high: 280.2,
    low: 273.8,
    close: 274.15,
    previousClose: 274.15,
    volume: 18234500,
    marketCap: 349800000000,
    pe: 7.8,
    eps: 35.7,
    week52High: 345.0,
    week52Low: 198.5,
    dayHigh: 280.2,
    dayLow: 273.8,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  NTPC: {
    symbol: "NTPC",
    name: "NTPC Ltd",
    assetType: "stock_nse",
    price: 356.75,
    change: 5.4,
    changePercent: 1.54,
    open: 352.0,
    high: 358.9,
    low: 350.5,
    close: 351.35,
    previousClose: 351.35,
    volume: 15678900,
    marketCap: 345600000000,
    pe: 16.2,
    eps: 22.02,
    week52High: 397.0,
    week52Low: 252.5,
    dayHigh: 358.9,
    dayLow: 350.5,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  POWERGRID: {
    symbol: "POWERGRID",
    name: "Power Grid Corporation of India Ltd",
    assetType: "stock_nse",
    price: 298.4,
    change: 3.8,
    changePercent: 1.29,
    open: 295.0,
    high: 299.8,
    low: 293.6,
    close: 294.6,
    previousClose: 294.6,
    volume: 12345600,
    marketCap: 276800000000,
    pe: 15.8,
    eps: 18.89,
    week52High: 320.5,
    week52Low: 222.5,
    dayHigh: 299.8,
    dayLow: 293.6,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  HCLTECH: {
    symbol: "HCLTECH",
    name: "HCL Technologies Ltd",
    assetType: "stock_nse",
    price: 1567.8,
    change: -12.4,
    changePercent: -0.79,
    open: 1582.0,
    high: 1588.5,
    low: 1562.3,
    close: 1580.2,
    previousClose: 1580.2,
    volume: 3456700,
    marketCap: 425600000000,
    pe: 24.5,
    eps: 63.99,
    week52High: 1712.0,
    week52Low: 1186.2,
    dayHigh: 1588.5,
    dayLow: 1562.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
  TECHM: {
    symbol: "TECHM",
    name: "Tech Mahindra Ltd",
    assetType: "stock_nse",
    price: 1423.5,
    change: 18.6,
    changePercent: 1.32,
    open: 1406.0,
    high: 1428.9,
    low: 1402.3,
    close: 1404.9,
    previousClose: 1404.9,
    volume: 2345600,
    marketCap: 138900000000,
    pe: 42.8,
    eps: 33.26,
    week52High: 1584.5,
    week52Low: 1115.4,
    dayHigh: 1428.9,
    dayLow: 1402.3,
    timestamp: new Date().toISOString(),
    provider: "mock",
  },
};

const MOCK_SEARCH_DATA: SearchResult[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "INFY", name: "Infosys Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "WIPRO", name: "Wipro Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "SBIN", name: "State Bank of India", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "ITC", name: "ITC Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "TATASTEEL", name: "Tata Steel Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corporation Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "NTPC", name: "NTPC Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "TECHM", name: "Tech Mahindra Ltd", assetType: "stock_nse", exchange: "NSE", currency: "INR" },
  { symbol: "^NSEI", name: "NIFTY 50", assetType: "index", exchange: "NSE", currency: "INR" },
  { symbol: "^BSESN", name: "SENSEX", assetType: "index", exchange: "BSE", currency: "INR" },
  { symbol: "^NSEBANK", name: "NIFTY Bank", assetType: "index", exchange: "NSE", currency: "INR" },
  { symbol: "NIFTYBEES", name: "Nippon India ETF Nifty BeES", assetType: "etf", exchange: "NSE", currency: "INR" },
  { symbol: "GOLDBEES", name: "Nippon India ETF Gold BeES", assetType: "etf", exchange: "NSE", currency: "INR" },
  { symbol: "HDFCGOLD", name: "HDFC Gold ETF", assetType: "etf", exchange: "NSE", currency: "INR" },
  { symbol: "SBINEQ", name: "SBI Nifty Next 50 Index Fund", assetType: "mutual_fund", exchange: null, currency: "INR" },
];

function getIntervalDays(interval: HistoryInterval): number {
  const map: Record<HistoryInterval, number> = {
    "1d": 1,
    "5d": 5,
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    "5y": 1825,
    max: 3650,
  };
  return map[interval];
}

export const mockProvider: MarketProvider = {
  name: "mock",
  config: {
    name: "mock",
    baseUrl: "",
    rateLimitMs: 0,
    timeoutMs: 5000,
    maxRetries: 0,
  },

  async getQuote(symbol: string): Promise<MarketQuote> {
    const upper = symbol.toUpperCase();
    const quote = MOCK_QUOTES[upper];

    if (!quote) {
      throw createMarketError("UNKNOWN_SYMBOL", `Mock symbol not found: ${symbol}`, symbol, "mock");
    }

    return { ...quote, timestamp: new Date().toISOString() };
  },

  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const results: MarketQuote[] = [];
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        results.push(quote);
      } catch {
        // Skip failed symbols
      }
    }
    return results;
  },

  async getHistory(symbol: string, interval: HistoryInterval): Promise<MarketHistory> {
    const upper = symbol.toUpperCase();
    const days = getIntervalDays(interval);
    const basePrice = MOCK_QUOTES[upper]?.price ?? 1000;

    const data = generateMockHistory(basePrice, days);

    return {
      symbol: upper,
      name: MOCK_QUOTES[upper]?.name ?? upper,
      assetType: detectAssetType(symbol),
      interval,
      data,
      provider: "mock",
    };
  },

  async search(query: string): Promise<SearchResult[]> {
    const upper = query.toUpperCase().trim();

    if (upper.length < 2) return [];

    return MOCK_SEARCH_DATA.filter(
      (item) =>
        item.symbol.includes(upper) ||
        item.name.toUpperCase().includes(upper),
    );
  },

  isAvailable(): boolean {
    return true;
  },
};

const providers: Map<ProviderName, MarketProvider> = new Map([
  ["yahoo", yahooProvider],
  ["mock", mockProvider],
]);

let activeProviderName: ProviderName = "yahoo";

export const marketProviderService = {
  register(provider: MarketProvider): void {
    providers.set(provider.name, provider);
    logger.info(TAG, `Registered provider: ${provider.name}`);
  },

  unregister(name: ProviderName): boolean {
    return providers.delete(name);
  },

  getActiveProvider(): MarketProvider {
    const provider = providers.get(activeProviderName);
    if (!provider) {
      throw createMarketError("PROVIDER_UNAVAILABLE", `Active provider not found: ${activeProviderName}`);
    }
    return provider;
  },

  setActiveProvider(name: ProviderName): void {
    if (!providers.has(name)) {
      throw createMarketError("PROVIDER_UNAVAILABLE", `Provider not registered: ${name}`);
    }
    activeProviderName = name;
    logger.info(TAG, `Active provider set to: ${name}`);
  },

  getProvider(name: ProviderName): MarketProvider | undefined {
    return providers.get(name);
  },

  getAvailableProviders(): ProviderName[] {
    return Array.from(providers.keys()).filter((name) => {
      const provider = providers.get(name);
      return provider?.isAvailable() ?? false;
    });
  },

  async getQuoteWithFallback(symbol: string): Promise<MarketQuote> {
    const provider = this.getActiveProvider();
    try {
      return await provider.getQuote(symbol);
    } catch (error) {
      const fallbackName = activeProviderName === "yahoo" ? "mock" : "yahoo";
      const fallback = providers.get(fallbackName);
      if (fallback && fallback.isAvailable()) {
        logger.warn(TAG, `Falling back to ${fallbackName} for ${symbol}`);
        return fallback.getQuote(symbol);
      }
      throw error;
    }
  },

  async getQuotesWithFallback(symbols: string[]): Promise<MarketQuote[]> {
    const provider = this.getActiveProvider();
    try {
      return await provider.getQuotes(symbols);
    } catch (error) {
      const fallbackName = activeProviderName === "yahoo" ? "mock" : "yahoo";
      const fallback = providers.get(fallbackName);
      if (fallback && fallback.isAvailable()) {
        logger.warn(TAG, `Falling back to ${fallbackName} for batch quotes`);
        return fallback.getQuotes(symbols);
      }
      throw error;
    }
  },
};
