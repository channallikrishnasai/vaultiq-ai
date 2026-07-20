export interface FormattedResponse {
  sections: ResponseSection[];
  followUpSuggestions: string[];
  sources: string[];
}

export interface ResponseSection {
  type: "summary" | "market" | "financial" | "portfolio" | "recommendation" | "risk" | "action" | "watchlist" | "alert";
  title: string;
  icon: string;
  content: string;
}

export const responseFormatter = {
  formatMarketCard(data: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    pe: number | null;
    marketCap: number | null;
    sector?: string;
  }): string {
    const changeIcon = data.changePercent >= 0 ? "📈" : "📉";
    const changeColor = data.changePercent >= 0 ? "+" : "";
    const marketCapStr = data.marketCap
      ? data.marketCap >= 100000000000
        ? `₹${(data.marketCap / 100000000000).toFixed(0)}L Cr`
        : `₹${(data.marketCap / 10000000000).toFixed(1)}K Cr`
      : "N/A";

    return [
      `**${data.symbol}** — ${data.name}`,
      `${changeIcon} ₹${data.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${changeColor}${data.changePercent.toFixed(2)}%)`,
      data.sector ? `Sector: ${data.sector}` : null,
      `P/E: ${data.pe?.toFixed(1) ?? "N/A"} | MCap: ${marketCapStr}`,
    ]
      .filter(Boolean)
      .join("\n");
  },

  formatWatchlistSummary(watchlist: {
    items: { symbol: string; companyName: string | null; isFavorite: boolean }[];
    topGainer: { symbol: string; changePercent: number } | null;
    topLoser: { symbol: string; changePercent: number } | null;
  }): string {
    if (watchlist.items.length === 0) {
      return "Your watchlist is empty. Add stocks to track them.";
    }

    const lines = [
      `**Your Watchlist** (${watchlist.items.length} stocks)`,
      "",
    ];

    if (watchlist.topGainer) {
      lines.push(`🏆 Top Gainer: ${watchlist.topGainer.symbol} (+${watchlist.topGainer.changePercent.toFixed(2)}%)`);
    }
    if (watchlist.topLoser) {
      lines.push(`📉 Top Loser: ${watchlist.topLoser.symbol} (${watchlist.topLoser.changePercent.toFixed(2)}%)`);
    }

    return lines.join("\n");
  },

  formatAlertSummary(alerts: { symbol: string; type: string; threshold: number; status: string }[]): string {
    if (alerts.length === 0) {
      return "No active alerts. Create alerts to track price movements.";
    }

    const active = alerts.filter((a) => a.status === "ACTIVE");
    const triggered = alerts.filter((a) => a.status === "TRIGGERED");

    const lines = [
      `**Your Alerts**`,
      "",
      `Active: ${active.length} | Triggered: ${triggered.length}`,
      "",
    ];

    active.slice(0, 5).forEach((alert) => {
      const typeLabel = alert.type.replace(/_/g, " ").toLowerCase();
      lines.push(`• ${alert.symbol}: ${typeLabel} @ ${alert.threshold}`);
    });

    return lines.join("\n");
  },

  getFollowUpSuggestions(context: {
    hasWatchlist: boolean;
    hasAlerts: boolean;
    hasPortfolio: boolean;
    hasGoals: boolean;
    lastQuery?: string;
  }): string[] {
    const suggestions: string[] = [];

    if (context.hasWatchlist) {
      suggestions.push("Show my watchlist performance");
      suggestions.push("Best stock in my watchlist");
    }

    if (context.hasAlerts) {
      suggestions.push("Check my alerts");
    }

    if (context.hasPortfolio) {
      suggestions.push("Analyze my portfolio");
      suggestions.push("Show portfolio risk");
    }

    if (context.hasGoals) {
      suggestions.push("Goal progress update");
    }

    suggestions.push("Market sentiment today");
    suggestions.push("Compare stocks");

    return suggestions.slice(0, 6);
  },

  formatFollowUpSuggestions(suggestions: string[]): string {
    if (suggestions.length === 0) return "";

    return [
      "---",
      "**Quick Actions:**",
      ...suggestions.map((s) => `• ${s}`),
    ].join("\n");
  },

  formatStructuredResponse(sections: ResponseSection[]): string {
    return sections
      .map((section) => {
        const lines = [`${section.icon} **${section.title}**`, "", section.content];
        return lines.join("\n");
      })
      .join("\n\n");
  },
};
