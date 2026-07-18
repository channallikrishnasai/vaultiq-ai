export type AssetType =
  | "stock_nse"
  | "stock_bse"
  | "mutual_fund"
  | "etf"
  | "gold"
  | "silver"
  | "index"
  | "cash"
  | "crypto"
  | "us_stock"
  | "bond"
  | "reit";

export type MarketStatus = "open" | "closed" | "pre_market" | "post_market";

export type ProviderName = "yahoo" | "alpha_vantage" | "mock";

export interface MarketQuote {
  symbol: string;
  name: string;
  assetType: AssetType;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  volume: number;
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
  week52High: number | null;
  week52Low: number | null;
  dayHigh: number;
  dayLow: number;
  timestamp: string;
  provider: ProviderName;
}

export interface MarketHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
}

export interface MarketHistory {
  symbol: string;
  name: string;
  assetType: AssetType;
  interval: HistoryInterval;
  data: MarketHistoryPoint[];
  provider: ProviderName;
}

export type HistoryInterval = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max";

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string | null;
  currency: string;
  sector: string | null;
  industry: string | null;
}

export interface SearchResult {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string | null;
  currency: string;
}

export interface MarketErrorData {
  code: MarketErrorCode;
  message: string;
  symbol?: string;
  provider?: ProviderName;
  timestamp: string;
}

export class MarketError extends Error {
  readonly code: MarketErrorCode;
  readonly symbol?: string;
  readonly provider?: ProviderName;
  readonly timestamp: string;

  constructor(data: MarketErrorData) {
    super(data.message);
    this.name = "MarketError";
    this.code = data.code;
    this.symbol = data.symbol;
    this.provider = data.provider;
    this.timestamp = data.timestamp;
  }
}

export type MarketErrorCode =
  | "PROVIDER_ERROR"
  | "NETWORK_TIMEOUT"
  | "RATE_LIMITED"
  | "UNKNOWN_SYMBOL"
  | "MALFORMED_RESPONSE"
  | "CACHE_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_INTERVAL"
  | "INVALID_SYMBOL";

export interface MarketCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  quoteTtlMs: number;
  historyTtlMs: number;
  searchTtlMs: number;
  maxEntries: number;
}

export interface CacheStats {
  size: number;
  quoteTtl: number;
  historyTtl: number;
  searchTtl: number;
  maxEntries: number;
  hitCount: number;
  missCount: number;
}

export interface MarketProviderConfig {
  name: ProviderName;
  apiKey?: string;
  baseUrl: string;
  rateLimitMs: number;
  timeoutMs: number;
  maxRetries: number;
}

export interface BatchQuoteRequest {
  symbols: string[];
  assetType?: AssetType;
}

export interface BatchQuoteResponse {
  quotes: MarketQuote[];
  errors: MarketError[];
  timestamp: string;
}

export const INDICES: Record<string, { symbol: string; name: string }> = {
  NIFTY50: { symbol: "^NSEI", name: "NIFTY 50" },
  NIFTY_50: { symbol: "^NSEI", name: "NIFTY 50" },
  SENSEX: { symbol: "^BSESN", name: "SENSEX" },
  BANK_NIFTY: { symbol: "^NSEBANK", name: "NIFTY Bank" },
  BANKNIFTY: { symbol: "^NSEBANK", name: "NIFTY Bank" },
};

export const INDEX_SYMBOLS_LIST: { symbol: string; name: string; assetType: AssetType }[] = [
  { symbol: "^NSEI", name: "NIFTY 50", assetType: "index" },
  { symbol: "^BSESN", name: "SENSEX", assetType: "index" },
  { symbol: "^NSEBANK", name: "NIFTY Bank", assetType: "index" },
];
