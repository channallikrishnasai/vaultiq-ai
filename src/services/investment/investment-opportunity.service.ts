import type {
  InvestmentOpportunity,
  InvestorProfile,
  OpportunityType,
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
import { generateOpportunityId } from "./investment-utils";

interface OpportunityContext {
  holdings: Holding[];
  risk: RiskMetrics;
  summary: PortfolioSummary;
  goalAlignment: GoalAlignment[];
  performance: PerformanceMetrics;
  allocation: PortfolioAllocation;
  investorProfile?: InvestorProfile;
}

const SECTOR_BENCHMARKS: Record<string, number> = {
  Technology: 25,
  Finance: 20,
  Healthcare: 10,
  Consumer: 15,
  Energy: 10,
  Manufacturing: 10,
  "Real Estate": 5,
  Telecom: 5,
  Utilities: 5,
  "New Age": 5,
};

class InvestmentOpportunityService {
  detectOpportunities(ctx: OpportunityContext): InvestmentOpportunity[] {
    const opps: InvestmentOpportunity[] = [];
    opps.push(...this.detectSectorGaps(ctx));
    opps.push(...this.detectCashDeployment(ctx));
    opps.push(...this.detectGoalGaps(ctx));
    opps.push(...this.detectSIPBoostOpportunity(ctx));
    opps.push(...this.detectRebalancingOpportunity(ctx));
    opps.push(...this.detectUndervaluedHoldings(ctx));
    return opps;
  }

  private detectSectorGaps(ctx: OpportunityContext): InvestmentOpportunity[] {
    const opps: InvestmentOpportunity[] = [];
    const { allocation } = ctx;
    const sectorAllocation = allocation.bySector;
    if (!sectorAllocation || sectorAllocation.length === 0) return opps;
    const sectorMap = new Map<string, number>();
    for (const item of sectorAllocation) {
      sectorMap.set(item.name, item.percent);
    }
    const underweightSectors: string[] = [];
    for (const [sector, benchmark] of Object.entries(SECTOR_BENCHMARKS)) {
      const current = sectorMap.get(sector) || 0;
      if (current < benchmark * 0.5) {
        underweightSectors.push(sector);
      }
    }
    if (underweightSectors.length > 0) {
      opps.push({
        id: generateOpportunityId(),
        type: "sector_gap",
        title: `Underweight Sectors: ${underweightSectors.join(", ")}`,
        description: `${underweightSectors.length} sector(s) are significantly underweight compared to benchmarks.`,
        potential: 8,
        risk: 4,
        timeframe: "6-12 months",
        expectedReturn: 12,
        confidence: 65,
        sectors: underweightSectors,
        action: `Consider adding investments in ${underweightSectors.join(", ")} sectors.`,
        details: `Current allocation missing in: ${underweightSectors.map(s => {
          const current = sectorMap.get(s) || 0;
          return `${s} (${current.toFixed(1)}% vs benchmark ${SECTOR_BENCHMARKS[s]}%)`;
        }).join("; ")}.`,
      });
    }
    return opps;
  }

  private detectCashDeployment(ctx: OpportunityContext): InvestmentOpportunity[] {
    const opps: InvestmentOpportunity[] = [];
    const { summary, investorProfile } = ctx;
    if (summary.totalCurrentValue <= 0) return opps;
    const cashPercent = (summary.cashBalance / summary.totalCurrentValue) * 100;
    if (cashPercent > 15) {
      const riskAppetite = investorProfile?.riskAppetite || "moderate";
      const expectedReturns: Record<string, number> = {
        very_conservative: 7,
        conservative: 9,
        moderate: 12,
        aggressive: 15,
        very_aggressive: 18,
      };
      const expectedReturn = expectedReturns[riskAppetite] || 12;
      const deployAmount = summary.cashBalance * 0.4;
      const potentialReturn = deployAmount * (expectedReturn / 100);
      opps.push({
        id: generateOpportunityId(),
        type: "cash_deployment",
        title: "Deploy Idle Cash for Returns",
        description: `₹${summary.cashBalance.toLocaleString("en-IN")} (${cashPercent.toFixed(1)}%) is earning minimal returns.`,
        potential: 7,
        risk: 3,
        timeframe: "1-3 years",
        expectedReturn: expectedReturn,
        confidence: 80,
        action: `Deploy ₹${deployAmount.toLocaleString("en-IN")} into diversified investments.`,
        details: `Expected annual return: ₹${Math.round(potentialReturn).toLocaleString("en-IN")} at ${expectedReturn}% for ${riskAppetite} profile.`,
      });
    }
    return opps;
  }

  private detectGoalGaps(ctx: OpportunityContext): InvestmentOpportunity[] {
    const opps: InvestmentOpportunity[] = [];
    const { goalAlignment } = ctx;
    const offTrackGoals = goalAlignment.filter(g => !g.onTrack);
    if (offTrackGoals.length > 0) {
      for (const goal of offTrackGoals) {
        if (goal.monthlyNeeded && goal.monthlyNeeded > 0) {
          opps.push({
            id: generateOpportunityId(),
            type: "goal_realignment",
            title: `Close Gap for "${goal.goalName}"`,
            description: `"${goal.goalName}" needs ₹${goal.monthlyNeeded.toLocaleString("en-IN")}/month to stay on track.`,
            potential: 8,
            risk: 2,
            timeframe: `${goal.monthsToGoal || "TBD"} months`,
            expectedReturn: 10,
            confidence: 75,
            action: `Increase monthly SIP by ₹${goal.monthlyNeeded.toLocaleString("en-IN")}.`,
            details: `Current: ${goal.percentComplete.toFixed(0)}% complete. Target: ₹${goal.targetAmount.toLocaleString("en-IN")}.`,
          });
        }
      }
    }
    return opps;
  }

  private detectSIPBoostOpportunity(ctx: OpportunityContext): InvestmentOpportunity[] {
    const opps: InvestmentOpportunity[] = [];
    const { investorProfile, summary } = ctx;
    if (!investorProfile) return opps;
    const currentInvestmentRate = summary.totalCurrentValue > 0
      ? (summary.totalPnLPercent > 0 ? 15 : 10)
      : 10;
    const idealRate = Math.min(investorProfile.savingsRate + 5, 40);
    if (currentInvestmentRate < idealRate) {
      const monthlyBoost = Math.round(
        (investorProfile.monthlyIncome * (idealRate - currentInvestmentRate)) / 100
      );
      if (monthlyBoost > 1000) {
        opps.push({
          id: generateOpportunityId(),
          type: "sip_boost",
          title: "Step-Up Your SIP",
          description: `Increase monthly investment by ₹${monthlyBoost.toLocaleString("en-IN")} to boost long-term wealth.`,
          potential: 7,
          risk: 3,
          timeframe: "5-15 years",
          expectedReturn: 12,
          confidence: 70,
          action: `Add ₹${monthlyBoost.toLocaleString("en-IN")}/month to SIPs.`,
          details: `Power of compounding: ₹${monthlyBoost.toLocaleString("en-IN")}/month at 12% = ₹${Math.round(monthlyBoost * ((Math.pow(1.01, 180) - 1) / 0.01)).toLocaleString("en-IN")} in 15 years.`,
        });
      }
    }
    return opps;
  }

  private detectRebalancingOpportunity(ctx: OpportunityContext): InvestmentOpportunity[] {
    const opps: InvestmentOpportunity[] = [];
    const { risk, allocation } = ctx;
    if (risk.sectorConcentration > 40) {
      const sectorAlloc = allocation.bySector;
      if (sectorAlloc && sectorAlloc.length > 0) {
        const topSector = [...sectorAlloc].sort((a, b) => b.percent - a.percent)[0];
        opps.push({
          id: generateOpportunityId(),
          type: "rebalancing",
          title: `Rebalance from ${topSector.name}`,
          description: `${topSector.name} is ${topSector.percent.toFixed(1)}% of portfolio. Consider trimming.`,
          potential: 6,
          risk: 3,
          timeframe: "1-3 months",
          expectedReturn: 10,
          confidence: 65,
          sectors: [topSector.name],
          action: `Reduce ${topSector.name} by ~${(topSector.percent - 25).toFixed(0)}% and redistribute.`,
          details: `Overconcentration in one sector increases vulnerability to sector-specific downturns.`,
        });
      }
    }
    const assetAlloc = allocation.byAssetClass;
    if (assetAlloc && assetAlloc.length > 0) {
      const hasGold = assetAlloc.some(a => a.name === "gold" || a.name === "silver");
      if (!hasGold) {
        opps.push({
          id: generateOpportunityId(),
          type: "sector_gap",
          title: "Add Gold/Silver Allocation",
          description: "No precious metals in portfolio. Gold provides inflation hedge and crisis protection.",
          potential: 5,
          risk: 2,
          timeframe: "1-5 years",
          expectedReturn: 8,
          confidence: 60,
          action: "Allocate 5-10% to gold (Gold ETF or SGB).",
          details: "Gold has negative correlation with equities, providing portfolio stability during market downturns.",
        });
      }
    }
    return opps;
  }

  private detectUndervaluedHoldings(ctx: OpportunityContext): InvestmentOpportunity[] {
    const opps: InvestmentOpportunity[] = [];
    const { holdings, performance } = ctx;
    for (const holding of holdings) {
      if (holding.dayChangePercent < -3 && holding.unrealizedPnLPercent > 0) {
        opps.push({
          id: generateOpportunityId(),
          type: "undervalued_stock",
          title: `${holding.symbol} Down ${holding.dayChangePercent.toFixed(1)}% Today`,
          description: `${holding.symbol} dropped ${holding.dayChangePercent.toFixed(1)}% today but still in profit. Potential averaging opportunity.`,
          potential: 6,
          risk: 5,
          timeframe: "1-6 months",
          expectedReturn: 15,
          confidence: 55,
          symbols: [holding.symbol],
          action: `Consider averaging ${holding.symbol} if fundamentals are intact.`,
          details: `Current price: ₹${holding.currentPrice.toLocaleString("en-IN")}. Your average cost: ₹${holding.averageCost.toLocaleString("en-IN")}. Day change: ${holding.dayChangePercent.toFixed(1)}%.`,
        });
      }
    }
    return opps;
  }

  formatOpportunities(opps: InvestmentOpportunity[]): string {
    if (opps.length === 0) return "No specific opportunities detected at this time.";
    const lines: string[] = [];
    lines.push(`## Investment Opportunities (${opps.length} items)\n`);
    for (const opp of opps.slice(0, 6)) {
      lines.push(`### ${opp.title}`);
      lines.push(`**Type:** ${opp.type.replace(/_/g, " ").toUpperCase()}`);
      lines.push(`**Potential:** ${opp.potential}/10 | **Risk:** ${opp.risk}/10 | **Confidence:** ${opp.confidence}%`);
      lines.push(`**Timeframe:** ${opp.timeframe}`);
      lines.push(`**Expected Return:** ${opp.expectedReturn}%`);
      lines.push(`**Action:** ${opp.action}`);
      lines.push(`**Details:** ${opp.details}`);
      lines.push("");
    }
    return lines.join("\n");
  }
}

export const investmentOpportunityService = new InvestmentOpportunityService();
