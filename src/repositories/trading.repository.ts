import { prisma } from "@/lib/prisma";
import type { TradeType } from "@/generated/prisma/enums";

export const tradingRepository = {
  getPortfolios(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId },
      include: { trades: { orderBy: { executedAt: "desc" }, take: 10 } },
    });
  },

  getPortfolio(id: string, userId: string) {
    return prisma.portfolio.findFirst({
      where: { id, userId },
      include: { trades: { orderBy: { executedAt: "desc" } } },
    });
  },

  createPortfolio(userId: string, name?: string, cashBalance?: number) {
    return prisma.portfolio.create({
      data: {
        userId,
        name: name ?? "Main Portfolio",
        cashBalance: cashBalance ?? 0,
        totalValue: cashBalance ?? 0,
      },
    });
  },

  executeTrade(data: {
    portfolioId: string;
    symbol: string;
    type: TradeType;
    quantity: number;
    price: number;
    notes?: string;
  }) {
    const totalAmount = data.quantity * data.price;
    return prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.findUniqueOrThrow({
        where: { id: data.portfolioId },
      });

      let cashBalance = portfolio.cashBalance;
      if (data.type === "BUY") {
        if (cashBalance < totalAmount) throw new Error("Insufficient funds");
        cashBalance -= totalAmount;
      } else {
        cashBalance += totalAmount;
      }

      const trade = await tx.trade.create({
        data: { ...data, totalAmount },
      });

      await tx.portfolio.update({
        where: { id: data.portfolioId },
        data: { cashBalance, totalValue: cashBalance },
      });

      return trade;
    });
  },

  getWatchlist(userId: string) {
    return prisma.watchlist.findMany({
      where: { userId },
      orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    });
  },

  addToWatchlist(userId: string, data: { symbol: string; companyName?: string; sector?: string; targetPrice?: number; notes?: string }) {
    return prisma.watchlist.create({ data: { userId, ...data } });
  },

  removeFromWatchlist(id: string, userId: string) {
    return prisma.watchlist.deleteMany({ where: { id, userId } });
  },

  async toggleFavorite(id: string, userId: string) {
    const item = await prisma.watchlist.findFirst({
      where: { id, userId },
      select: { isFavorite: true },
    });
    if (!item) return { count: 0 };
    return prisma.watchlist.updateMany({
      where: { id, userId },
      data: { isFavorite: !item.isFavorite },
    });
  },

  getAlerts(userId: string) {
    return prisma.alert.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  },

  getActiveAlerts(userId: string) {
    return prisma.alert.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  },

  createAlert(userId: string, data: { symbol: string; companyName?: string; type: string; threshold: number }) {
    return prisma.alert.create({
      data: { userId, ...data, type: data.type as "PRICE_ABOVE" | "PRICE_BELOW" | "PERCENT_CHANGE" | "VOLUME_SPIKE" | "NEW_52W_HIGH" | "NEW_52W_LOW" },
    });
  },

  deleteAlert(id: string, userId: string) {
    return prisma.alert.deleteMany({ where: { id, userId } });
  },

  getNotifications(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  getUnreadNotificationCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },
};
