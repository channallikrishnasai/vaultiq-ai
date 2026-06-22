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
        cashBalance: cashBalance ?? 100000,
        totalValue: cashBalance ?? 100000,
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
      orderBy: { createdAt: "desc" },
    });
  },

  addToWatchlist(userId: string, data: { symbol: string; companyName?: string; targetPrice?: number; notes?: string }) {
    return prisma.watchlist.create({ data: { userId, ...data } });
  },

  removeFromWatchlist(id: string, userId: string) {
    return prisma.watchlist.deleteMany({ where: { id, userId } });
  },
};
