export const emergencyPlannerService = {
  generate(input: {
    scenario: string;
    monthlyExpenses: number;
    currentSavings: number;
    dependents?: number;
    income?: number;
  }) {
    const monthsCovered = input.currentSavings / input.monthlyExpenses;
    const targetFund = input.monthlyExpenses * 6;
    const gap = Math.max(0, targetFund - input.currentSavings);
    const monthlyContribution = Math.ceil(gap / 12);

    const scenarioPlans: Record<string, string[]> = {
      "job loss": [
        "Activate emergency fund immediately",
        "Cut discretionary spending by 40%",
        "Apply for unemployment benefits if applicable",
        "Reach out to network for opportunities",
        "Consider freelancing or gig work",
      ],
      "medical emergency": [
        "Use health insurance first",
        "Negotiate hospital bills",
        "Tap emergency fund for deductibles",
        "Avoid high-interest medical loans",
      ],
      default: [
        "Assess immediate financial impact",
        "Prioritize essential expenses only",
        "Contact creditors for payment deferrals",
        "Use emergency fund strategically",
        "Document all expenses for insurance claims",
      ],
    };

    const scenarioKey = Object.keys(scenarioPlans).find((k) =>
      input.scenario.toLowerCase().includes(k),
    ) ?? "default";

    return {
      scenario: input.scenario,
      currentStatus: {
        monthsCovered: Math.round(monthsCovered * 10) / 10,
        targetFund,
        gap,
        status: monthsCovered >= 6 ? "Adequate" : monthsCovered >= 3 ? "Moderate" : "Critical",
      },
      actionPlan: scenarioPlans[scenarioKey],
      monthlyContribution,
      timeline: `${Math.ceil(gap / monthlyContribution)} months to reach target fund`,
      tips: [
        "Keep emergency fund in liquid instruments (savings account, liquid MF)",
        "Do not invest emergency fund in equity",
        input.dependents ? `Factor in ${input.dependents} dependent(s) for higher target` : "Review fund size annually",
      ],
    };
  },
};
