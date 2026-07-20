import { prisma } from "@/lib/prisma";
import { marketService } from "./market.service";
import type { MarketQuote } from "./market-types";
import { logger } from "@/lib/logger";

const TAG = "WatchlistService";

export interface WatchlistItemWithQuote {
  id: string;
  symbol: string;
  companyName: string | null;
  sector: string | null;
  isFavorite: boolean;
  targetPrice: number | null;
  notes: string | null;
  createdAt: Date;
  quote: MarketQuote | null;
}

export interface WatchlistSummary {
  items: WatchlistItemWithQuote[];
  totalItems: number;
  favoritesCount: number;
  topGainer: WatchlistItemWithQuote | null;
  topLoser: WatchlistItemWithQuote | null;
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
}

export const watchlistService = {
  async getWatchlist(userId: string): Promise<WatchlistItemWithQuote[]> {
    const items = await prisma.watchlist.findMany({
      where: { userId },
      orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    });

    if (items.length === 0) return [];

    const symbols = items.map((item) => item.symbol);
    let quotes: MarketQuote[] = [];

    try {
      quotes = await marketService.getQuotes(symbols);
    } catch (error) {
      logger.error(TAG, "Failed to fetch quotes for watchlist", error);
    }

    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    return items.map((item) => ({
      id: item.id,
      symbol: item.symbol,
      companyName: item.companyName,
      sector: item.sector,
      isFavorite: item.isFavorite,
      targetPrice: item.targetPrice,
      notes: item.notes,
      createdAt: item.createdAt,
      quote: quoteMap.get(item.symbol) ?? null,
    }));
  },

  async getWatchlistSummary(userId: string): Promise<WatchlistSummary> {
    const items = await this.getWatchlist(userId);
    const itemsWithQuotes = items.filter((i) => i.quote !== null);

    const favoritesCount = items.filter((i) => i.isFavorite).length;

    let topGainer: WatchlistItemWithQuote | null = null;
    let topLoser: WatchlistItemWithQuote | null = null;

    if (itemsWithQuotes.length > 0) {
      const sorted = [...itemsWithQuotes].sort(
        (a, b) => (b.quote?.changePercent ?? 0) - (a.quote?.changePercent ?? 0),
      );
      topGainer = sorted[0];
      topLoser = sorted[sorted.length - 1];
    }

    const totalValue = itemsWithQuotes.reduce(
      (sum, i) => sum + (i.quote?.price ?? 0),
      0,
    );
    const dailyChange = itemsWithQuotes.reduce(
      (sum, i) => sum + (i.quote?.change ?? 0),
      0,
    );
    const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0;

    return {
      items,
      totalItems: items.length,
      favoritesCount,
      topGainer,
      topLoser,
      totalValue,
      dailyChange,
      dailyChangePercent,
    };
  },

  async addToWatchlist(
    userId: string,
    data: { symbol: string; companyName?: string; sector?: string; targetPrice?: number; notes?: string },
  ): Promise<WatchlistItemWithQuote> {
    const existing = await prisma.watchlist.findUnique({
      where: { userId_symbol: { userId, symbol: data.symbol.toUpperCase() } },
    });

    if (existing) {
      throw new Error("Symbol already in watchlist");
    }

    let companyName = data.companyName;
    let sector = data.sector;

    if (!companyName) {
      try {
        const quote = await marketService.getQuote(data.symbol);
        companyName = quote.name;
        sector = undefined;
      } catch {
        logger.error(TAG, `Failed to fetch quote for ${data.symbol}`);
      }
    }

    const item = await prisma.watchlist.create({
      data: {
        userId,
        symbol: data.symbol.toUpperCase(),
        companyName,
        sector,
        targetPrice: data.targetPrice,
        notes: data.notes,
      },
    });

    let quote: MarketQuote | null = null;
    try {
      quote = await marketService.getQuote(item.symbol);
    } catch {
      logger.error(TAG, `Failed to fetch quote for ${item.symbol}`);
    }

    return { ...item, quote };
  },

  async removeFromWatchlist(id: string, userId: string): Promise<boolean> {
    const result = await prisma.watchlist.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  },

  async toggleFavorite(id: string, userId: string): Promise<boolean> {
    const item = await prisma.watchlist.findFirst({
      where: { id, userId },
    });

    if (!item) return false;

    await prisma.watchlist.update({
      where: { id },
      data: { isFavorite: !item.isFavorite },
    });

    return true;
  },

  async updateWatchlistItem(
    id: string,
    userId: string,
    data: { targetPrice?: number; notes?: string; isFavorite?: boolean },
  ): Promise<boolean> {
    const result = await prisma.watchlist.updateMany({
      where: { id, userId },
      data,
    });
    return result.count > 0;
  },

  async getWatchlistSymbols(userId: string): Promise<string[]> {
    const items = await prisma.watchlist.findMany({
      where: { userId },
      select: { symbol: true },
    });
    return items.map((i) => i.symbol);
  },
};
