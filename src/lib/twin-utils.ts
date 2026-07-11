import type { RiskAppetite } from "@/generated/prisma/enums";

export interface TwinSnapshot {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  debt: number;
  netWorth: number;
  savingsRate: number;
}

export interface TwinProjections {
  oneYear: number;
  threeYear: number;
  fiveYear: number;
  tenYear: number;
}

const GROWTH_RATES: Record<RiskAppetite, number> = {
  VERY_CONSERVATIVE: 0.05,
  CONSERVATIVE: 0.07,
  MODERATE: 0.1,
  GROWTH: 0.12,
  AGGRESSIVE: 0.15,
};

export function computeProjections(
  netWorth: number,
  riskAppetite: RiskAppetite = "MODERATE",
): TwinProjections {
  const rate = GROWTH_RATES[riskAppetite];
  return {
    oneYear: Math.round(netWorth * (1 + rate)),
    threeYear: Math.round(netWorth * Math.pow(1 + rate, 3)),
    fiveYear: Math.round(netWorth * Math.pow(1 + rate, 5)),
    tenYear: Math.round(netWorth * Math.pow(1 + rate, 10)),
  };
}

export function scenarioProjection(
  netWorth: number,
  extraMonthlySavings: number,
  years: number,
  riskAppetite: RiskAppetite = "MODERATE",
): number {
  const rate = GROWTH_RATES[riskAppetite];
  const annualExtra = extraMonthlySavings * 12;
  let value = netWorth;
  for (let y = 0; y < years; y++) {
    value = value * (1 + rate) + annualExtra;
  }
  return Math.round(value);
}

export const RISK_APPETITE_OPTIONS: { value: RiskAppetite; label: string; desc: string }[] = [
  { value: "VERY_CONSERVATIVE", label: "Very Conservative", desc: "5% annual growth" },
  { value: "CONSERVATIVE", label: "Conservative", desc: "7% annual growth" },
  { value: "MODERATE", label: "Balanced", desc: "10% annual growth" },
  { value: "GROWTH", label: "Growth", desc: "12% annual growth" },
  { value: "AGGRESSIVE", label: "Aggressive", desc: "15% annual growth" },
];
