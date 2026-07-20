import { z } from "zod";
import { TradeType, AlertType } from "@/generated/prisma/enums";

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
  sector: z.string().optional(),
  targetPrice: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateWatchlistSchema = z.object({
  targetPrice: z.number().positive().optional(),
  notes: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

export const createAlertSchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  companyName: z.string().optional(),
  type: z.nativeEnum(AlertType),
  threshold: z.number().positive(),
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type ExecuteTradeInput = z.infer<typeof executeTradeSchema>;
export type WatchlistItemInput = z.infer<typeof watchlistItemSchema>;
export type UpdateWatchlistInput = z.infer<typeof updateWatchlistSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
