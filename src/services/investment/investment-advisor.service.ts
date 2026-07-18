import type {
  InvestmentAnalysis,
  InvestmentHealthScore,
  InvestmentRecommendation,
  InvestmentOpportunity,
  InvestmentWarning,
  SimulationInput,
  SimulationResult,
  InvestorProfile,
} from "./investment-types";
import type {
  Holding,
  PortfolioSummary,
  RiskMetrics,
  GoalAlignment,
  AllocationBreakdown,
  PortfolioAllocation,
  PerformanceMetrics,
} from "../portfolio/portfolio-types";
import type { RiskAppetite } from "@/generated/prisma/enums";
import { portfolioEngineService } from "../portfolio/portfolio-engine.service";
import { portfolioCalculationService } from "../portfolio/portfolio-calculation.service";
import { portfolioAllocationService } from "../portfolio/portfolio-allocation.service";
import { portfolioRiskService } from "../portfolio/portfolio-risk.service";
import { portfolioPerformanceService } from "../portfolio/portfolio-performance.service";
import {
  buildHealthScore,
  calculatePortfolioHealthScore,
  calculateInvestmentScore,
  calculateDiversificationRating,
  calculateRiskRating,
  calculateOpportunityScore,
  calculateLongTermGrowthScore,
  estimateFutureValue,
  calculateSIPFutureValue,
} from "./investment-utils";
import { investmentRiskService } from "./investment-risk.service";
import { investmentRecommendationService } from "./investment-recommendation.service";
import { investmentOpportunityService } from "./investment-opportunity.service";

interface AdvisorContext {
  userId: string;
  portfolioId?: string;
  investorProfile?: InvestorProfile;
}

interface PortfolioContext {
  holdings: Holding[];
  summary: PortfolioSummary;
  risk: RiskMetrics;
  goalAlignment: GoalAlignment[];
  allocation: PortfolioAllocation;
  performance: PerformanceMetrics;
}

class InvestmentAdvisorService {
  async getInvestmentAdvice(ctx: AdvisorContext): Promise<InvestmentAnalysis> {
    const { userId, portfolioId, investorProfile } = ctx;
    const defaultPortfolioId = portfolioId || await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!defaultPortfolioId) {
      return this.getEmptyAnalysis();
    }
    const portfolioCtx = await this.buildPortfolioContext(userId, defaultPortfolioId);
    if (!portfolioCtx) {
      return this.getEmptyAnalysis();
    }
    const { holdings, summary, risk, goalAlignment, allocation, performance } = portfolioCtx;
    const health = this.calculateHealth(summary, risk, goalAlignment, allocation, investorProfile);
    const recommendations = investmentRecommendationService.generateRecommendations({
      holdings, risk, summary, goalAlignment, performance, allocation, investorProfile,
    });
    const opportunities = investmentOpportunityService.detectOpportunities({
      holdings, risk, summary, goalAlignment, performance, allocation, investorProfile,
    });
    const warnings = investmentRiskService.detectWarnings({
      holdings, risk, summary, goalAlignment, investorProfile,
    });
    const actionItems = this.generateActionItems(recommendations, warnings, health);
    return {
      health,
      recommendations,
      opportunities,
      warnings,
      portfolioSummary: this.generatePortfolioSummary(summary, risk, health),
      riskSummary: this.generateRiskSummary(risk, warnings),
      actionItems,
      generatedAt: new Date().toISOString(),
      dataFreshness: "cached",
    };
  }

  async getHealthScore(userId: string, portfolioId?: string): Promise<InvestmentHealthScore> {
    const defaultPortfolioId = portfolioId || await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!defaultPortfolioId) {
      return this.getEmptyHealth();
    }
    const portfolioCtx = await this.buildPortfolioContext(userId, defaultPortfolioId);
    if (!portfolioCtx) {
      return this.getEmptyHealth();
    }
    const { summary, risk, goalAlignment, allocation } = portfolioCtx;
    return this.calculateHealth(summary, risk, goalAlignment, allocation);
  }

  async getRecommendations(
    userId: string,
    portfolioId?: string,
    investorProfile?: InvestorProfile
  ): Promise<InvestmentRecommendation[]> {
    const defaultPortfolioId = portfolioId || await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!defaultPortfolioId) return [];
    const portfolioCtx = await this.buildPortfolioContext(userId, defaultPortfolioId);
    if (!portfolioCtx) return [];
    return investmentRecommendationService.generateRecommendations({
      ...portfolioCtx,
      investorProfile,
    });
  }

  async getOpportunities(userId: string, portfolioId?: string): Promise<InvestmentOpportunity[]> {
    const defaultPortfolioId = portfolioId || await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!defaultPortfolioId) return [];
    const portfolioCtx = await this.buildPortfolioContext(userId, defaultPortfolioId);
    if (!portfolioCtx) return [];
    return investmentOpportunityService.detectOpportunities(portfolioCtx);
  }

  async getWarnings(userId: string, portfolioId?: string): Promise<InvestmentWarning[]> {
    const defaultPortfolioId = portfolioId || await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!defaultPortfolioId) return [];
    const portfolioCtx = await this.buildPortfolioContext(userId, defaultPortfolioId);
    if (!portfolioCtx) return [];
    return investmentRiskService.detectWarnings({
      ...portfolioCtx,
      investorProfile: undefined,
    });
  }

  async runSimulation(userId: string, input: SimulationInput, portfolioId?: string): Promise<SimulationResult> {
    const defaultPortfolioId = portfolioId || await portfolioCalculationService.getDefaultPortfolioId(userId);
    if (!defaultPortfolioId) {
      return this.getEmptySimulation();
    }
    const portfolioCtx = await this.buildPortfolioContext(userId, defaultPortfolioId);
    if (!portfolioCtx) {
      return this.getEmptySimulation();
    }
    return this.calculateSimulation(portfolioCtx, input);
  }

  private calculateHealth(
    summary: PortfolioSummary,
    risk: RiskMetrics,
    goalAlignment: GoalAlignment[],
    allocation: PortfolioAllocation,
    investorProfile?: InvestorProfile
  ): InvestmentHealthScore {
    const portfolioHealth = calculatePortfolioHealthScore(summary, risk);
    const investmentScore = calculateInvestmentScore(summary, risk, goalAlignment);
    const diversificationRating = calculateDiversificationRating(risk);
    const riskRating = calculateRiskRating(risk, investorProfile?.riskAppetite || "moderate");
    const opportunityScore = calculateOpportunityScore(
      allocation.byAssetClass,
      goalAlignment,
      summary
    );
    const longTermGrowthScore = calculateLongTermGrowthScore(summary, risk, goalAlignment);
    return buildHealthScore(
      portfolioHealth, investmentScore, diversificationRating,
      riskRating, opportunityScore, longTermGrowthScore, summary
    );
  }

  private async buildPortfolioContext(userId: string, portfolioId: string): Promise<PortfolioContext | null> {
    try {
      const calc = await portfolioCalculationService.calculatePortfolio(portfolioId, userId);
      const holdings = calc.holdings;
      const riskAppetite: RiskAppetite = "MODERATE";
      const risk = portfolioRiskService.calculateRiskMetrics(holdings, riskAppetite);
      const allocation = portfolioAllocationService.calculateAllocation(holdings, calc.cashBalance);
      const performance = portfolioPerformanceService.calculatePerformance(holdings);
      const goalAlignment = await portfolioEngineService.getGoalAlignment(userId, calc);
      const summary: PortfolioSummary = {
        portfolioId,
        portfolioName: "Portfolio",
        totalCurrentValue: calc.totalCurrentValue,
        totalInvested: calc.totalInvested,
        cashBalance: calc.cashBalance,
        totalPnL: calc.totalPnL,
        totalPnLPercent: calc.totalPnLPercent,
        todayPnL: calc.todayPnL,
        todayPnLPercent: calc.todayPnLPercent,
        unrealizedPnL: calc.unrealizedPnL,
        realizedPnL: calc.realizedPnL,
        holdingsCount: holdings.length,
        lastUpdated: new Date().toISOString(),
      };
      return {
        holdings,
        summary,
        risk,
        goalAlignment,
        allocation,
        performance,
      };
    } catch {
      return null;
    }
  }

  private calculateSimulation(portfolioCtx: PortfolioContext, input: SimulationInput): SimulationResult {
    const { summary, risk, holdings, goalAlignment } = portfolioCtx;
    const currentPortfolioValue = summary.totalCurrentValue;
    let simulatedValue = currentPortfolioValue;
    let annualReturnEstimate = 12;
    if (input.monthlyInvestment) {
      const futureValue = calculateSIPFutureValue(input.monthlyInvestment, annualReturnEstimate, 5);
      simulatedValue += futureValue * 0.3;
    }
    if (input.monthlyIncrease) {
      const futureValue = calculateSIPFutureValue(input.monthlyIncrease, annualReturnEstimate, 5);
      simulatedValue += futureValue * 0.3;
    }
    if (input.priceChange) {
      const holding = holdings.find(h => h.symbol === input.priceChange!.symbol);
      if (holding) {
        const priceImpact = holding.currentValue * (input.priceChange.percentChange / 100);
        simulatedValue += priceImpact;
      }
    }
    if (input.marketGrowth) {
      simulatedValue = estimateFutureValue(currentPortfolioValue, input.marketGrowth.annualReturn, input.marketGrowth.years);
      annualReturnEstimate = input.marketGrowth.annualReturn;
    }
    if (input.lumpSum) {
      simulatedValue += input.lumpSum.amount;
    }
    if (input.sipChange) {
      const diff = input.sipChange.newAmount - input.sipChange.currentAmount;
      const futureValue = calculateSIPFutureValue(Math.abs(diff), annualReturnEstimate, 5);
      simulatedValue += diff > 0 ? futureValue * 0.3 : -futureValue * 0.3;
    }
    const goalImpact = goalAlignment.map(goal => {
      const progressBefore = goal.percentComplete;
      const newValue = simulatedValue * (goal.targetAmount > 0 ? (goal.currentProgress / goal.targetAmount) : 0);
      const newProgress = goal.targetAmount > 0 ? (newValue / goal.targetAmount) * 100 : progressBefore;
      return {
        goalName: goal.goalName,
        currentProgress: progressBefore,
        newProgress: Math.min(newProgress, 100),
        onTrackBefore: goal.onTrack,
        onTrackAfter: newProgress >= 80,
        monthlyNeeded: goal.monthlyNeeded,
      };
    });
    const riskScoreAfter = Math.min(100, risk.portfolioRiskScore + (input.marketGrowth ? 5 : 0));
    const volatilityAfter = Math.min(100, risk.volatility + (input.marketGrowth ? 3 : 0));
    const futureValueResult = {
      oneYear: estimateFutureValue(simulatedValue, annualReturnEstimate, 1),
      threeYear: estimateFutureValue(simulatedValue, annualReturnEstimate, 3),
      fiveYear: estimateFutureValue(simulatedValue, annualReturnEstimate, 5),
      tenYear: estimateFutureValue(simulatedValue, annualReturnEstimate, 10),
    };
    const monthlyIncome = summary.totalCurrentValue * 0.005;
    const monthlyInvestments = (input.monthlyInvestment || 0) + (input.monthlyIncrease || 0);
    return {
      currentPortfolioValue,
      simulatedPortfolioValue: Math.round(simulatedValue),
      goalImpact,
      riskImpact: {
        riskScoreBefore: risk.portfolioRiskScore,
        riskScoreAfter,
        volatilityBefore: risk.volatility,
        volatilityAfter,
        diversificationBefore: risk.diversificationScore,
        diversificationAfter: risk.diversificationScore,
      },
      expectedCAGR: annualReturnEstimate,
      futureValue: {
        oneYear: Math.round(futureValueResult.oneYear),
        threeYear: Math.round(futureValueResult.threeYear),
        fiveYear: Math.round(futureValueResult.fiveYear),
        tenYear: Math.round(futureValueResult.tenYear),
      },
      summary: this.generateSimulationSummary(
        currentPortfolioValue, Math.round(simulatedValue), annualReturnEstimate, goalImpact
      ),
      monthlyCashFlow: {
        income: Math.round(monthlyIncome),
        investments: Math.round(monthlyInvestments),
        remaining: Math.round(monthlyIncome - monthlyInvestments),
      },
    };
  }

  private generateActionItems(
    recommendations: InvestmentRecommendation[],
    warnings: InvestmentWarning[],
    health: InvestmentHealthScore
  ): string[] {
    const items: string[] = [];
    const highPriority = recommendations.filter(r => r.priority === "high");
    const criticalWarnings = warnings.filter(w => w.severity === "danger" || w.severity === "critical");
    if (criticalWarnings.length > 0) {
      items.push(`Address ${criticalWarnings.length} critical warning(s) immediately`);
    }
    if (highPriority.length > 0) {
      items.push(`Act on ${highPriority.length} high-priority recommendation(s)`);
    }
    if (health.overall < 50) {
      items.push("Portfolio health is below average — comprehensive review needed");
    }
    const cashWarning = warnings.find(w => w.type === "high_cash");
    if (cashWarning) {
      items.push("Deploy idle cash into productive investments");
    }
    const goalWarnings = warnings.filter(w => w.type === "goal_mismatch");
    if (goalWarnings.length > 0) {
      items.push(`Realign investments for ${goalWarnings.length} off-track goal(s)`);
    }
    const diversificationRec = recommendations.find(r => r.type === "diversify");
    if (diversificationRec) {
      items.push("Improve portfolio diversification across sectors and asset classes");
    }
    if (items.length === 0) {
      items.push("Continue current investment strategy — portfolio is on track");
    }
    return items.slice(0, 8);
  }

  private generatePortfolioSummary(summary: PortfolioSummary, risk: RiskMetrics, health: InvestmentHealthScore): string {
    const parts: string[] = [];
    parts.push(`Portfolio: ₹${summary.totalCurrentValue.toLocaleString("en-IN")}`);
    parts.push(`Invested: ₹${summary.totalInvested.toLocaleString("en-IN")}`);
    parts.push(`P&L: ${summary.totalPnLPercent >= 0 ? "+" : ""}${summary.totalPnLPercent.toFixed(1)}%`);
    parts.push(`Holdings: ${summary.holdingsCount}`);
    parts.push(`Health: ${health.grade} (${health.overall}/100)`);
    parts.push(`Risk: ${risk.portfolioRiskScore}/100`);
    parts.push(`Diversification: ${risk.diversificationScore}/100`);
    return parts.join(" | ");
  }

  private generateRiskSummary(risk: RiskMetrics, warnings: InvestmentWarning[]): string {
    const parts: string[] = [];
    parts.push(`Risk Score: ${risk.portfolioRiskScore}/100`);
    parts.push(`Diversification: ${risk.diversificationScore}/100 (${risk.riskAlignment})`);
    parts.push(`Volatility: ${risk.volatility.toFixed(1)}%`);
    parts.push(`Beta: ${risk.beta?.toFixed(2) || "N/A"}`);
    if (warnings.length > 0) {
      parts.push(`Warnings: ${warnings.length} (${warnings.filter(w => w.severity === "danger" || w.severity === "critical").length} critical)`);
    }
    return parts.join(" | ");
  }

  private generateSimulationSummary(
    currentValue: number,
    simulatedValue: number,
    annualReturn: number,
    goalImpact: { goalName: string; onTrackBefore: boolean; onTrackAfter: boolean }[]
  ): string {
    const change = simulatedValue - currentValue;
    const changePercent = currentValue > 0 ? ((simulatedValue / currentValue - 1) * 100) : 0;
    const parts: string[] = [];
    parts.push(`Simulation result: ₹${currentValue.toLocaleString("en-IN")} → ₹${simulatedValue.toLocaleString("en-IN")}`);
    parts.push(`Change: ${change >= 0 ? "+" : ""}₹${change.toLocaleString("en-IN")} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%)`);
    parts.push(`Expected CAGR: ${annualReturn}%`);
    const improvedGoals = goalImpact.filter(g => g.onTrackAfter && !g.onTrackBefore);
    if (improvedGoals.length > 0) {
      parts.push(`Goals improved: ${improvedGoals.map(g => g.goalName).join(", ")}`);
    }
    return parts.join(". ") + ".";
  }

  private getEmptyAnalysis(): InvestmentAnalysis {
    return {
      health: this.getEmptyHealth(),
      recommendations: [],
      opportunities: [],
      warnings: [],
      portfolioSummary: "No portfolio data available. Start by creating a portfolio and adding investments.",
      riskSummary: "No risk data available.",
      actionItems: ["Create a portfolio to start receiving investment advice."],
      generatedAt: new Date().toISOString(),
      dataFreshness: "mock",
    };
  }

  private getEmptyHealth(): InvestmentHealthScore {
    return buildHealthScore(0, 0, 0, 0, 0, 0, {
      portfolioId: "",
      portfolioName: "Empty",
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
    });
  }

  private getEmptySimulation(): SimulationResult {
    return {
      currentPortfolioValue: 0,
      simulatedPortfolioValue: 0,
      goalImpact: [],
      riskImpact: {
        riskScoreBefore: 0,
        riskScoreAfter: 0,
        volatilityBefore: 0,
        volatilityAfter: 0,
        diversificationBefore: 0,
        diversificationAfter: 0,
      },
      expectedCAGR: 0,
      futureValue: { oneYear: 0, threeYear: 0, fiveYear: 0, tenYear: 0 },
      summary: "No portfolio data available for simulation.",
      monthlyCashFlow: { income: 0, investments: 0, remaining: 0 },
    };
  }
}

export const investmentAdvisorService = new InvestmentAdvisorService();
