import type { RiskMetrics, Holding, AllocationBreakdown } from "./portfolio-types";
import type { RiskAppetite } from "@/generated/prisma/enums";

export const portfolioRiskService = {
  calculateRiskMetrics(
    holdings: Holding[],
    riskAppetite: RiskAppetite,
  ): RiskMetrics {
    const diversificationScore = this.calculateDiversificationScore(holdings);
    const concentrationScore = this.calculateConcentrationScore(holdings);
    const portfolioRiskScore = this.calculatePortfolioRiskScore(holdings);
    const volatility = this.calculateVolatility(holdings);
    const beta = this.calculateBeta(holdings);
    const riskAlignment = this.calculateRiskAlignment(portfolioRiskScore, riskAppetite);
    const topHoldingsConcentration = this.calculateTopNConcentration(holdings, 3);
    const sectorConcentration = this.calculateSectorConcentration(holdings);
    const largestPositionPercent = holdings.length > 0 ? holdings[0].weight : 0;

    return {
      diversificationScore: Number(diversificationScore.toFixed(2)),
      concentrationScore: Number(concentrationScore.toFixed(2)),
      portfolioRiskScore: Number(portfolioRiskScore.toFixed(2)),
      volatility: Number(volatility.toFixed(2)),
      beta,
      riskAlignment,
      topHoldingsConcentration: Number(topHoldingsConcentration.toFixed(2)),
      sectorConcentration: Number(sectorConcentration.toFixed(2)),
      largestPositionPercent: Number(largestPositionPercent.toFixed(2)),
    };
  },

  calculateDiversificationScore(holdings: Holding[]): number {
    if (holdings.length === 0) return 0;
    if (holdings.length === 1) return 20;

    const assetTypes = new Set(holdings.map((h) => h.assetType));
    const sectors = new Set(holdings.map((h) => h.sector ?? "Other"));
    const countScore = Math.min(holdings.length * 10, 40);
    const typeScore = Math.min(assetTypes.size * 10, 30);
    const sectorScore = Math.min(sectors.size * 10, 30);

    return Math.min(countScore + typeScore + sectorScore, 100);
  },

  calculateConcentrationScore(holdings: Holding[]): number {
    if (holdings.length === 0) return 0;

    const weights = holdings.map((h) => h.weight / 100);
    const herfindahl = weights.reduce((s, w) => s + w * w, 0);

    return Math.min(herfindahl * 100, 100);
  },

  calculatePortfolioRiskScore(holdings: Holding[]): number {
    if (holdings.length === 0) return 50;

    let riskSum = 0;
    for (const holding of holdings) {
      let riskWeight = 50;
      switch (holding.assetType) {
        case "stock_nse":
        case "stock_bse":
          riskWeight = 60;
          break;
        case "etf":
          riskWeight = 40;
          break;
        case "mutual_fund":
          riskWeight = 35;
          break;
        case "gold":
        case "silver":
          riskWeight = 25;
          break;
        case "bond":
          riskWeight = 20;
          break;
        case "index":
          riskWeight = 50;
          break;
        case "crypto":
          riskWeight = 90;
          break;
        case "cash":
          riskWeight = 5;
          break;
        default:
          riskWeight = 50;
      }
      riskSum += riskWeight * (holding.weight / 100);
    }

    return Math.min(Math.max(riskSum, 0), 100);
  },

  calculateVolatility(holdings: Holding[]): number {
    if (holdings.length === 0) return 0;

    let weightedVolatility = 0;
    for (const holding of holdings) {
      const weight = holding.weight / 100;
      let estimatedVolatility = 20;

      if (holding.assetType === "gold" || holding.assetType === "silver") {
        estimatedVolatility = 15;
      } else if (holding.assetType === "bond") {
        estimatedVolatility = 5;
      } else if (holding.assetType === "etf") {
        estimatedVolatility = 18;
      } else if (holding.assetType === "crypto") {
        estimatedVolatility = 80;
      } else if (holding.assetType === "index") {
        estimatedVolatility = 16;
      }

      if (Math.abs(holding.dayChangePercent) > 3) {
        estimatedVolatility *= 1.5;
      }

      weightedVolatility += estimatedVolatility * weight;
    }

    return weightedVolatility;
  },

  calculateBeta(holdings: Holding[]): number | null {
    if (holdings.length === 0) return null;

    let weightedBeta = 0;
    let hasBeta = false;

    for (const holding of holdings) {
      const weight = holding.weight / 100;
      let estimatedBeta = 1.0;

      if (holding.assetType === "gold") estimatedBeta = 0.3;
      else if (holding.assetType === "silver") estimatedBeta = 0.5;
      else if (holding.assetType === "bond") estimatedBeta = 0.1;
      else if (holding.assetType === "etf") estimatedBeta = 0.9;
      else if (holding.assetType === "index") estimatedBeta = 1.0;
      else if (holding.assetType === "crypto") estimatedBeta = 2.5;

      weightedBeta += estimatedBeta * weight;
      hasBeta = true;
    }

    return hasBeta ? Number(weightedBeta.toFixed(2)) : null;
  },

  calculateRiskAlignment(
    portfolioRiskScore: number,
    riskAppetite: RiskAppetite,
  ): "aligned" | "conservative" | "aggressive" {
    const appetiteMap: Record<RiskAppetite, number> = {
      VERY_CONSERVATIVE: 20,
      CONSERVATIVE: 35,
      MODERATE: 50,
      GROWTH: 65,
      AGGRESSIVE: 80,
    };

    const targetRisk = appetiteMap[riskAppetite] ?? 50;
    const diff = portfolioRiskScore - targetRisk;

    if (diff > 15) return "aggressive";
    if (diff < -15) return "conservative";
    return "aligned";
  },

  calculateTopNConcentration(holdings: Holding[], n: number): number {
    return holdings.slice(0, n).reduce((s, h) => s + h.weight, 0);
  },

  calculateSectorConcentration(holdings: Holding[]): number {
    const sectorWeights = new Map<string, number>();
    for (const holding of holdings) {
      const sector = holding.sector ?? "Other";
      sectorWeights.set(sector, (sectorWeights.get(sector) ?? 0) + holding.weight);
    }

    const maxSectorWeight = Math.max(...Array.from(sectorWeights.values()), 0);
    return maxSectorWeight;
  },

  getDiversificationLevel(score: number): "excellent" | "good" | "fair" | "poor" {
    if (score >= 75) return "excellent";
    if (score >= 50) return "good";
    if (score >= 25) return "fair";
    return "poor";
  },

  generateDiversificationSuggestions(
    holdings: Holding[],
    allocation: AllocationBreakdown[],
  ): string[] {
    const suggestions: string[] = [];

    if (holdings.length < 5) {
      suggestions.push("Consider adding more holdings to improve diversification.");
    }

    const assetTypes = new Set(holdings.map((h) => h.assetType));
    if (assetTypes.size < 3) {
      suggestions.push("Diversify across different asset classes (stocks, ETFs, gold, bonds).");
    }

    const sectors = new Set(holdings.map((h) => h.sector ?? "Other"));
    if (sectors.size < 3) {
      suggestions.push("Spread investments across multiple sectors.");
    }

    if (holdings.length > 0 && holdings[0].weight > 30) {
      suggestions.push(`Your largest position (${holdings[0].symbol}) is ${holdings[0].weight.toFixed(1)}% of portfolio. Consider reducing concentration.`);
    }

    const hasDebt = holdings.some((h) => h.assetType === "bond");
    if (!hasDebt && holdings.length > 0) {
      suggestions.push("Consider adding bonds for stability and risk reduction.");
    }

    const hasGold = holdings.some((h) => h.assetType === "gold" || h.assetType === "silver");
    if (!hasGold) {
      suggestions.push("Consider adding gold/silver for inflation hedging.");
    }

    return suggestions;
  },
};
