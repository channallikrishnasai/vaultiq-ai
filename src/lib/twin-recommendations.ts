import type { RiskAppetite } from "@/generated/prisma/enums";

export interface TwinRecommendationContext {
  savingsRate: number;
  debt: number;
  savings: number;
  investments: number;
  monthlyExpenses: number;
  emergencyFundCurrent: number;
  emergencyFundTarget: number;
  goalProgress: { name: string; percent: number; remaining: number }[];
  riskAppetite: RiskAppetite;
}

export function generateTwinRecommendations(ctx: TwinRecommendationContext): string[] {
  const recs: string[] = [];

  const emergencyMonths =
    ctx.monthlyExpenses > 0 ? ctx.emergencyFundCurrent / ctx.monthlyExpenses : 0;

  if (emergencyMonths < 6) {
    recs.push(
      `Increase emergency fund to 6 months of expenses (currently ${emergencyMonths.toFixed(1)} months covered)`,
    );
  }

  if (ctx.savingsRate < 30) {
    recs.push(
      `Reduce discretionary spending by 10% to improve savings rate from ${ctx.savingsRate}% toward 40%`,
    );
  } else if (ctx.savingsRate >= 30) {
    recs.push(
      `Maintain your ${ctx.savingsRate}% savings rate — consider automating transfers on payday`,
    );
  }

  const tripGoal = ctx.goalProgress.find((g) =>
    g.name.toLowerCase().includes("europe") || g.name.toLowerCase().includes("trip"),
  );
  if (tripGoal && tripGoal.percent < 50) {
    recs.push(
      `Start a SIP of ₹5,000/month to reach your ${tripGoal.name} goal faster (₹${tripGoal.remaining.toLocaleString("en-IN")} remaining)`,
    );
  }

  if (ctx.debt > ctx.savings * 0.2) {
    recs.push("Allocate 15% of monthly surplus toward debt repayment before new investments");
  }

  if (ctx.investments > 0 && ctx.riskAppetite === "MODERATE") {
    recs.push("Rebalance portfolio if equity allocation exceeds 70% of total investments");
  }

  if (ctx.investments < ctx.monthlyExpenses * 3) {
    recs.push("Begin a ₹3,000/month equity SIP to grow investments beyond cash savings");
  }

  const laptopGoal = ctx.goalProgress.find((g) => g.name.toLowerCase().includes("laptop"));
  if (laptopGoal && laptopGoal.percent >= 25 && laptopGoal.percent < 75) {
    recs.push(
      `You're ${laptopGoal.percent}% toward your Laptop goal — redirect ₹2,000/month from entertainment to accelerate`,
    );
  }

  return recs.slice(0, 5);
}
