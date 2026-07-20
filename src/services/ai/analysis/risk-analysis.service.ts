import type { FinancialContext, RiskAnalysis, Finding, Recommendation } from "./types";

export function analyzeRisks(ctx: FinancialContext): RiskAnalysis {
  const { emergencyFund, cashFlow, fraud, virtualPortfolio, expenses, profile } = ctx;
  const monthlyIncome = profile?.monthlyIncome ?? 0;
  const currentMonthExpenses = expenses.currentMonth;

  const emergencyFundRisk = assessEmergencyFundRisk(emergencyFund, currentMonthExpenses);
  const incomeRisk = assessIncomeRisk(ctx);
  const investmentRisk = assessInvestmentRisk(ctx);
  const fraudRisk = assessFraudRisk(fraud);
  const debtRisk = assessDebtRisk(ctx);
  const insuranceRisk = assessInsuranceRisk(ctx);

  const allFindings = [
    emergencyFundRisk,
    incomeRisk,
    investmentRisk,
    fraudRisk,
    debtRisk,
    insuranceRisk,
  ];

  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const warningCount = allFindings.filter((f) => f.severity === "warning").length;

  let overallRisk: RiskAnalysis["overallRisk"];
  if (criticalCount >= 2) overallRisk = "critical";
  else if (criticalCount >= 1 || warningCount >= 3) overallRisk = "high";
  else if (warningCount >= 1) overallRisk = "moderate";
  else overallRisk = "low";

  const recommendations: Recommendation[] = [];

  if (emergencyFundRisk.severity === "critical" || emergencyFundRisk.severity === "warning") {
    recommendations.push({
      priority: 1,
      category: "risk",
      action: "Build emergency fund to cover 6 months of expenses",
      reason: emergencyFundRisk.detail,
      impact: "Financial safety net for unexpected events",
      effort: "high",
    });
  }

  if (fraudRisk.severity !== "positive") {
    recommendations.push({
      priority: 2,
      category: "risk",
      action: "Review and resolve fraud alerts",
      reason: fraudRisk.detail,
      impact: "Protects against financial losses",
      effort: "medium",
    });
  }

  if (insuranceRisk.severity === "warning") {
    recommendations.push({
      priority: 3,
      category: "risk",
      action: "Review insurance coverage",
      reason: insuranceRisk.detail,
      impact: "Protects against catastrophic financial loss",
      effort: "medium",
    });
  }

  return {
    overallRisk,
    emergencyFundRisk,
    incomeRisk,
    investmentRisk,
    fraudRisk,
    debtRisk,
    insuranceRisk,
    findings: allFindings,
    recommendations,
  };
}

function assessEmergencyFundRisk(
  emergencyFund: FinancialContext["emergencyFund"],
  monthlyExpenses: number,
): Finding {
  const { monthsCovered, status } = emergencyFund;

  if (status === "excellent") {
    return {
      category: "risk",
      severity: "positive",
      title: "Emergency fund is strong",
      detail: `Emergency fund covers ${monthsCovered} months of expenses (target: 6 months).`,
      metric: `${monthsCovered} months`,
      benchmark: "6 months",
    };
  }

  if (status === "critical" || status === "none") {
    return {
      category: "risk",
      severity: "critical",
      title: "Emergency fund critically low",
      detail: `Emergency fund covers only ${monthsCovered} months. Recommended: 6 months. At risk of debt if any unexpected expense occurs.`,
      metric: `${monthsCovered} months`,
      benchmark: "6 months",
    };
  }

  return {
    category: "risk",
    severity: "warning",
    title: "Emergency fund needs growth",
    detail: `Emergency fund covers ${monthsCovered} months. Recommended: 6 months.`,
    metric: `${monthsCovered} months`,
    benchmark: "6 months",
  };
}

function assessIncomeRisk(ctx: FinancialContext): Finding {
  const { income, profile } = ctx;
  const monthlyIncome = profile?.monthlyIncome ?? 0;

  if (monthlyIncome <= 0) {
    return {
      category: "risk",
      severity: "critical",
      title: "No income recorded",
      detail: "No income source is currently recorded. This is the highest financial risk.",
      metric: "₹0",
    };
  }

  if (income.sources.length === 0) {
    return {
      category: "risk",
      severity: "warning",
      title: "Income source not categorized",
      detail: "Income exists but no categorized sources. Consider tracking income sources for better planning.",
    };
  }

  if (income.sources.length === 1) {
    return {
      category: "risk",
      severity: "neutral",
      title: "Single income source",
      detail: "Reliance on a single income source increases vulnerability to job loss.",
      metric: "1 source",
    };
  }

  return {
    category: "risk",
    severity: "positive",
    title: "Multiple income sources",
    detail: `${income.sources.length} income sources provide diversification.`,
    metric: `${income.sources.length} sources`,
  };
}

function assessInvestmentRisk(ctx: FinancialContext): Finding {
  const { virtualPortfolio } = ctx;

  if (!virtualPortfolio) {
    return {
      category: "risk",
      severity: "neutral",
      title: "No virtual investments detected",
      detail: "No Virtual Trading Portfolio found. Practice investment strategies with simulated money.",
    };
  }

  const { allocation } = virtualPortfolio;
  const equityPercent = allocation.find((a: { name: string; percent: number }) => a.name === "Equity")?.percent ?? 0;
  const cashPercent = allocation.find((a: { name: string; percent: number }) => a.name === "Cash")?.percent ?? 100;

  if (cashPercent > 70) {
    return {
      category: "risk",
      severity: "warning",
      title: "Too much cash in virtual portfolio",
      detail: `${cashPercent}% of your virtual portfolio is in cash. Practice deploying capital in the Virtual Trading Lab.`,
      metric: `${cashPercent}% cash`,
      benchmark: "<30% cash",
    };
  }

  if (equityPercent > 80) {
    return {
      category: "risk",
      severity: "warning",
      title: "High equity concentration",
      detail: `${equityPercent}% equity may be too aggressive for some risk profiles.`,
      metric: `${equityPercent}% equity`,
    };
  }

  return {
    category: "risk",
    severity: "positive",
    title: "Portfolio allocation is balanced",
    detail: "Investment allocation appears reasonable for the risk profile.",
    metric: `${equityPercent}% equity, ${cashPercent}% cash`,
  };
}

function assessFraudRisk(fraud: FinancialContext["fraud"]): Finding {
  if (fraud.highRiskCount > 0) {
    return {
      category: "risk",
      severity: "critical",
      title: `${fraud.highRiskCount} high-risk fraud alert(s) detected`,
      detail: `There are ${fraud.highRiskCount} high-risk fraud alerts that need immediate attention.`,
      metric: `${fraud.highRiskCount} alerts`,
    };
  }

  if (fraud.totalScans > 0) {
    return {
      category: "risk",
      severity: "positive",
      title: "No high-risk fraud alerts",
      detail: `${fraud.totalScans} documents scanned with no high-risk issues.`,
      metric: `${fraud.totalScans} scans`,
    };
  }

  return {
    category: "risk",
    severity: "neutral",
    title: "No fraud scans performed",
    detail: "Consider scanning documents for fraud detection.",
  };
}

function assessDebtRisk(ctx: FinancialContext): Finding {
  return {
    category: "risk",
    severity: "positive",
    title: "No debt detected",
    detail: "No active loans or debts are recorded in the system.",
    metric: "₹0 debt",
  };
}

function assessInsuranceRisk(ctx: FinancialContext): Finding {
  return {
    category: "risk",
    severity: "warning",
    title: "Insurance coverage not tracked",
    detail: "Insurance coverage is not being tracked. Consider adding health, life, and vehicle insurance details.",
    metric: "Not tracked",
  };
}
