import { requireAuth } from "@/lib/auth";
import { marketService } from "@/services/market/market.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

const POPULAR_SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
  "WIPRO", "BHARTIARTL", "SBIN", "HINDUNILVR", "ITC",
  "KOTAKBANK", "LT", "AXISBANK", "BAJFINANCE", "MARUTI",
  "SUNPHARMA", "TATAMOTORS", "ULTRACEMCO", "NESTLEIND", "TECHM",
];

export async function GET() {
  try {
    const session = await requireAuth();

    const quotes = await marketService.getQuotes(POPULAR_SYMBOLS);

    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);

    const topGainers = sorted.slice(0, 5).map((q) => ({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      volume: q.volume,
      marketCap: q.marketCap,
    }));

    const topLosers = sorted.slice(-5).reverse().map((q) => ({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      volume: q.volume,
      marketCap: q.marketCap,
    }));

    const mostActive = [...quotes]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map((q) => ({
        symbol: q.symbol,
        name: q.name,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        volume: q.volume,
        marketCap: q.marketCap,
      }));

    const newHighs = quotes
      .filter((q) => q.week52High && q.price >= q.week52High * 0.98)
      .map((q) => ({
        symbol: q.symbol,
        name: q.name,
        price: q.price,
        week52High: q.week52High,
        change: q.change,
        changePercent: q.changePercent,
      }));

    const newLows = quotes
      .filter((q) => q.week52Low && q.price <= q.week52Low * 1.02)
      .map((q) => ({
        symbol: q.symbol,
        name: q.name,
        price: q.price,
        week52Low: q.week52Low,
        change: q.change,
        changePercent: q.changePercent,
      }));

    return successResponse({
      topGainers,
      topLosers,
      mostActive,
      newHighs,
      newLows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
