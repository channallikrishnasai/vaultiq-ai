import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { RiskAppetite } from "@/generated/prisma/enums";
import type {
  PortfolioIntelligence,
  PortfolioSummary,
  PortfolioAllocation,
  RiskMetrics,
  PerformanceMetrics,
  GoalAlignment,
  PortfolioCalculation,
  AllocationBreakdown,
} from "./portfolio-types";
import { portfolioCalculationService } from "./portfolio-calculation.service";
import { portfolioAllocationService } from "./portfolio-allocation.service";
import { portfolioRiskService } from "./portfolio-risk.service";
import { portfolioPerformanceService } from "./portfolio-performance.service";

const TAG = "PortfolioEngine";

export const portfolioEngineService = {
  async getIntelligence(userId: string, portfolioId?: string): Promise<PortfolioIntelligence> {
    const pid = portfolioId ?? await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!pid) {
      return this.getEmptyIntelligence();
    }

    try {
      const calc = await portfolioCalculationService.calculatePortfolio(pid, userId);
      const portfolio = await prisma.portfolio.findFirst({
        where: { id: pid, userId },
        select: { name: true },
      });

      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { riskAppetite: true },
      });

      const riskAppetite = (profile?.riskAppetite as RiskAppetite) ?? "MODERATE";

      const allocation = portfolioAllocationService.calculateAllocation(
        calc.holdings,
        calc.cashBalance,
      );

      const riskMetrics = portfolioRiskService.calculateRiskMetrics(
        calc.holdings,
        riskAppetite,
      );

      const performance = portfolioPerformanceService.calculatePerformance(calc.holdings);

      const goals = await this.getGoalAlignment(userId, calc);
      const recommendedActions = this.generateActions(calc, riskMetrics, allocation);

      const summary: PortfolioSummary = {
        portfolioId: pid,
        portfolioName: portfolio?.name ?? "Portfolio",
        totalCurrentValue: calc.totalCurrentValue,
        totalInvested: calc.totalInvested,
        cashBalance: calc.cashBalance,
        totalPnL: calc.totalPnL,
        totalPnLPercent: calc.totalPnLPercent,
        todayPnL: calc.todayPnL,
        todayPnLPercent: calc.todayPnLPercent,
        unrealizedPnL: calc.unrealizedPnL,
        realizedPnL: calc.realizedPnL,
        holdingsCount: calc.holdings.length,
        lastUpdated: new Date().toISOString(),
      };

      const diversification = {
        score: riskMetrics.diversificationScore,
        level: portfolioRiskService.getDiversificationLevel(riskMetrics.diversificationScore),
        breakdown: allocation.byAssetClass,
        suggestions: portfolioRiskService.generateDiversificationSuggestions(
          calc.holdings,
          allocation.byAssetClass,
        ),
      };

      const naturalLanguageSummary = this.generateNaturalLanguageSummary(
        summary,
        riskMetrics,
        performance,
        diversification.level,
      );

      return {
        summary,
        riskAnalysis: riskMetrics,
        diversification,
        goalAlignment: goals,
        recommendedActions,
        naturalLanguageSummary,
        dataFreshness: "cached",
      };
    } catch (error) {
      logger.error(TAG, "Failed to build portfolio intelligence", error);
      return this.getEmptyIntelligence();
    }
  },

  async getSummary(userId: string, portfolioId?: string): Promise<PortfolioSummary> {
    const pid = portfolioId ?? await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!pid) {
      return {
        portfolioId: "",
        portfolioName: "No Portfolio",
        totalCurrentValue: 0,
        totalInvested: 0,
        cashBalance: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        todayPnL: 0,
        todayPnLPercent: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        holdingsCount: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    return portfolioCalculationService.getSummary(pid, userId);
  },

  async getAllocation(userId: string, portfolioId?: string): Promise<PortfolioAllocation> {
    const pid = portfolioId ?? await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!pid) {
      return {
        byAssetClass: [],
        bySector: [],
        byMarketCap: [],
        byRisk: [],
        byCurrency: [],
      };
    }

    const calc = await portfolioCalculationService.calculatePortfolio(pid, userId);
    return portfolioAllocationService.calculateAllocation(calc.holdings, calc.cashBalance);
  },

  async getRisk(userId: string, portfolioId?: string): Promise<RiskMetrics> {
    const pid = portfolioId ?? await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!pid) {
      return {
        diversificationScore: 0,
        concentrationScore: 0,
        portfolioRiskScore: 50,
        volatility: 0,
        beta: null,
        riskAlignment: "aligned",
        topHoldingsConcentration: 0,
        sectorConcentration: 0,
        largestPositionPercent: 0,
      };
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { riskAppetite: true },
    });

    const riskAppetite = (profile?.riskAppetite as RiskAppetite) ?? "MODERATE";
    const calc = await portfolioCalculationService.calculatePortfolio(pid, userId);
    return portfolioRiskService.calculateRiskMetrics(calc.holdings, riskAppetite);
  },

  async getPerformance(userId: string, portfolioId?: string): Promise<PerformanceMetrics> {
    const pid = portfolioId ?? await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!pid) {
      return {
        topGainers: [],
        topLosers: [],
        bestPerforming: null,
        worstPerforming: null,
        todayPerformance: { gainers: 0, losers: 0, unchanged: 0, totalDayChange: 0 },
        overallPerformance: { totalReturn: 0, totalReturnPercent: 0 },
        monthlyPerformance: { estimatedMonthlyReturn: 0, estimatedMonthlyReturnPercent: 0 },
        yearToDatePerformance: { estimatedYTDReturn: 0, estimatedYTDReturnPercent: 0 },
      };
    }

    const calc = await portfolioCalculationService.calculatePortfolio(pid, userId);
    return portfolioPerformanceService.calculatePerformance(calc.holdings);
  },

  async getGoalAlignment(
    userId: string,
    calc: PortfolioCalculation,
  ): Promise<GoalAlignment[]> {
    const goals = await prisma.goal.findMany({
      where: { userId },
      select: {
        name: true,
        type: true,
        targetAmount: true,
        currentAmount: true,
        deadline: true,
      },
    });

    return goals.map((goal) => {
      const portfolioContribution = Math.min(
        calc.totalCurrentValue * 0.5,
        goal.currentAmount,
      );
      const percentComplete = goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;
      const remaining = goal.targetAmount - goal.currentAmount;
      const onTrack = remaining <= 0;

      let monthsToGoal: number | null = null;
      let monthlyNeeded: number | null = null;

      if (remaining > 0 && goal.deadline) {
        const deadline = new Date(goal.deadline);
        const monthsLeft = Math.max(1, Math.ceil(
          (deadline.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000),
        ));
        monthlyNeeded = Math.ceil(remaining / monthsLeft);
        monthsToGoal = monthsLeft;
      }

      return {
        goalName: goal.name,
        goalType: goal.type,
        targetAmount: goal.targetAmount,
        currentProgress: goal.currentAmount,
        portfolioContribution: Number(portfolioContribution.toFixed(2)),
        percentComplete: Number(percentComplete.toFixed(1)),
        onTrack,
        monthsToGoal,
        monthlyNeeded,
      };
    });
  },

  generateActions(
    calc: PortfolioCalculation,
    risk: RiskMetrics,
    allocation: PortfolioAllocation,
  ): PortfolioIntelligence["recommendedActions"] {
    const actions: PortfolioIntelligence["recommendedActions"] = [];

    if (calc.cashBalance > calc.totalCurrentValue * 0.3) {
      actions.push({
        priority: "high",
        action: "Deploy idle cash into investments",
        reason: `${((calc.cashBalance / calc.totalCurrentValue) * 100).toFixed(1)}% of your portfolio is in cash`,
        impact: "Improve returns by reducing cash drag",
      });
    }

    if (risk.diversificationScore < 40) {
      actions.push({
        priority: "high",
        action: "Improve portfolio diversification",
        reason: `Diversification score is ${risk.diversificationScore.toFixed(0)}/100`,
        impact: "Reduce portfolio risk through better diversification",
      });
    }

    if (risk.largestPositionPercent > 30) {
      actions.push({
        priority: "medium",
        action: `Reduce concentration in ${calc.holdings[0]?.symbol ?? "top holding"}`,
        reason: `Largest position is ${risk.largestPositionPercent.toFixed(1)}% of portfolio`,
        impact: "Lower single-stock risk",
      });
    }

    if (risk.riskAlignment === "aggressive") {
      actions.push({
        priority: "medium",
        action: "Portfolio risk exceeds your risk appetite",
        reason: `Portfolio risk score (${risk.portfolioRiskScore.toFixed(0)}) is higher than your risk profile allows`,
        impact: "Consider rebalancing to match your risk tolerance",
      });
    }

    if (calc.holdings.length < 5) {
      actions.push({
        priority: "low",
        action: "Add more holdings to the portfolio",
        reason: `Only ${calc.holdings.length} holding(s) in portfolio`,
        impact: "Better diversification and risk reduction",
      });
    }

    return actions;
  },

  generateNaturalLanguageSummary(
    summary: PortfolioSummary,
    risk: RiskMetrics,
    performance: PerformanceMetrics,
    diversificationLevel: string,
  ): string {
    const parts: string[] = [];

    parts.push(`Your Virtual Trading Portfolio (Paper Trading) is currently valued at ₹${summary.totalCurrentValue.toLocaleString("en-IN")}.`);
    parts.push("NOTE: This is simulated trading data, not real investments.");

    if (summary.totalPnL >= 0) {
      parts.push(`You have a total simulated gain of ₹${summary.totalPnL.toLocaleString("en-IN")} (${summary.totalPnLPercent.toFixed(2)}%).`);
    } else {
      parts.push(`You have a total simulated loss of ₹${Math.abs(summary.totalPnL).toLocaleString("en-IN")} (${Math.abs(summary.totalPnLPercent).toFixed(2)}%).`);
    }

    if (summary.todayPnL >= 0) {
      parts.push(`Today your virtual portfolio gained ₹${summary.todayPnL.toLocaleString("en-IN")}.`);
    } else {
      parts.push(`Today your virtual portfolio lost ₹${Math.abs(summary.todayPnL).toLocaleString("en-IN")}.`);
    }

    parts.push(`Diversification is ${diversificationLevel}.`);

    if (risk.riskAlignment === "aggressive") {
      parts.push("Your virtual portfolio is more aggressive than your risk appetite allows.");
    } else if (risk.riskAlignment === "conservative") {
      parts.push("Your virtual portfolio is more conservative than needed for your goals.");
    } else {
      parts.push("Your risk profile is well-aligned with your virtual portfolio.");
    }

    if (performance.topGainers.length > 0) {
      parts.push(`Top gainer today: ${performance.topGainers[0].symbol} (+${performance.topGainers[0].dayChangePercent.toFixed(2)}%).`);
    }

    if (performance.topLosers.length > 0) {
      parts.push(`Top loser today: ${performance.topLosers[0].symbol} (${performance.topLosers[0].dayChangePercent.toFixed(2)}%).`);
    }

    return parts.join(" ");
  },

  getEmptyIntelligence(): PortfolioIntelligence {
    return {
      summary: {
        portfolioId: "",
        portfolioName: "No Portfolio",
        totalCurrentValue: 0,
        totalInvested: 0,
        cashBalance: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        todayPnL: 0,
        todayPnLPercent: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        holdingsCount: 0,
        lastUpdated: new Date().toISOString(),
      },
      riskAnalysis: {
        diversificationScore: 0,
        concentrationScore: 0,
        portfolioRiskScore: 50,
        volatility: 0,
        beta: null,
        riskAlignment: "aligned",
        topHoldingsConcentration: 0,
        sectorConcentration: 0,
        largestPositionPercent: 0,
      },
      diversification: {
        score: 0,
        level: "poor",
        breakdown: [],
        suggestions: ["Start building your portfolio by adding investments."],
      },
      goalAlignment: [],
      recommendedActions: [],
      naturalLanguageSummary: "No Virtual Trading Portfolio data available. Start by adding simulated investments to your Virtual Trading Lab.",
      dataFreshness: "cached",
    };
  },
};
