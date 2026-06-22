import { z } from "zod";
import { TradeType } from "@/generated/prisma/enums";

export const executeTradeSchema = z.object({
  portfolioId: z.string().optional(),
  symbol: z.string().min(1).max(20),
  type: z.nativeEnum(TradeType),
  quantity: z.number().positive(),
  price: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cashBalance: z.number().min(0).optional(),
});

export const addWatchlistSchema = z.object({
  symbol: z.string().min(1).max(20),
  companyName: z.string().max(200).optional(),
  targetPrice: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});
