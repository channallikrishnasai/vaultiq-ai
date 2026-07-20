import { prisma } from "@/lib/prisma";
import { marketService } from "./market.service";
import { notificationService } from "../notification/notification.service";
import { logger } from "@/lib/logger";
import type { AlertType, AlertStatus } from "@/generated/prisma/enums";

const TAG = "AlertService";

export interface AlertWithQuote {
  id: string;
  symbol: string;
  companyName: string | null;
  type: AlertType;
  threshold: number;
  status: AlertStatus;
  triggeredAt: Date | null;
  message: string | null;
  createdAt: Date;
  currentPrice: number | null;
  changePercent: number | null;
}

export interface AlertCheckResult {
  triggered: AlertWithQuote[];
  remaining: AlertWithQuote[];
}

export const alertService = {
  async getAlerts(userId: string): Promise<AlertWithQuote[]> {
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    if (alerts.length === 0) return [];

    const symbols = [...new Set(alerts.map((a) => a.symbol))];
    let quotes: { symbol: string; price: number; changePercent: number }[] = [];

    try {
      const marketQuotes = await marketService.getQuotes(symbols);
      quotes = marketQuotes.map((q) => ({
        symbol: q.symbol,
        price: q.price,
        changePercent: q.changePercent,
      }));
    } catch (error) {
      logger.error(TAG, "Failed to fetch quotes for alerts", error);
    }

    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    return alerts.map((alert) => {
      const quote = quoteMap.get(alert.symbol);
      return {
        id: alert.id,
        symbol: alert.symbol,
        companyName: alert.companyName,
        type: alert.type,
        threshold: alert.threshold,
        status: alert.status,
        triggeredAt: alert.triggeredAt,
        message: alert.message,
        createdAt: alert.createdAt,
        currentPrice: quote?.price ?? null,
        changePercent: quote?.changePercent ?? null,
      };
    });
  },

  async getActiveAlerts(userId: string): Promise<AlertWithQuote[]> {
    const alerts = await prisma.alert.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (alerts.length === 0) return [];

    const symbols = [...new Set(alerts.map((a) => a.symbol))];
    let quotes: { symbol: string; price: number; changePercent: number }[] = [];

    try {
      const marketQuotes = await marketService.getQuotes(symbols);
      quotes = marketQuotes.map((q) => ({
        symbol: q.symbol,
        price: q.price,
        changePercent: q.changePercent,
      }));
    } catch (error) {
      logger.error(TAG, "Failed to fetch quotes for active alerts", error);
    }

    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    return alerts.map((alert) => {
      const quote = quoteMap.get(alert.symbol);
      return {
        id: alert.id,
        symbol: alert.symbol,
        companyName: alert.companyName,
        type: alert.type,
        threshold: alert.threshold,
        status: alert.status,
        triggeredAt: alert.triggeredAt,
        message: alert.message,
        createdAt: alert.createdAt,
        currentPrice: quote?.price ?? null,
        changePercent: quote?.changePercent ?? null,
      };
    });
  },

  async createAlert(
    userId: string,
    data: {
      symbol: string;
      companyName?: string;
      type: AlertType;
      threshold: number;
    },
  ): Promise<AlertWithQuote> {
    let companyName = data.companyName;

    if (!companyName) {
      try {
        const quote = await marketService.getQuote(data.symbol);
        companyName = quote.name;
      } catch {
        logger.error(TAG, `Failed to fetch quote for ${data.symbol}`);
      }
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        symbol: data.symbol.toUpperCase(),
        companyName,
        type: data.type,
        threshold: data.threshold,
      },
    });

    let quote: { price: number; changePercent: number } | null = null;
    try {
      const marketQuote = await marketService.getQuote(alert.symbol);
      quote = { price: marketQuote.price, changePercent: marketQuote.changePercent };
    } catch {
      logger.error(TAG, `Failed to fetch quote for ${alert.symbol}`);
    }

    return {
      id: alert.id,
      symbol: alert.symbol,
      companyName: alert.companyName,
      type: alert.type,
      threshold: alert.threshold,
      status: alert.status,
      triggeredAt: alert.triggeredAt,
      message: alert.message,
      createdAt: alert.createdAt,
      currentPrice: quote?.price ?? null,
      changePercent: quote?.changePercent ?? null,
    };
  },

  async deleteAlert(id: string, userId: string): Promise<boolean> {
    const result = await prisma.alert.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  },

  async checkAlerts(userId: string): Promise<AlertCheckResult> {
    const activeAlerts = await prisma.alert.findMany({
      where: { userId, status: "ACTIVE" },
    });

    if (activeAlerts.length === 0) {
      return { triggered: [], remaining: [] };
    }

    const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];
    let quotes: { symbol: string; price: number; changePercent: number; week52High: number | null; week52Low: number | null }[] = [];

    try {
      const marketQuotes = await marketService.getQuotes(symbols);
      quotes = marketQuotes.map((q) => ({
        symbol: q.symbol,
        price: q.price,
        changePercent: q.changePercent,
        week52High: q.week52High,
        week52Low: q.week52Low,
      }));
    } catch (error) {
      logger.error(TAG, "Failed to fetch quotes for alert check", error);
      return { triggered: [], remaining: [] };
    }

    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
    const triggered: AlertWithQuote[] = [];
    const remaining: AlertWithQuote[] = [];

    for (const alert of activeAlerts) {
      const quote = quoteMap.get(alert.symbol);
      if (!quote) {
        remaining.push({
          id: alert.id,
          symbol: alert.symbol,
          companyName: alert.companyName,
          type: alert.type,
          threshold: alert.threshold,
          status: alert.status,
          triggeredAt: alert.triggeredAt,
          message: alert.message,
          createdAt: alert.createdAt,
          currentPrice: null,
          changePercent: null,
        });
        continue;
      }

      let shouldTrigger = false;
      let message = "";

      switch (alert.type) {
        case "PRICE_ABOVE":
          if (quote.price >= alert.threshold) {
            shouldTrigger = true;
            message = `${alert.symbol} crossed above ₹${alert.threshold.toFixed(2)}. Current: ₹${quote.price.toFixed(2)}`;
          }
          break;
        case "PRICE_BELOW":
          if (quote.price <= alert.threshold) {
            shouldTrigger = true;
            message = `${alert.symbol} dropped below ₹${alert.threshold.toFixed(2)}. Current: ₹${quote.price.toFixed(2)}`;
          }
          break;
        case "PERCENT_CHANGE":
          if (Math.abs(quote.changePercent) >= alert.threshold) {
            shouldTrigger = true;
            message = `${alert.symbol} moved ${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}% (threshold: ${alert.threshold}%)`;
          }
          break;
        case "NEW_52W_HIGH":
          if (quote.week52High && quote.price >= quote.week52High) {
            shouldTrigger = true;
            message = `${alert.symbol} hit 52-week high of ₹${quote.price.toFixed(2)}`;
          }
          break;
        case "NEW_52W_LOW":
          if (quote.week52Low && quote.price <= quote.week52Low) {
            shouldTrigger = true;
            message = `${alert.symbol} hit 52-week low of ₹${quote.price.toFixed(2)}`;
          }
          break;
        case "VOLUME_SPIKE":
          // Volume spike detection would need historical volume data
          break;
      }

      if (shouldTrigger) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: "TRIGGERED",
            triggeredAt: new Date(),
            message,
          },
        });

        await notificationService.createNotification(userId, {
          type: "ALERT_TRIGGERED",
          title: `Alert: ${alert.symbol}`,
          message,
          data: { alertId: alert.id, symbol: alert.symbol, type: alert.type },
        });

        triggered.push({
          id: alert.id,
          symbol: alert.symbol,
          companyName: alert.companyName,
          type: alert.type,
          threshold: alert.threshold,
          status: "TRIGGERED",
          triggeredAt: new Date(),
          message,
          createdAt: alert.createdAt,
          currentPrice: quote.price,
          changePercent: quote.changePercent,
        });
      } else {
        remaining.push({
          id: alert.id,
          symbol: alert.symbol,
          companyName: alert.companyName,
          type: alert.type,
          threshold: alert.threshold,
          status: alert.status,
          triggeredAt: alert.triggeredAt,
          message: alert.message,
          createdAt: alert.createdAt,
          currentPrice: quote.price,
          changePercent: quote.changePercent,
        });
      }
    }

    return { triggered, remaining };
  },

  async dismissAlert(id: string, userId: string): Promise<boolean> {
    const result = await prisma.alert.updateMany({
      where: { id, userId, status: "TRIGGERED" },
      data: { status: "DISMISSED" },
    });
    return result.count > 0;
  },
};
