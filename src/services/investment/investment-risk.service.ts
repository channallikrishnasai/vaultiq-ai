import type { InvestmentWarning, WarningType, WarningSeverity, InvestorProfile } from "./investment-types";
import type { Holding, RiskMetrics, PortfolioSummary, GoalAlignment } from "../portfolio/portfolio-types";
import { generateWarningId, determineWarningSeverity } from "./investment-utils";

interface RiskAnalysisContext {
  holdings: Holding[];
  risk: RiskMetrics;
  summary: PortfolioSummary;
  goalAlignment: GoalAlignment[];
  investorProfile?: InvestorProfile;
}

class InvestmentRiskService {
  detectWarnings(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    warnings.push(...this.detectCashWarnings(ctx));
    warnings.push(...this.detectConcentrationWarnings(ctx));
    warnings.push(...this.detectDiversificationWarnings(ctx));
    warnings.push(...this.detectVolatilityWarnings(ctx));
    warnings.push(...this.detectGoalWarnings(ctx));
    warnings.push(...this.detectInactiveInvestments(ctx));
    warnings.push(...this.detectRiskMisalignment(ctx));
    warnings.push(...this.detectEmergencyFundWarning(ctx));
    return warnings;
  }

  private detectCashWarnings(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { summary, holdings } = ctx;
    if (summary.totalCurrentValue <= 0) return warnings;
    const cashPercent = (summary.cashBalance / summary.totalCurrentValue) * 100;
    if (cashPercent > 50) {
      warnings.push({
        id: generateWarningId(),
        type: "high_cash",
        severity: "danger",
        title: "Excessive Cash Holdings",
        description: `Cash constitutes ${cashPercent.toFixed(1)}% of your portfolio, significantly eroding purchasing power through inflation.`,
        impact: `Opportunity cost: ~₹${Math.round(summary.cashBalance * 0.12).toLocaleString("en-IN")} potential annual returns lost.`,
        recommendation: "Deploy excess cash into diversified investments aligned with your risk profile and goals.",
        metric: { current: Math.round(cashPercent), threshold: 20, unit: "%" },
      });
    } else if (cashPercent > 30) {
      warnings.push({
        id: generateWarningId(),
        type: "high_cash",
        severity: "warning",
        title: "High Cash Allocation",
        description: `Cash is ${cashPercent.toFixed(1)}% of your portfolio. While some liquidity is healthy, excessive cash drag reduces returns.`,
        impact: `Inflation at ~6% reduces cash value by ~₹${Math.round(summary.cashBalance * 0.06).toLocaleString("en-IN")} annually.`,
        recommendation: "Consider deploying 10-15% of cash into debt funds or short-term instruments.",
        metric: { current: Math.round(cashPercent), threshold: 20, unit: "%" },
      });
    }
    return warnings;
  }

  private detectConcentrationWarnings(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { risk, holdings, summary } = ctx;
    if (holdings.length === 0) return warnings;
    if (risk.largestPositionPercent > 40) {
      const topHolding = [...holdings].sort((a, b) => b.weight - a.weight)[0];
      warnings.push({
        id: generateWarningId(),
        type: "single_stock",
        severity: "critical",
        title: "Single Stock Dependency",
        description: `${topHolding.symbol} constitutes ${risk.largestPositionPercent.toFixed(1)}% of your portfolio, creating dangerous concentration.`,
        impact: `A 20% drop in ${topHolding.symbol} would reduce portfolio value by ~₹${Math.round(summary.totalCurrentValue * risk.largestPositionPercent / 100 * 0.2).toLocaleString("en-IN")}.`,
        recommendation: `Reduce ${topHolding.symbol} to max 20% of portfolio. Diversify into other sectors.`,
        metric: { current: Math.round(risk.largestPositionPercent), threshold: 25, unit: "%" },
      });
    } else if (risk.largestPositionPercent > 25) {
      warnings.push({
        id: generateWarningId(),
        type: "concentration_risk",
        severity: "warning",
        title: "High Single Position",
        description: `Largest position is ${risk.largestPositionPercent.toFixed(1)}% of portfolio, above recommended 25% threshold.`,
        impact: "Increased vulnerability to single-company events.",
        recommendation: "Consider trimming this position and redistributing to other assets.",
        metric: { current: Math.round(risk.largestPositionPercent), threshold: 25, unit: "%" },
      });
    }
    if (risk.sectorConcentration > 50) {
      warnings.push({
        id: generateWarningId(),
        type: "overexposure",
        severity: "critical",
        title: "Sector Overconcentration",
        description: `One sector dominates ${risk.sectorConcentration.toFixed(1)}% of your equity portfolio.`,
        impact: "Sector-specific downturns could significantly impact your portfolio.",
        recommendation: "Diversify across at least 4-5 sectors to reduce sector risk.",
        metric: { current: Math.round(risk.sectorConcentration), threshold: 35, unit: "%" },
      });
    }
    return warnings;
  }

  private detectDiversificationWarnings(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { risk, holdings } = ctx;
    if (risk.diversificationScore < 30 && holdings.length > 0) {
      warnings.push({
        id: generateWarningId(),
        type: "low_diversification",
        severity: "critical",
        title: "Poor Diversification",
        description: `Diversification score is ${risk.diversificationScore}/100. Your portfolio is highly concentrated.`,
        impact: "Higher risk without proportional return potential.",
        recommendation: "Add holdings across different asset classes: stocks, bonds, gold, and ETFs.",
        metric: { current: risk.diversificationScore, threshold: 50, unit: "/100" },
      });
    } else if (risk.diversificationScore < 50 && holdings.length > 0) {
      warnings.push({
        id: generateWarningId(),
        type: "low_diversification",
        severity: "warning",
        title: "Moderate Diversification Needed",
        description: `Diversification score is ${risk.diversificationScore}/100. Room for improvement.`,
        impact: "Portfolio is susceptible to concentration risk.",
        recommendation: "Consider adding 2-3 more holdings across different sectors and asset classes.",
        metric: { current: risk.diversificationScore, threshold: 50, unit: "/100" },
      });
    }
    return warnings;
  }

  private detectVolatilityWarnings(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { risk, holdings } = ctx;
    if (risk.volatility > 50) {
      warnings.push({
        id: generateWarningId(),
        type: "high_volatility",
        severity: "critical",
        title: "High Portfolio Volatility",
        description: `Portfolio volatility is ${risk.volatility.toFixed(1)}%. Expect significant price swings.`,
        impact: "Potential for large short-term losses during market downturns.",
        recommendation: "Add stable assets like bonds, gold, or large-cap ETFs to reduce volatility.",
        metric: { current: Math.round(risk.volatility), threshold: 30, unit: "%" },
      });
    } else if (risk.volatility > 35) {
      warnings.push({
        id: generateWarningId(),
        type: "high_volatility",
        severity: "warning",
        title: "Above-Average Volatility",
        description: `Portfolio volatility at ${risk.volatility.toFixed(1)}% is above comfortable levels for moderate risk profiles.`,
        impact: "May cause emotional selling during market corrections.",
        recommendation: "Consider balancing with less volatile assets or increasing SIP duration.",
        metric: { current: Math.round(risk.volatility), threshold: 30, unit: "%" },
      });
    }
    return warnings;
  }

  private detectGoalWarnings(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { goalAlignment } = ctx;
    for (const goal of goalAlignment) {
      if (!goal.onTrack && goal.monthlyNeeded && goal.monthlyNeeded > 0) {
        warnings.push({
          id: generateWarningId(),
          type: "goal_mismatch",
          severity: goal.percentComplete < 30 ? "critical" : "warning",
          title: `Goal "${goal.goalName}" Off Track`,
          description: `Goal "${goal.goalName}" is ${goal.percentComplete.toFixed(0)}% complete. Need ₹${goal.monthlyNeeded.toLocaleString("en-IN")}/month to stay on track.`,
          impact: `May not reach ${goal.goalType} target of ₹${goal.targetAmount.toLocaleString("en-IN")} by deadline.`,
          recommendation: `Increase monthly investment by ₹${goal.monthlyNeeded.toLocaleString("en-IN")} toward this goal.`,
          metric: { current: goal.percentComplete, threshold: goal.onTrack ? 0 : 100, unit: "%" },
        });
      }
    }
    return warnings;
  }

  private detectInactiveInvestments(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { holdings } = ctx;
    const inactiveHoldings = holdings.filter(h => h.dayChange === 0 && h.dayChangePercent === 0);
    if (inactiveHoldings.length > 0 && holdings.length > 0) {
      const inactivePercent = (inactiveHoldings.length / holdings.length) * 100;
      if (inactivePercent > 50) {
        warnings.push({
          id: generateWarningId(),
          type: "inactive_investments",
          severity: "warning",
          title: "Many Inactive Investments",
          description: `${inactiveHoldings.length} of ${holdings.length} holdings show no recent activity.`,
          impact: "May indicate neglected positions that need review.",
          recommendation: "Review inactive positions: consider exiting or adding SIPs to promising ones.",
        });
      }
    }
    return warnings;
  }

  private detectRiskMisalignment(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { risk, investorProfile } = ctx;
    if (!investorProfile) return warnings;
    if (risk.riskAlignment === "aggressive" && investorProfile.riskAppetite === "conservative") {
      warnings.push({
        id: generateWarningId(),
        type: "risk_misalignment",
        severity: "critical",
        title: "Risk-Profile Mismatch",
        description: "Your portfolio is significantly more aggressive than your stated conservative risk appetite.",
        impact: "Potential for losses beyond your comfort zone during market downturns.",
        recommendation: "Rebalance toward conservative allocation: increase debt/gold allocation.",
      });
    } else if (risk.riskAlignment === "conservative" && investorProfile.riskAppetite === "aggressive") {
      warnings.push({
        id: generateWarningId(),
        type: "risk_misalignment",
        severity: "info",
        title: "Portfolio Too Conservative",
        description: "Your portfolio is more conservative than your aggressive risk appetite allows.",
        impact: "May underperform long-term growth potential.",
        recommendation: "Consider increasing equity allocation for higher long-term returns.",
      });
    }
    return warnings;
  }

  private detectEmergencyFundWarning(ctx: RiskAnalysisContext): InvestmentWarning[] {
    const warnings: InvestmentWarning[] = [];
    const { investorProfile, summary } = ctx;
    if (!investorProfile) return warnings;
    const monthlyExpenses = investorProfile.monthlyIncome * (1 - investorProfile.savingsRate / 100);
    const emergencyTarget = monthlyExpenses * 6;
    if (summary.cashBalance < emergencyTarget * 0.5) {
      warnings.push({
        id: generateWarningId(),
        type: "no_emergency_fund",
        severity: "critical",
        title: "Insufficient Emergency Fund",
        description: `Emergency fund should be 6 months expenses (~₹${Math.round(emergencyTarget).toLocaleString("en-IN")}). Current liquid savings: ₹${Math.round(summary.cashBalance).toLocaleString("en-IN")}.`,
        impact: "May need to sell investments at a loss during emergencies.",
        recommendation: "Build emergency fund before increasing investments. Keep 6 months expenses in liquid funds/savings.",
        metric: { current: Math.round(summary.cashBalance), threshold: Math.round(emergencyTarget), unit: "₹" },
      });
    }
    return warnings;
  }

  summarizeWarnings(warnings: InvestmentWarning[]): string {
    if (warnings.length === 0) return "No critical warnings detected. Your portfolio is healthy.";
    const critical = warnings.filter(w => w.severity === "danger" || w.severity === "critical");
    const moderate = warnings.filter(w => w.severity === "warning");
    const info = warnings.filter(w => w.severity === "info");
    const parts: string[] = [];
    if (critical.length > 0) {
      parts.push(`${critical.length} critical issue(s): ${critical.map(w => w.title).join(", ")}.`);
    }
    if (moderate.length > 0) {
      parts.push(`${moderate.length} warning(s): ${moderate.map(w => w.title).join(", ")}.`);
    }
    if (info.length > 0) {
      parts.push(`${info.length} info item(s): ${info.map(w => w.title).join(", ")}.`);
    }
    return parts.join(" ");
  }
}

export const investmentRiskService = new InvestmentRiskService();
