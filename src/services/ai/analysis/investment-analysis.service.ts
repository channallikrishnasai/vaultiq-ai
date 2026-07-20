import type { FinancialContext, InvestmentAnalysis, Recommendation } from "./types";

export function analyzeInvestments(ctx: FinancialContext): InvestmentAnalysis {
  const { virtualPortfolio, profile } = ctx;
  const riskAppetite = profile?.riskAppetite ?? "MODERATE";

  if (!virtualPortfolio) {
    return {
      hasPortfolio: false,
      totalValue: 0,
      cashBalance: 0,
      investedAmount: 0,
      allocation: [],
      diversification: "poor",
      riskAlignment: "conservative",
      topHoldings: [],
      recommendations: [
        {
          priority: 2,
          category: "investment",
          action: "Start building a Virtual Trading Portfolio",
          reason: "No virtual portfolio found. The Virtual Trading Lab is for practicing investment strategies with simulated money.",
          impact: "Practice investment strategies without real risk",
          effort: "low",
        },
      ],
    };
  }

  const { totalValue, cashBalance, invested, allocation, topHoldings } = virtualPortfolio;
  const totalHoldings = topHoldings.length;
  const equityPercent = allocation.find((a) => a.name === "Equity")?.percent ?? 0;
  const cashPercent = allocation.find((a) => a.name === "Cash")?.percent ?? 100;

  let diversification: InvestmentAnalysis["diversification"];
  if (totalHoldings >= 5 && equityPercent > 30) diversification = "excellent";
  else if (totalHoldings >= 3 && equityPercent > 20) diversification = "good";
  else if (totalHoldings >= 2) diversification = "moderate";
  else diversification = "poor";

  let riskAlignment: InvestmentAnalysis["riskAlignment"];
  const conservativeThresholds: Record<string, number> = { CONSERVATIVE: 30, MODERATE: 60, AGGRESSIVE: 80 };
  const threshold = conservativeThresholds[riskAppetite] ?? 60;
  if (equityPercent < threshold - 10) riskAlignment = "conservative";
  else if (equityPercent > threshold + 10) riskAlignment = "aggressive";
  else riskAlignment = "aligned";

  const topHoldingsWithPercent = topHoldings.map((h) => ({
    ...h,
    percent: totalValue > 0 ? Math.round((h.value / totalValue) * 100) : 0,
  }));

  const recommendations: Recommendation[] = [];

  if (cashPercent > 50) {
    recommendations.push({
      priority: 2,
      category: "virtual_investment",
      action: "Deploy excess virtual cash into simulated investments",
      reason: `${cashPercent}% of your virtual portfolio is in cash, losing value to inflation. This is simulated practice.`,
      impact: "Practice deploying capital in the Virtual Trading Lab",
      effort: "low",
    });
  }

  if (diversification === "poor") {
    recommendations.push({
      priority: 3,
      category: "virtual_investment",
      action: "Diversify virtual portfolio with at least 3-5 different holdings",
      reason: "Concentrated virtual portfolio increases risk. Practice diversification strategies.",
      impact: "Learn risk management through virtual trading",
      effort: "low",
    });
  }

  if (riskAlignment !== "aligned") {
    const direction = riskAlignment === "conservative" ? "more aggressive" : "more conservative";
    recommendations.push({
      priority: 3,
      category: "virtual_investment",
      action: `Adjust virtual portfolio to be ${direction} (align with ${riskAppetite} risk appetite)`,
      reason: `Current virtual allocation doesn't match your ${riskAppetite} risk profile. Practice risk-adjusted investing.`,
      impact: "Learn portfolio rebalancing strategies",
      effort: "low",
    });
  }

  if (totalValue < 50000) {
    recommendations.push({
      priority: 4,
      category: "virtual_investment",
      action: "Practice systematic investing with virtual SIPs",
      reason: "Small virtual portfolio benefits from regular investing practice.",
      impact: "Learn rupee cost averaging strategies",
      effort: "low",
    });
  }

  return {
    hasPortfolio: true,
    totalValue,
    cashBalance,
    investedAmount: invested,
    allocation,
    diversification,
    riskAlignment,
    topHoldings: topHoldingsWithPercent,
    recommendations,
  };
}
