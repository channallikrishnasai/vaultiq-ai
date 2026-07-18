import { marketService } from "@/services/market/market.service";
import { marketCacheService } from "@/services/market/market-cache.service";
import type { MarketQuote, MarketHistory, SearchResult } from "@/services/market/market-types";
import { logger } from "@/lib/logger";

const TAG = "MarketContext";

const SYMBOL_PATTERNS: Record<string, string> = {
  RELIANCE: "RELIANCE",
  "RELIANCE INDUSTRIES": "RELIANCE",
  TCS: "TCS",
  "TATA CONSULTANCY": "TCS",
  INFY: "INFY",
  INFOSYS: "INFYS",
  HDFCBANK: "HDFCBANK",
  "HDFC BANK": "HDFCBANK",
  ICICIBANK: "ICICIBANK",
  "ICICI BANK": "ICICIBANK",
  WIPRO: "WIPRO",
  BHARTIARTL: "BHARTIARTL",
  "BHARTI AIRTEL": "BHARTIARTL",
  SBIN: "SBIN",
  "STATE BANK": "SBIN",
  "SBI": "SBIN",
};

const INDEX_PATTERNS: Record<string, string> = {
  NIFTY: "^NSEI",
  "NIFTY 50": "^NSEI",
  NIFTY50: "^NSEI",
  SENSEX: "^BSESN",
  "BANK NIFTY": "^NSEBANK",
  BANKNIFTY: "^NSEBANK",
};

const COMMODITY_PATTERNS: Record<string, string> = {
  GOLD: "GOLD",
  "GOLD PRICE": "GOLD",
  "GOLD RATE": "GOLD",
  SILVER: "SILVER",
  "SILVER PRICE": "SILVER",
  "SILVER RATE": "SILVER",
};

const ETF_PATTERNS: Record<string, string> = {
  NIFTYBEES: "NIFTYBEES",
  GOLDBEES: "GOLDBEES",
  "GOLD ETF": "GOLDBEES",
  "NIFTY ETF": "NIFTYBEES",
};

const MARKET_KEYWORDS = [
  "stock", "share", "price", "market", "invest", "portfolio",
  "nifty", "sensex", "bank nifty", "bull", "bear", "rally",
  "ipo", "dividend", "split", "bonus", "etag", "high", "low",
  "buy", "sell", "hold", "target", "support", "resistance",
  "mutual fund", "sip", "etf", "gold", "silver",
  "trend", "chart", "volume", "cap", "pe ratio",
];

export interface MarketContextData {
  intentDetected: boolean;
  symbols: string[];
  queries: string[];
  quotes: MarketQuote[];
  histories: MarketHistory[];
  searchResults: SearchResult[];
  dataSource: "live" | "cached" | "mock";
  timestamp: string;
}

function extractSymbolsFromMessage(message: string): string[] {
  const found: string[] = [];

  for (const [pattern, symbol] of Object.entries(SYMBOL_PATTERNS)) {
    if (message.toUpperCase().includes(pattern)) {
      found.push(symbol);
    }
  }

  for (const [pattern, symbol] of Object.entries(INDEX_PATTERNS)) {
    if (message.toUpperCase().includes(pattern)) {
      found.push(symbol);
    }
  }

  for (const [pattern, symbol] of Object.entries(COMMODITY_PATTERNS)) {
    if (message.toUpperCase().includes(pattern)) {
      found.push(symbol);
    }
  }

  for (const [pattern, symbol] of Object.entries(ETF_PATTERNS)) {
    if (message.toUpperCase().includes(pattern)) {
      found.push(symbol);
    }
  }

  const words = message.split(/\s+/);
  for (const word of words) {
    const cleaned = word.replace(/[^A-Z0-9.^]/g, "");
    if (cleaned.length >= 3 && cleaned.length <= 20 && /^[A-Z0-9.^]+$/.test(cleaned)) {
      const isAlreadyUppercase = word === word.toUpperCase() && word !== word.toLowerCase();
      if (isAlreadyUppercase && !found.includes(cleaned)) {
        found.push(cleaned);
      }
    }
  }

  return [...new Set(found)];
}

function hasMarketIntent(message: string): boolean {
  const lower = message.toLowerCase();

  for (const keyword of MARKET_KEYWORDS) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  const symbols = extractSymbolsFromMessage(message);
  if (symbols.length > 0) return true;

  if (/[A-Z]{2,10}(?:\.[A-Z]{2})?/.test(message)) return true;

  return false;
}

function detectDataSource(quotes: MarketQuote[]): "live" | "cached" | "mock" {
  if (quotes.length === 0) return "mock";
  const providers = quotes.map((q) => q.provider);
  if (providers.every((p) => p === "mock")) return "mock";
  if (providers.some((p) => p === "yahoo")) return "live";
  return "cached";
}

async function fetchMarketData(
  symbols: string[],
  queries: string[],
): Promise<MarketContextData> {
  const quotes: MarketQuote[] = [];
  const histories: MarketHistory[] = [];
  const searchResults: SearchResult[] = [];
  const errors: string[] = [];

  if (symbols.length > 0) {
    const uniqueSymbols = [...new Set(symbols)];

    try {
      const batchResponse = await marketService.getBatchQuotes({ symbols: uniqueSymbols });
      quotes.push(...batchResponse.quotes);
      for (const err of batchResponse.errors) {
        errors.push(`${err.symbol}: ${err.message}`);
      }
    } catch (error) {
      logger.error(TAG, "Batch quote fetch failed", error);
      for (const symbol of uniqueSymbols) {
        try {
          const quote = await marketService.getQuote(symbol);
          quotes.push(quote);
        } catch (e) {
          errors.push(`${symbol}: ${e instanceof Error ? e.message : "Unknown error"}`);
        }
      }
    }

    for (const symbol of uniqueSymbols.slice(0, 3)) {
      try {
        const history = await marketService.getHistory(symbol, "1mo");
        histories.push(history);
      } catch {
        // History is optional, don't fail
      }
    }
  }

  for (const query of queries.slice(0, 2)) {
    try {
      const results = await marketService.search(query);
      searchResults.push(...results.slice(0, 5));
    } catch {
      // Search is optional
    }
  }

  if (errors.length > 0) {
    logger.warn(TAG, `Market data fetch errors: ${errors.join("; ")}`);
  }

  return {
    intentDetected: true,
    symbols,
    queries,
    quotes,
    histories,
    searchResults,
    dataSource: detectDataSource(quotes),
    timestamp: new Date().toISOString(),
  };
}

function formatMarketContext(data: MarketContextData): string {
  if (!data.intentDetected || (data.quotes.length === 0 && data.searchResults.length === 0)) {
    return "";
  }

  const lines: string[] = [];
  lines.push("=== LIVE MARKET DATA ===");
  lines.push(`Data Source: ${data.dataSource === "live" ? "Live (Yahoo Finance)" : data.dataSource === "cached" ? "Cached" : "Mock/Simulated"}`);
  lines.push(`Timestamp: ${data.timestamp}`);
  lines.push("");

  if (data.quotes.length > 0) {
    lines.push("QUOTES:");
    for (const quote of data.quotes) {
      const changeSign = quote.change >= 0 ? "+" : "";
      const changePctSign = quote.changePercent >= 0 ? "+" : "";
      lines.push(`  ${quote.symbol} (${quote.name})`);
      lines.push(`    Price: ₹${quote.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      lines.push(`    Change: ${changeSign}₹${quote.change.toFixed(2)} (${changePctSign}${quote.changePercent.toFixed(2)}%)`);
      lines.push(`    Day Range: ₹${quote.dayLow.toFixed(2)} - ₹${quote.dayHigh.toFixed(2)}`);
      lines.push(`    52 Week: ₹${quote.week52Low?.toFixed(2) ?? "N/A"} - ₹${quote.week52High?.toFixed(2) ?? "N/A"}`);
      if (quote.volume > 0) {
        lines.push(`    Volume: ${quote.volume.toLocaleString("en-IN")}`);
      }
      if (quote.marketCap) {
        lines.push(`    Market Cap: ₹${(quote.marketCap / 1_00_00_000).toFixed(0)} Cr`);
      }
      if (quote.pe) {
        lines.push(`    P/E Ratio: ${quote.pe.toFixed(2)}`);
      }
      lines.push(`    Type: ${quote.assetType.replace(/_/g, " ").toUpperCase()}`);
      lines.push("");
    }
  }

  if (data.histories.length > 0) {
    lines.push("RECENT TREND (1 Month):");
    for (const history of data.histories) {
      if (history.data.length > 0) {
        const first = history.data[0];
        const last = history.data[history.data.length - 1];
        const periodChange = last.close - first.close;
        const periodPct = first.close > 0 ? ((last.close - first.close) / first.close) * 100 : 0;
        const trend = periodChange >= 0 ? "UP" : "DOWN";
        lines.push(`  ${history.symbol}: ${trend} ₹${Math.abs(periodChange).toFixed(2)} (${periodPct >= 0 ? "+" : ""}${periodPct.toFixed(2)}%) over ${history.data.length} days`);
        lines.push(`    Start: ₹${first.close.toFixed(2)} → Current: ₹${last.close.toFixed(2)}`);
      }
    }
    lines.push("");
  }

  if (data.searchResults.length > 0 && data.quotes.length === 0) {
    lines.push("SEARCH RESULTS:");
    for (const result of data.searchResults.slice(0, 5)) {
      lines.push(`  ${result.symbol} - ${result.name} (${result.assetType.replace(/_/g, " ").toUpperCase()})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export const marketContextService = {
  detectMarketIntent: hasMarketIntent,

  async buildMarketContext(message: string): Promise<MarketContextData> {
    const intentDetected = hasMarketIntent(message);
    if (!intentDetected) {
      return {
        intentDetected: false,
        symbols: [],
        queries: [],
        quotes: [],
        histories: [],
        searchResults: [],
        dataSource: "mock",
        timestamp: new Date().toISOString(),
      };
    }

    const symbols = extractSymbolsFromMessage(message);
    const queries: string[] = [];

    const lower = message.toLowerCase();
    if (lower.includes("mutual fund") || lower.includes("sip")) {
      const mfMatch = message.match(/(?:about|check|look)\s+(.+?)(?:\s+mutual|\s+sip|$)/i);
      if (mfMatch) queries.push(mfMatch[1].trim());
    }

    if (symbols.length === 0 && queries.length === 0) {
      const words = message.split(/\s+/).filter((w) => w.length >= 3);
      if (words.length > 0) {
        queries.push(words.slice(0, 2).join(" "));
      }
    }

    return fetchMarketData(symbols, queries);
  },

  formatMarketContext,

  getSupportedSymbols(): string[] {
    return [
      ...Object.values(SYMBOL_PATTERNS),
      ...Object.values(INDEX_PATTERNS),
      ...Object.values(COMMODITY_PATTERNS),
      ...Object.values(ETF_PATTERNS),
    ];
  },
};
