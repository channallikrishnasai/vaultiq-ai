import type {
  InvestmentRecommendation,
  InvestorProfile,
  RecommendationAction,
} from "./investment-types";
import type {
  Holding,
  RiskMetrics,
  PortfolioSummary,
  GoalAlignment,
  AllocationBreakdown,
  PortfolioAllocation,
  PerformanceMetrics,
} from "../portfolio/portfolio-types";
import { generateRecommendationId } from "./investment-utils";

interface RecommendationContext {
  holdings: Holding[];
  risk: RiskMetrics;
  summary: PortfolioSummary;
  goalAlignment: GoalAlignment[];
  performance: PerformanceMetrics;
  allocation: PortfolioAllocation;
  investorProfile?: InvestorProfile;
}

class InvestmentRecommendationService {
  generateRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recommendations: InvestmentRecommendation[] = [];
    recommendations.push(...this.generateCashRecommendations(ctx));
    recommendations.push(...this.generateDiversificationRecommendations(ctx));
    recommendations.push(...this.generateSIPRecommendations(ctx));
    recommendations.push(...this.generateGoalRecommendations(ctx));
    recommendations.push(...this.generateConcentrationRecommendations(ctx));
    recommendations.push(...this.generateRiskRecommendations(ctx));
    recommendations.push(...this.generatePerformanceRecommendations(ctx));
    recommendations.push(...this.generateEmergencyFundRecommendations(ctx));
    return this.deduplicateAndSort(recommendations);
  }

  private generateCashRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { summary, investorProfile } = ctx;
    if (summary.totalCurrentValue <= 0) return recs;
    const cashPercent = (summary.cashBalance / summary.totalCurrentValue) * 100;
    if (cashPercent > 30) {
      const riskAppetite = investorProfile?.riskAppetite || "moderate";
      const allocationMap: Record<string, number> = {
        very_conservative: 20,
        conservative: 40,
        moderate: 60,
        aggressive: 80,
        very_aggressive: 90,
      };
      const equityTarget = allocationMap[riskAppetite] || 60;
      const deployAmount = summary.cashBalance * 0.5;
      recs.push({
        id: generateRecommendationId(),
        type: "reduce_cash",
        title: "Deploy Excess Cash",
        description: `₹${summary.cashBalance.toLocaleString("en-IN")} (${cashPercent.toFixed(1)}%) is sitting idle in cash.`,
        reason: `Cash earns negative real returns after inflation (~6%). Deploying to ${riskAppetite} portfolio can generate 8-15% returns.`,
        benefits: [
          "Beat inflation and grow purchasing power",
          `Potential ₹${Math.round(deployAmount * 0.1).toLocaleString("en-IN")} annual returns`,
          "Better goal alignment",
        ],
        risks: [
          "Market risk if equity markets correct",
          "May not be suitable for short-term needs",
        ],
        drawbacks: [
          "Reduces liquidity buffer",
          "Requires active monitoring",
        ],
        alternatives: [
          "Invest in liquid funds for better returns with high liquidity",
          "Use STP (Systematic Transfer Plan) to deploy gradually",
          "Park in short-term debt funds (7-9% returns)",
        ],
        priority: "high",
        confidence: 85,
        expectedImpact: {
          portfolioReturn: 3,
          riskChange: 5,
          diversificationChange: 10,
          timeline: "1-3 years",
        },
        action: {
          amount: Math.round(deployAmount),
          frequency: "one_time",
        },
      });
    }
    return recs;
  }

  private generateDiversificationRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { risk, holdings, allocation } = ctx;
    if (risk.diversificationScore < 40 && holdings.length > 0) {
      const assetTypes = new Set(holdings.map(h => h.assetType));
      const sectors = new Set(holdings.map(h => h.sector));
      const missing: string[] = [];
      if (!assetTypes.has("etf")) missing.push("ETFs");
      if (!assetTypes.has("gold") && !assetTypes.has("silver")) missing.push("Gold/Silver");
      if (assetTypes.size < 3) missing.push("Bonds");
      if (sectors.size < 3) missing.push("More sectors");
      recs.push({
        id: generateRecommendationId(),
        type: "diversify",
        title: "Improve Portfolio Diversification",
        description: `Diversification score is ${risk.diversificationScore}/100. Your portfolio lacks breadth.`,
        reason: "Concentrated portfolios face higher risk without proportional returns. Diversification reduces volatility by 20-30% while maintaining returns.",
        benefits: [
          "Reduced portfolio volatility",
          "Better risk-adjusted returns",
          "Protection against sector-specific downturns",
        ],
        risks: [
          "May slightly reduce returns in strong bull markets",
          "More holdings to track",
        ],
        drawbacks: [
          "Lower potential for outsized returns from single winners",
          "Additional transaction costs",
        ],
        alternatives: [
          "Use index funds/ETFs for instant diversification",
          "Focus on 3-4 asset classes minimum",
          "Add international exposure via global ETFs",
        ],
        priority: "high",
        confidence: 80,
        expectedImpact: {
          portfolioReturn: 1,
          riskChange: -15,
          diversificationChange: 25,
          timeline: "6-12 months",
        },
        action: {
          amount: 0,
          frequency: "monthly",
        },
      });
    }
    return recs;
  }

  private generateSIPRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { investorProfile, summary, goalAlignment } = ctx;
    if (!investorProfile) return recs;
    const currentSIP = summary.totalCurrentValue * 0.1;
    const idealSIP = investorProfile.monthlyIncome * 0.2;
    if (currentSIP < idealSIP * 0.7) {
      const increase = Math.round(idealSIP - currentSIP);
      recs.push({
        id: generateRecommendationId(),
        type: "increase_sip",
        title: "Increase Monthly SIP",
        description: `Current estimated SIP is ₹${Math.round(currentSIP).toLocaleString("en-IN")}/month. Recommended: ₹${Math.round(idealSIP).toLocaleString("en-IN")}/month.`,
        reason: `Savings rate of ${investorProfile.savingsRate}% can be improved. Increasing SIP by ₹${increase.toLocaleString("en-IN")}/month can significantly boost long-term wealth.`,
        benefits: [
          `Potential additional ₹${Math.round(increase * 12 * 0.12 * 10).toLocaleString("en-IN")} over 10 years`,
          "Power of compounding works better with higher amounts",
          "Better goal achievement probability",
        ],
        risks: [
          "Reduces current disposable income",
          "May be difficult to maintain during income dips",
        ],
        drawbacks: [
          "Less flexibility for discretionary spending",
          "Requires consistent income stream",
        ],
        alternatives: [
          "Start with smaller increase (₹1,000-2,000) and increase annually",
          "Use step-up SIP: increase by 10% each year",
          "Redirect windfalls (bonuses) to investments",
        ],
        priority: "medium",
        confidence: 75,
        expectedImpact: {
          portfolioReturn: 2,
          riskChange: 0,
          diversificationChange: 5,
          timeline: "5-15 years",
        },
        action: {
          amount: increase,
          frequency: "monthly",
          sipAmount: Math.round(idealSIP),
        },
      });
    }
    return recs;
  }

  private generateGoalRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { goalAlignment, summary } = ctx;
    for (const goal of goalAlignment) {
      if (!goal.onTrack && goal.monthlyNeeded && goal.monthlyNeeded > 0) {
        recs.push({
          id: generateRecommendationId(),
          type: "increase_sip",
          title: `Boost Investment for "${goal.goalName}"`,
          description: `"${goal.goalName}" is ${goal.percentComplete.toFixed(0)}% complete. Need ₹${goal.monthlyNeeded.toLocaleString("en-IN")}/month more.`,
          reason: `At current pace, you'll reach only ${goal.percentComplete.toFixed(0)}% of the target. ₹${goal.monthlyNeeded.toLocaleString("en-IN")}/month additional investment is needed.`,
          benefits: [
            `Reach ₹${goal.targetAmount.toLocaleString("en-IN")} target`,
            `${goal.monthsToGoal ? `${goal.monthsToGoal} months` : "目标期限"} timeline maintained`,
            "Financial security for this goal",
          ],
          risks: [
            "Higher monthly commitment",
            "May affect other financial plans",
          ],
          drawbacks: [
            "Reduced flexibility for other investments",
            "May need to delay if income drops",
          ],
          alternatives: [
            "Extend timeline to reduce monthly requirement",
            "Split goal into smaller milestones",
            "Consider lump sum investment from bonuses",
          ],
          priority: goal.percentComplete < 30 ? "high" : "medium",
          confidence: 70,
          expectedImpact: {
            portfolioReturn: 0,
            riskChange: 0,
            diversificationChange: 5,
            timeline: `${goal.monthsToGoal || "未知"} months`,
          },
          action: {
            amount: goal.monthlyNeeded,
            frequency: "monthly",
          },
          metadata: {
            goalName: goal.goalName,
            targetAmount: goal.targetAmount,
            currentProgress: goal.percentComplete,
          },
        });
      }
    }
    return recs;
  }

  private generateConcentrationRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { risk, holdings, summary } = ctx;
    if (risk.largestPositionPercent > 30 && holdings.length > 0) {
      const topHolding = [...holdings].sort((a, b) => b.weight - a.weight)[0];
      const excessPercent = risk.largestPositionPercent - 20;
      const excessValue = Math.round((excessPercent / 100) * summary.totalCurrentValue);
      recs.push({
        id: generateRecommendationId(),
        type: "rebalance",
        title: `Reduce ${topHolding.symbol} Concentration`,
        description: `${topHolding.symbol} is ${risk.largestPositionPercent.toFixed(1)}% of portfolio (recommended: max 20%).`,
        reason: "Single-stock risk is uncompensated. A 20% drop in this holding would significantly impact your portfolio.",
        benefits: [
          "Reduced single-company risk",
          "More balanced portfolio",
          "Protection against adverse events",
        ],
        risks: [
          "May miss out on future upside of this stock",
          "Tax implications of selling",
        ],
        drawbacks: [
          "Transaction costs",
          "May need to find alternative investments",
        ],
        alternatives: [
          "Gradually reduce via STP over 3-6 months",
          "Use covered calls for income while reducing exposure",
          "Redirect to sector peers for maintained exposure",
        ],
        priority: "high",
        confidence: 80,
        expectedImpact: {
          portfolioReturn: 0,
          riskChange: -10,
          diversificationChange: 15,
          timeline: "1-3 months",
        },
        action: {
          amount: excessValue,
          frequency: "one_time",
        },
      });
    }
    return recs;
  }

  private generateRiskRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { risk, investorProfile } = ctx;
    if (!investorProfile) return recs;
    if (risk.riskAlignment === "aggressive" && ["very_conservative", "conservative"].includes(investorProfile.riskAppetite)) {
      recs.push({
        id: generateRecommendationId(),
        type: "rebalance",
        title: "Reduce Portfolio Risk",
        description: `Your portfolio risk (${risk.portfolioRiskScore}/100) is too high for your ${investorProfile.riskAppetite} profile.`,
        reason: "Portfolio risk significantly exceeds your stated comfort level. Market corrections could cause distress.",
        benefits: [
          "Better sleep during market volatility",
          "Aligned with risk tolerance",
          "Steadier returns",
        ],
        risks: [
          "Lower long-term return potential",
          "May underperform in bull markets",
        ],
        drawbacks: [
          "Reduced growth potential",
          "May need to work longer to reach goals",
        ],
        alternatives: [
          "Gradually rebalance over 6-12 months",
          "Maintain core equity but add hedging via gold/bonds",
          "Shift 20% from equity to debt/gold",
        ],
        priority: "high",
        confidence: 85,
        expectedImpact: {
          portfolioReturn: -2,
          riskChange: -20,
          diversificationChange: 10,
          timeline: "3-6 months",
        },
        action: {
          amount: 0,
          frequency: "one_time",
        },
      });
    }
    if (risk.riskAlignment === "conservative" && ["aggressive", "very_aggressive"].includes(investorProfile.riskAppetite)) {
      recs.push({
        id: generateRecommendationId(),
        type: "increase_sip",
        title: "Increase Equity Allocation",
        description: `Your portfolio is more conservative than your ${investorProfile.riskAppetite} profile allows.`,
        reason: "Being too conservative may result in insufficient long-term growth. You have the risk capacity for higher equity.",
        benefits: [
          "Higher long-term expected returns",
          "Better compounding over time",
          "Aligned with growth objectives",
        ],
        risks: [
          "Higher short-term volatility",
          "May cause anxiety during corrections",
        ],
        drawbacks: [
          "Larger drawdowns possible",
          "Requires emotional discipline",
        ],
        alternatives: [
          "Increase equity SIP gradually by 10% quarterly",
          "Add mid/small-cap allocation for growth",
          "Use Nifty 50 index fund for low-risk equity exposure",
        ],
        priority: "medium",
        confidence: 70,
        expectedImpact: {
          portfolioReturn: 3,
          riskChange: 15,
          diversificationChange: 5,
          timeline: "3-5 years",
        },
        action: {
          amount: 0,
          frequency: "monthly",
        },
      });
    }
    return recs;
  }

  private generatePerformanceRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { performance } = ctx;
    if (performance.worstPerforming && performance.worstPerforming.unrealizedPnLPercent < -20) {
      const worst = performance.worstPerforming;
      recs.push({
        id: generateRecommendationId(),
        type: "review_later",
        title: `Review ${worst.symbol} Position`,
        description: `${worst.symbol} is down ${worst.unrealizedPnLPercent.toFixed(1)}% (${worst.unrealizedPnL < 0 ? "-" : ""}₹${Math.abs(worst.unrealizedPnL).toLocaleString("en-IN")}).`,
        reason: "Significant unrealized loss requires review. Decision: hold for recovery, average down, or exit.",
        benefits: [
          "May recover if fundamentals are intact",
          "Averaging down reduces average cost",
          "Avoids locking in losses",
        ],
        risks: [
          "Further downside possible",
          "Fundamentals may have deteriorated",
            "Opportunity cost of stuck capital",
          ],
          drawbacks: [
            "Holding losers is psychologically difficult",
            "Capital could be deployed better elsewhere",
          ],
          alternatives: [
            "Exit if fundamentals have weakened",
            "Average down if conviction is high",
            "Set stop-loss to limit further downside",
          ],
          priority: "medium",
          confidence: 60,
          expectedImpact: {
            portfolioReturn: 0,
            riskChange: 0,
            diversificationChange: 0,
            timeline: "1-6 months",
          },
          metadata: {
            symbol: worst.symbol,
            lossPercent: worst.unrealizedPnLPercent,
            lossAmount: worst.unrealizedPnL,
          },
        });
    }
    return recs;
  }

  private generateEmergencyFundRecommendations(ctx: RecommendationContext): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    const { investorProfile, summary } = ctx;
    if (!investorProfile) return recs;
    const monthlyExpenses = investorProfile.monthlyIncome * (1 - investorProfile.savingsRate / 100);
    const emergencyTarget = monthlyExpenses * 6;
    const currentEmergency = summary.cashBalance;
    if (currentEmergency < emergencyTarget * 0.5) {
      const needed = Math.round(emergencyTarget - currentEmergency);
      recs.push({
        id: generateRecommendationId(),
        type: "build_emergency_fund",
        title: "Build Emergency Fund",
        description: `Emergency fund: ₹${currentEmergency.toLocaleString("en-IN")} (target: ₹${Math.round(emergencyTarget).toLocaleString("en-IN")} = 6 months expenses).`,
        reason: "Without adequate emergency fund, you may be forced to sell investments at a loss during emergencies.",
        benefits: [
          "Financial safety net for unexpected events",
          "Peace of mind",
          "Avoid forced selling of investments",
        ],
        risks: [
          "Reduces investment capital temporarily",
          "Low returns on emergency fund",
        ],
        drawbacks: [
          "Opportunity cost of uninvested capital",
          "May take 6-12 months to build",
        ],
        alternatives: [
          "Start with 3 months, build to 6 months",
          "Keep in liquid funds (6-7% returns)",
          "Use sweep-in FD for better returns",
        ],
        priority: "high",
        confidence: 90,
        expectedImpact: {
          portfolioReturn: -1,
          riskChange: -20,
          diversificationChange: 0,
          timeline: "6-12 months",
        },
        action: {
          amount: Math.round(needed / 12),
          frequency: "monthly",
        },
      });
    }
    return recs;
  }

  private deduplicateAndSort(recs: InvestmentRecommendation[]): InvestmentRecommendation[] {
    const seen = new Set<string>();
    const unique = recs.filter(r => {
      const key = `${r.type}_${r.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return unique.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.confidence - a.confidence;
    });
  }

  formatRecommendations(recs: InvestmentRecommendation[]): string {
    if (recs.length === 0) return "No specific recommendations at this time.";
    const lines: string[] = [];
    lines.push(`## Investment Recommendations (${recs.length} items)\n`);
    for (const rec of recs.slice(0, 8)) {
      const priorityIcon = rec.priority === "high" ? "🔴" : rec.priority === "medium" ? "🟡" : "🟢";
      lines.push(`### ${priorityIcon} ${rec.title}`);
      lines.push(`**Type:** ${rec.type.replace(/_/g, " ").toUpperCase()}`);
      lines.push(`**Priority:** ${rec.priority.toUpperCase()} | **Confidence:** ${rec.confidence}%`);
      lines.push(`**Reason:** ${rec.reason}`);
      lines.push(`**Benefits:** ${rec.benefits[0] || "N/A"}`);
      lines.push(`**Key Risk:** ${rec.risks[0] || "N/A"}`);
      if (rec.action?.amount) {
        lines.push(`**Action:** ₹${rec.action.amount.toLocaleString("en-IN")}${rec.action.frequency === "monthly" ? "/month" : ""}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
}

export const investmentRecommendationService = new InvestmentRecommendationService();
