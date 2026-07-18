import type {
  AssetType,
  MarketQuote,
  MarketHistoryPoint,
  SearchResult,
  MarketErrorCode,
  HistoryInterval,
} from "./market-types";
import { MarketError, INDICES } from "./market-types";

const INDIAN_EXCHANGES = ["NSE", "BSE"];

const SYMBOL_SUFFIXES: Record<AssetType, string> = {
  stock_nse: ".NS",
  stock_bse: ".BO",
  mutual_fund: "",
  etf: ".NS",
  gold: "",
  silver: "",
  index: "",
  cash: "",
  crypto: "",
  us_stock: "",
  bond: "",
  reit: "",
};

const INTERVAL_PERIODS: Record<HistoryInterval, string> = {
  "1d": "1d",
  "5d": "5d",
  "1mo": "1mo",
  "3mo": "3mo",
  "6mo": "6mo",
  "1y": "1y",
  "5y": "5y",
  max: "max",
};

const MUTUAL_FUND_PREFIXES = ["HDFC", "ICICI", "SBI", "AXIS", "NIPPON", "ADITYA BIRLA", "KOTAK", "DSP", "MOTILAL", "Mirae"];

const ETF_SYMBOLS = new Set([
  "NIFTYBEES", "JUNIORBEES", "BANKBEES", "BEES", "GOLDBEES",
  "SILVERBEES", "MIDCAPBEES", "ITBEES", "PSUBNKBEES", "NEXT50",
  "ICICINIFTY", "ICICIBANK", "NIFTYETF", "SENSEXETF",
]);

export function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase().trim();
  return INDICES[upper]?.symbol ?? upper;
}

export function resolveProviderSymbol(symbol: string, assetType: AssetType): string {
  const normalized = normalizeSymbol(symbol);
  if (assetType === "index") {
    return INDICES[normalized]?.symbol ?? normalized;
  }
  if (normalized.startsWith("^")) {
    return normalized;
  }
  const suffix = SYMBOL_SUFFIXES[assetType];
  if (suffix && !normalized.endsWith(suffix)) {
    return `${normalized}${suffix}`;
  }
  return normalized;
}

export function detectAssetType(symbol: string): AssetType {
  const upper = symbol.toUpperCase().trim();

  if (INDICES[upper] || upper.startsWith("^")) {
    return "index";
  }

  if (ETF_SYMBOLS.has(upper) || upper.endsWith("BEES")) {
    return "etf";
  }

  for (const prefix of MUTUAL_FUND_PREFIXES) {
    if (upper.startsWith(prefix) && !upper.includes(".NS") && !upper.includes(".BO")) {
      return "mutual_fund";
    }
  }

  if (upper.endsWith(".NS")) return "stock_nse";
  if (upper.endsWith(".BO")) return "stock_bse";

  if (upper === "GOLD" || upper === "XAUUSD" || upper === "GOLD24K") return "gold";
  if (upper === "SILVER" || upper === "XAGUSD") return "silver";
  if (upper === "CASH" || upper === "USDINR" || upper === "EURINR") return "cash";

  return "stock_nse";
}

export function formatPrice(price: number): string {
  if (price >= 1_00_00_000) {
    return `${(price / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (price >= 1_00_000) {
    return `${(price / 1_00_000).toFixed(2)}L`;
  }
  return price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatVolume(volume: number): string {
  if (volume >= 1_00_00_000) {
    return `${(volume / 1_00_00_000).toFixed(2)}B`;
  }
  if (volume >= 1_00_000) {
    return `${(volume / 1_00_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }
  return volume.toString();
}

export function formatMarketCap(cap: number | null): string {
  if (cap === null) return "N/A";
  return `₹${formatPrice(cap)}`;
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}`;
}

export function formatChangePercent(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

export function calculateChange(current: number, previous: number): number {
  return current - previous;
}

export function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function isValidSymbol(symbol: string): boolean {
  if (!symbol || symbol.trim().length === 0) return false;
  const normalized = symbol.trim().toUpperCase();
  if (normalized.length > 20) return false;
  return /^[A-Z0-9.^_-]+$/.test(normalized);
}

export function isValidInterval(interval: string): interval is HistoryInterval {
  return interval in INTERVAL_PERIODS;
}

export function getIntervalPeriod(interval: HistoryInterval): string {
  return INTERVAL_PERIODS[interval];
}

export function isIndianExchange(exchange: string | null): boolean {
  if (!exchange) return false;
  return INDIAN_EXCHANGES.includes(exchange.toUpperCase());
}

export function createMarketError(
  code: MarketErrorCode,
  message: string,
  symbol?: string,
  provider?: string,
): MarketError {
  return new MarketError({
    code,
    message,
    symbol,
    provider: provider as MarketError["provider"],
    timestamp: new Date().toISOString(),
  });
}

export function deduplicateSymbols(symbols: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const symbol of symbols) {
    const normalized = normalizeSymbol(symbol);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function groupByAssetType(
  assets: { symbol: string; assetType: AssetType }[],
): Map<AssetType, string[]> {
  const groups = new Map<AssetType, string[]>();
  for (const asset of assets) {
    const existing = groups.get(asset.assetType) ?? [];
    existing.push(asset.symbol);
    groups.set(asset.assetType, existing);
  }
  return groups;
}

export function parseYahooQuote(raw: Record<string, unknown>): Partial<MarketQuote> {
  const price = typeof raw.regularMarketPrice === "number" ? raw.regularMarketPrice : null;
  const previousClose =
    typeof raw.regularMarketPreviousClose === "number"
      ? raw.regularMarketPreviousClose
      : null;

  return {
    symbol: String(raw.symbol ?? ""),
    name: String(raw.shortName ?? raw.longName ?? ""),
    price: price ?? 0,
    change: previousClose !== null && price !== null ? price - previousClose : 0,
    changePercent:
      previousClose !== null && price !== null && previousClose > 0
        ? ((price - previousClose) / previousClose) * 100
        : 0,
    open: typeof raw.regularMarketOpen === "number" ? raw.regularMarketOpen : 0,
    high: typeof raw.regularMarketDayHigh === "number" ? raw.regularMarketDayHigh : 0,
    low: typeof raw.regularMarketDayLow === "number" ? raw.regularMarketDayLow : 0,
    close: typeof raw.regularMarketClose === "number" ? raw.regularMarketClose : 0,
    previousClose: previousClose ?? 0,
    volume: typeof raw.regularMarketVolume === "number" ? raw.regularMarketVolume : 0,
    marketCap: typeof raw.marketCap === "number" ? raw.marketCap : null,
    pe: typeof raw.trailingPE === "number" ? raw.trailingPE : null,
    eps: typeof raw.epsTrailingTwelveMonths === "number" ? raw.epsTrailingTwelveMonths : null,
    week52High: typeof raw.fiftyTwoWeekHigh === "number" ? raw.fiftyTwoWeekHigh : null,
    week52Low: typeof raw.fiftyTwoWeekLow === "number" ? raw.fiftyTwoWeekLow : null,
    dayHigh: typeof raw.regularMarketDayHigh === "number" ? raw.regularMarketDayHigh : 0,
    dayLow: typeof raw.regularMarketDayLow === "number" ? raw.regularMarketDayLow : 0,
  };
}

export function parseYahooHistory(raw: Record<string, unknown>): MarketHistoryPoint[] {
  const timestamps = raw.timestamp as number[] | undefined;
  const indicators = raw.indicators as Record<string, unknown> | undefined;
  const quotes = indicators?.quote as Record<string, unknown>[] | undefined;

  if (!timestamps || !quotes || !quotes[0]) return [];

  const quotesData = quotes[0] as Record<string, number[]>;
  const opens = quotesData.open ?? [];
  const highs = quotesData.high ?? [];
  const lows = quotesData.low ?? [];
  const closes = quotesData.close ?? [];
  const volumes = quotesData.volume ?? [];

  const result: MarketHistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] !== null && closes[i] !== undefined) {
      result.push({
        date: new Date(timestamps[i] * 1000).toISOString(),
        open: opens[i] ?? 0,
        high: highs[i] ?? 0,
        low: lows[i] ?? 0,
        close: closes[i] ?? 0,
        volume: volumes[i] ?? 0,
        adjustedClose: closes[i] ?? 0,
      });
    }
  }
  return result;
}

export function parseYahooSearch(raw: Record<string, unknown>): SearchResult[] {
  const results = raw.quotes as Record<string, unknown>[] | undefined;
  if (!results) return [];

  return results
    .filter((r) => r.symbol && r.shortname)
    .map((r) => ({
      symbol: String(r.symbol),
      name: String(r.shortname ?? r.longname ?? ""),
      assetType: detectAssetType(String(r.symbol)),
      exchange: r.exchange ? String(r.exchange) : null,
      currency: r.currency ? String(r.currency) : "INR",
    }));
}

export function generateMockHistory(
  basePrice: number,
  days: number,
): MarketHistoryPoint[] {
  const data: MarketHistoryPoint[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));

    const volatility = 0.02;
    const change = currentPrice * volatility * (Math.random() - 0.5);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(5_000_000 + Math.random() * 15_000_000);

    data.push({
      date: date.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      adjustedClose: Number(close.toFixed(2)),
    });

    currentPrice = close;
  }

  return data;
}
