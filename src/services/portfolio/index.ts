export type {
  Holding,
  TradeRecord,
  PortfolioSummary,
  PortfolioCalculation,
  AllocationBreakdown,
  PortfolioAllocation,
  RiskMetrics,
  PerformanceMetrics,
  GoalAlignment,
  PortfolioIntelligence,
  PortfolioError,
  PortfolioErrorCode,
} from "./portfolio-types";

export { ASSET_TYPE_COLORS, SECTOR_DEFAULTS } from "./portfolio-types";

export {
  aggregateTrades,
  calculateRealizedPnL,
  buildHoldings,
  guessSector,
  calculateCAGR,
  calculateXIRR,
  calculateVolatility,
  generateAllocationBreakdown,
} from "./portfolio-utils";

export { portfolioCalculationService } from "./portfolio-calculation.service";
export { portfolioAllocationService } from "./portfolio-allocation.service";
export { portfolioRiskService } from "./portfolio-risk.service";
export { portfolioPerformanceService } from "./portfolio-performance.service";
export { portfolioEngineService } from "./portfolio-engine.service";
