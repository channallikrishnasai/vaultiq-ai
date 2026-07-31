import { predictionEngine, type PredictionInput, type ScenarioResult } from "./prediction-engine";

export interface ScenarioParams {
  extraMonthlySavings?: number;
  expenseReduction?: number;
  expenseCategory?: string;
  incomeIncrease?: number;
  oneTimeExpense?: number;
  stopSubscription?: number;
}

export const scenarioService = {
  runScenario(input: PredictionInput, params: ScenarioParams, currentHealthScore: number): ScenarioResult {
    return predictionEngine.runScenario(input, params, currentHealthScore);
  },

  parseScenarioFromMessage(message: string): ScenarioParams {
    const lower = message.toLowerCase();
    const params: ScenarioParams = {};

    const saveMore = lower.match(/save\s+(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:more|extra|additional)/);
    if (saveMore) {
      params.extraMonthlySavings = parseInt(saveMore[1].replace(/,/g, ""), 10);
    }

    const reduceFood = lower.match(/reduce\s+(?:my\s+)?food\s+(?:spending|expense|cost)\s*(?:by)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (reduceFood) {
      params.expenseReduction = parseInt(reduceFood[1].replace(/,/g, ""), 10);
      params.expenseCategory = "Food";
    }

    const reduceExpense = lower.match(/reduce\s+(?:my\s+)?(?:spending|expenses?|expense)\s+(?:by)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (reduceExpense && !reduceFood) {
      params.expenseReduction = parseInt(reduceExpense[1].replace(/,/g, ""), 10);
    }

    const salaryIncrease = lower.match(/salary\s+(?:increases?|goes?\s+up|rises?|increase)\s*(?:by)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (salaryIncrease) {
      params.incomeIncrease = parseInt(salaryIncrease[1].replace(/,/g, ""), 10);
    }

    const salaryPercent = lower.match(/salary\s+(?:increases?|goes?\s+up|rises?|increase)\s*(?:by)?\s*(\d+)\s*%/);
    if (salaryPercent) {
      params.incomeIncrease = 0;
    }

    const stopSub = lower.match(/(?:stop|cancel|remove)\s+(?:my\s+)?(?:netflix|hotstar|spotify|prime|subscription)/);
    if (stopSub) {
      params.stopSubscription = 500;
    }

    const laptop = lower.match(/(?:buy|afford|purchase)\s+(?:a\s+)?(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:lakh|l)?\s*(?:laptop|computer|macbook)/);
    if (laptop) {
      let amount = parseInt(laptop[1].replace(/,/g, ""), 10);
      if (lower.includes("lakh") || lower.includes("l")) amount *= 100000;
      params.oneTimeExpense = amount;
    }

    const increaseSip = lower.match(/increase\s+(?:my\s+)?(?:sip|investment|mutual\s+fund)\s*(?:by)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (increaseSip) {
      params.extraMonthlySavings = parseInt(increaseSip[1].replace(/,/g, ""), 10);
    }

    return params;
  },

  formatScenarioResult(result: ScenarioResult): string {
    const parts: string[] = [];
    parts.push("📊 **Scenario Analysis**\n");

    const metrics = [
      { label: "Net Worth", current: `₹${result.current.netWorth.toLocaleString("en-IN")}`, scenario: `₹${result.scenario.netWorth.toLocaleString("en-IN")}`, diff: result.difference.netWorth },
      { label: "Savings Rate", current: `${result.current.savingsRate}%`, scenario: `${result.scenario.savingsRate}%`, diff: result.difference.savingsRate },
      { label: "Monthly Savings", current: `₹${result.current.monthlyBalance.toLocaleString("en-IN")}`, scenario: `₹${result.scenario.monthlyBalance.toLocaleString("en-IN")}`, diff: result.difference.monthlyBalance },
      { label: "Emergency Fund", current: `${result.current.emergencyMonths} months`, scenario: `${result.scenario.emergencyMonths} months`, diff: result.difference.emergencyMonths },
      { label: "Health Score", current: `${result.current.healthScore}/100`, scenario: `${result.scenario.healthScore}/100`, diff: result.difference.healthScore },
    ];

    for (const m of metrics) {
      const arrow = m.diff > 0 ? "📈" : m.diff < 0 ? "📉" : "➡️";
      parts.push(`${arrow} **${m.label}**: ${m.current} → ${m.scenario} (${m.diff > 0 ? "+" : ""}${typeof m.diff === "number" && !Number.isInteger(m.diff) ? m.diff.toFixed(1) : m.diff})`);
    }

    return parts.join("\n");
  },
};
