import type { RiskAppetite } from "@/generated/prisma/enums";
import { healthScoreService } from "@/services/finance/health-score.service";

export const financialTwinService = {
  async generate(userId: string, data: {
    name?: string;
    riskAppetite?: RiskAppetite;
    snapshot?: {
      income: number;
      expenses: number;
      savings: number;
      investments: number;
      debt: number;
    };
  }) {
    const health = await healthScoreService.calculate(userId);
    const snapshot = data.snapshot ?? {
      income: 600000,
      expenses: 350000,
      savings: 150000,
      investments: 200000,
      debt: 50000,
    };

    const netWorth = snapshot.savings + snapshot.investments - snapshot.debt;
    const savingsRate = snapshot.income > 0
      ? (snapshot.income - snapshot.expenses) / snapshot.income
      : 0;

    const projections = {
      oneYear: Math.round(netWorth * 1.08),
      threeYear: Math.round(netWorth * Math.pow(1.1, 3)),
      fiveYear: Math.round(netWorth * Math.pow(1.12, 5)),
      tenYear: Math.round(netWorth * Math.pow(1.12, 10)),
    };

    const recommendations = [
      savingsRate < 0.2 ? "Increase savings rate to at least 20%" : "Maintain current savings discipline",
      snapshot.debt > snapshot.savings ? "Prioritize debt reduction" : "Debt levels are manageable",
      health.score < 60 ? "Focus on building emergency fund" : "Consider increasing equity allocation",
      "Review and rebalance portfolio quarterly",
    ];

    return {
      name: data.name ?? "My Financial Twin",
      healthScore: health.score,
      riskAppetite: data.riskAppetite ?? "MODERATE",
      snapshot: { ...snapshot, netWorth, savingsRate: Math.round(savingsRate * 100) },
      projections,
      recommendations,
      twinSummary: `Net worth: ₹${netWorth.toLocaleString("en-IN")} | Health: ${health.grade} (${health.score}/100) | Savings rate: ${Math.round(savingsRate * 100)}%`,
    };
  },
};
