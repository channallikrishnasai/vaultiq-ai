import { z } from "zod";
import { TradeType } from "@/generated/prisma/enums";

export const createPortfolioSchema = z.object({
  name: z.string().min(1).optional(),
  cashBalance: z.number().min(0).optional(),
});

export const executeTradeSchema = z.object({
  portfolioId: z.string().min(1),
  symbol: z.string().min(1).toUpperCase(),
  type: z.nativeEnum(TradeType),
  quantity: z.number().positive(),
  price: z.number().positive(),
  notes: z.string().optional(),
});

export const watchlistItemSchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  companyName: z.string().optional(),
  targetPrice: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type ExecuteTradeInput = z.infer<typeof executeTradeSchema>;
export type WatchlistItemInput = z.infer<typeof watchlistItemSchema>;
