import type { RiskAppetite } from "@/generated/prisma/enums";

export const roadmapGeneratorService = {
  generate(input: {
    age: number;
    income: number;
    savings: number;
    goals: string[];
    riskAppetite: RiskAppetite;
    timeHorizonYears: number;
  }) {
    const monthlyIncome = input.income / 12;
    const emergencyTarget = monthlyIncome * 6;
    const allocation =
      input.riskAppetite === "CONSERVATIVE"
        ? { equity: 30, debt: 50, gold: 10, cash: 10 }
        : input.riskAppetite === "MODERATE"
          ? { equity: 50, debt: 30, gold: 10, cash: 10 }
          : { equity: 70, debt: 15, gold: 10, cash: 5 };

    const milestones = [
      {
        phase: "Foundation (0-6 months)",
        actions: [
          "Build emergency fund of ₹" + Math.round(emergencyTarget).toLocaleString("en-IN"),
          "Get term insurance (10x annual income)",
          "Start tracking all expenses",
        ],
      },
      {
        phase: "Growth (6-24 months)",
        actions: [
          `Start SIP of ₹${Math.round(monthlyIncome * 0.2).toLocaleString("en-IN")}/month in index funds`,
          "Maximize Section 80C deductions",
          "Clear high-interest debt first",
        ],
      },
      {
        phase: "Wealth Building (2-5 years)",
        actions: input.goals.map((g) => `Progress toward: ${g}`),
      },
      {
        phase: `Long-term (${input.timeHorizonYears} years)`,
        actions: [
          `Target corpus: ₹${Math.round(input.savings * Math.pow(1.12, input.timeHorizonYears)).toLocaleString("en-IN")} (12% CAGR assumed)`,
          "Review and rebalance portfolio annually",
          "Increase SIP by 10% each year",
        ],
      },
    ];

    return {
      summary: `Personalized ${input.timeHorizonYears}-year roadmap for age ${input.age} with ${input.riskAppetite.toLowerCase()} risk profile.`,
      allocation,
      milestones,
      monthlyBudget: {
        needs: Math.round(monthlyIncome * 0.5),
        wants: Math.round(monthlyIncome * 0.3),
        savings: Math.round(monthlyIncome * 0.2),
      },
      projectedWealth: Math.round(input.savings * Math.pow(1.12, input.timeHorizonYears)),
    };
  },
};
