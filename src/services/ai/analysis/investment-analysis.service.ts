import type { FinancialContext, InvestmentAnalysis, Recommendation } from "./types";

export function analyzeInvestments(ctx: FinancialContext): InvestmentAnalysis {
  const { portfolio, profile } = ctx;
  const riskAppetite = profile?.riskAppetite ?? "MODERATE";

  if (!portfolio) {
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
          action: "Start building an investment portfolio",
          reason: "No portfolio found. Investing is essential for long-term wealth creation.",
          impact: "Potential for wealth growth above inflation",
          effort: "medium",
        },
      ],
    };
  }

  const { totalValue, cashBalance, invested, allocation, topHoldings } = portfolio;
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
      category: "investment",
      action: "Deploy excess cash into investments",
      reason: `${cashPercent}% of portfolio is in cash, losing value to inflation.`,
      impact: "Potential for 8-12% annual returns vs 3-4% inflation erosion",
      effort: "medium",
    });
  }

  if (diversification === "poor") {
    recommendations.push({
      priority: 3,
      category: "investment",
      action: "Diversify portfolio with at least 3-5 different holdings",
      reason: "Concentrated portfolio increases risk.",
      impact: "Reduces single-asset risk",
      effort: "medium",
    });
  }

  if (riskAlignment !== "aligned") {
    const direction = riskAlignment === "conservative" ? "more aggressive" : "more conservative";
    recommendations.push({
      priority: 3,
      category: "investment",
      action: `Adjust portfolio to be ${direction} (align with ${riskAppetite} risk appetite)`,
      reason: `Current allocation doesn't match your ${riskAppetite} risk profile.`,
      impact: "Better risk-adjusted returns",
      effort: "medium",
    });
  }

  if (totalValue < 50000) {
    recommendations.push({
      priority: 4,
      category: "investment",
      action: "Consider SIPs for systematic wealth building",
      reason: "Small portfolio benefits most from regular investing.",
      impact: "Rupee cost averaging reduces timing risk",
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
