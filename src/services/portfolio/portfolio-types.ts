import type { AssetType, MarketQuote } from "@/services/market/market-types";
import type { RiskAppetite, TradeType } from "@/generated/prisma/enums";

export interface Holding {
  symbol: string;
  assetType: AssetType;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weight: number;
  sector: string | null;
  exchange: string | null;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  type: TradeType;
  quantity: number;
  price: number;
  totalAmount: number;
  executedAt: Date;
}

export interface PortfolioSummary {
  portfolioId: string;
  portfolioName: string;
  totalCurrentValue: number;
  totalInvested: number;
  cashBalance: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  unrealizedPnL: number;
  realizedPnL: number;
  holdingsCount: number;
  lastUpdated: string;
}

export interface PortfolioCalculation {
  totalCurrentValue: number;
  totalInvested: number;
  cashBalance: number;
  holdingsValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  unrealizedPnL: number;
  realizedPnL: number;
  holdings: Holding[];
  tradeHistory: TradeRecord[];
}

export interface AllocationBreakdown {
  name: string;
  value: number;
  percent: number;
  color?: string;
}

export interface PortfolioAllocation {
  byAssetClass: AllocationBreakdown[];
  bySector: AllocationBreakdown[];
  byMarketCap: AllocationBreakdown[];
  byRisk: AllocationBreakdown[];
  byCurrency: AllocationBreakdown[];
}

export interface RiskMetrics {
  diversificationScore: number;
  concentrationScore: number;
  portfolioRiskScore: number;
  volatility: number;
  beta: number | null;
  riskAlignment: "aligned" | "conservative" | "aggressive";
  topHoldingsConcentration: number;
  sectorConcentration: number;
  largestPositionPercent: number;
}

export interface PerformanceMetrics {
  topGainers: Holding[];
  topLosers: Holding[];
  bestPerforming: Holding | null;
  worstPerforming: Holding | null;
  todayPerformance: {
    gainers: number;
    losers: number;
    unchanged: number;
    totalDayChange: number;
  };
  overallPerformance: {
    totalReturn: number;
    totalReturnPercent: number;
  };
  monthlyPerformance: {
    estimatedMonthlyReturn: number;
    estimatedMonthlyReturnPercent: number;
  };
  yearToDatePerformance: {
    estimatedYTDReturn: number;
    estimatedYTDReturnPercent: number;
  };
}

export interface GoalAlignment {
  goalName: string;
  goalType: string;
  targetAmount: number;
  currentProgress: number;
  portfolioContribution: number;
  percentComplete: number;
  onTrack: boolean;
  monthsToGoal: number | null;
  monthlyNeeded: number | null;
}

export interface PortfolioIntelligence {
  summary: PortfolioSummary;
  riskAnalysis: RiskMetrics;
  diversification: {
    score: number;
    level: "excellent" | "good" | "fair" | "poor";
    breakdown: AllocationBreakdown[];
    suggestions: string[];
  };
  goalAlignment: GoalAlignment[];
  recommendedActions: {
    priority: "high" | "medium" | "low";
    action: string;
    reason: string;
    impact: string;
  }[];
  naturalLanguageSummary: string;
  dataFreshness: "live" | "cached" | "mock";
}

export interface PortfolioError {
  code: PortfolioErrorCode;
  message: string;
  details?: unknown;
}

export type PortfolioErrorCode =
  | "PORTFOLIO_NOT_FOUND"
  | "NO_HOLDINGS"
  | "MARKET_DATA_UNAVAILABLE"
  | "CALCULATION_ERROR"
  | "INVALID_INPUT";

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  stock_nse: "#2196F3",
  stock_bse: "#1976D2",
  mutual_fund: "#4CAF50",
  etf: "#FF9800",
  gold: "#FFD700",
  silver: "#C0C0C0",
  index: "#9C27B0",
  cash: "#607D8B",
  crypto: "#FF5722",
  us_stock: "#00BCD4",
  bond: "#795548",
  reit: "#E91E63",
};

export const SECTOR_DEFAULTS: Record<string, string> = {
  Technology: "#2196F3",
  Finance: "#4CAF50",
  Energy: "#FF9800",
  Healthcare: "#E91E63",
  Consumer: "#9C27B0",
  Industrial: "#607D8B",
  Materials: "#795548",
  Utilities: "#00BCD4",
  Real_Estate: "#FF5722",
  Communication: "#3F51B5",
  Other: "#9E9E9E",
};
