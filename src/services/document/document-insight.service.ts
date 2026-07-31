import type { DocumentCategory } from "@/generated/prisma/enums";
import type { TransactionIntelligence } from "./document-transaction.service";
import type { ExtractedData } from "./document-parser.service";

const TAG = "DocumentInsight";

export interface DocumentInsightItem {
  insightType: string;
  content: string;
  severity: "info" | "warning" | "success" | "critical";
}

function getSpendingPercent(total: number, category: number): number {
  return total > 0 ? Math.round((category / total) * 100) : 0;
}

export const documentInsightService = {
  generateInsights(
    category: DocumentCategory,
    extraction: ExtractedData,
    transactionIntel?: TransactionIntelligence,
  ): DocumentInsightItem[] {
    const insights: DocumentInsightItem[] = [];

    switch (category) {
      case "BANK_STATEMENT":
        insights.push(...this.generateBankInsights(extraction, transactionIntel));
        break;
      case "SALARY_SLIP":
        insights.push(...this.generateSalaryInsights(extraction));
        break;
      case "CREDIT_CARD_STATEMENT":
        insights.push(...this.generateCreditCardInsights(transactionIntel));
        break;
      case "MUTUAL_FUND_STATEMENT":
        insights.push(...this.generateMutualFundInsights(extraction));
        break;
      case "TAX_DOCUMENT":
        insights.push(...this.generateTaxInsights(extraction));
        break;
      default:
        insights.push({
          insightType: "document_uploaded",
          content: "Document processed and categorized successfully.",
          severity: "info",
        });
    }

    return insights.slice(0, 8);
  },

  generateBankInsights(extraction: ExtractedData, tx?: TransactionIntelligence): DocumentInsightItem[] {
    const insights: DocumentInsightItem[] = [];
    const data = extraction as Record<string, unknown>;

    if (data.openingBalance && data.closingBalance) {
      const open = data.openingBalance as number;
      const close = data.closingBalance as number;
      const change = close - open;
      if (change > 0) {
        insights.push({
          insightType: "balance_growth",
          content: `Your account balance grew by ₹${change.toLocaleString("en-IN")} during this period.`,
          severity: "success",
        });
      } else if (change < 0) {
        insights.push({
          insightType: "balance_decline",
          content: `Your account balance decreased by ₹${Math.abs(change).toLocaleString("en-IN")} during this period.`,
          severity: "warning",
        });
      }
    }

    if (tx?.spendingBreakdown && tx.spendingBreakdown.length > 0) {
      const top = tx.spendingBreakdown[0];
      const percent = getSpendingPercent(tx.savingsSummary.total + top.amount, top.amount);
      insights.push({
        insightType: "top_spending",
        content: `You spent ${percent}% on ${top.category} — ₹${top.amount.toLocaleString("en-IN")} across ${top.count} transactions.`,
        severity: "info",
      });
    }

    if (tx?.recurringPayments && tx.recurringPayments.length > 0) {
      const subs = tx.recurringPayments.filter((r) =>
        r.merchant.toLowerCase().includes("subscription") ||
        r.merchant.toLowerCase().includes("netflix") ||
        r.merchant.toLowerCase().includes("hotstar") ||
        r.merchant.toLowerCase().includes("spotify"),
      );
      if (subs.length > 0) {
        const total = subs.reduce((s, r) => s + r.averageAmount, 0);
        insights.push({
          insightType: "subscriptions_detected",
          content: `${subs.length} recurring subscription${subs.length > 1 ? "s" : ""} detected — ₹${total.toLocaleString("en-IN")}/month.`,
          severity: "info",
        });
      }
    }

    if (tx?.savingsSummary) {
      const rate = tx.savingsSummary.rate;
      if (rate >= 30) {
        insights.push({
          insightType: "high_savings",
          content: `Excellent — your savings rate is ${rate}% this period.`,
          severity: "success",
        });
      } else if (rate < 10) {
        insights.push({
          insightType: "low_savings",
          content: `Savings rate is ${rate}% — consider reducing expenses to build wealth faster.`,
          severity: "warning",
        });
      }
    }

    if (tx?.largestExpenses && tx.largestExpenses.length > 0) {
      const largest = tx.largestExpenses[0];
      insights.push({
        insightType: "largest_expense",
        content: `Largest expense: ₹${largest.amount.toLocaleString("en-IN")} on ${largest.description.slice(0, 40)}.`,
        severity: "info",
      });
    }

    return insights;
  },

  generateSalaryInsights(extraction: ExtractedData): DocumentInsightItem[] {
    const insights: DocumentInsightItem[] = [];
    const data = extraction as Record<string, unknown>;

    if (data.grossSalary && data.netSalary) {
      const gross = data.grossSalary as number;
      const net = data.netSalary as number;
      const deductionRate = gross > 0 ? Math.round(((gross - net) / gross) * 100) : 0;
      insights.push({
        insightType: "deduction_rate",
        content: `${deductionRate}% of gross salary goes to deductions — ₹${(gross - net).toLocaleString("en-IN")} total.`,
        severity: deductionRate > 30 ? "warning" : "info",
      });
    }

    return insights;
  },

  generateCreditCardInsights(tx?: TransactionIntelligence): DocumentInsightItem[] {
    const insights: DocumentInsightItem[] = [];

    if (tx?.spendingBreakdown) {
      const food = tx.spendingBreakdown.find((s) => s.category === "Food");
      if (food && food.percent > 25) {
        insights.push({
          insightType: "food_spending",
          content: `You spent ${food.percent}% on food — consider meal planning to reduce costs.`,
          severity: "warning",
        });
      }

      const entertainment = tx.spendingBreakdown.find((s) => s.category === "Entertainment");
      if (entertainment && entertainment.percent > 15) {
        insights.push({
          insightType: "entertainment_spending",
          content: `Entertainment accounts for ${entertainment.percent}% of spending.`,
          severity: "info",
        });
      }
    }

    return insights;
  },

  generateMutualFundInsights(extraction: ExtractedData): DocumentInsightItem[] {
    const insights: DocumentInsightItem[] = [];
    const data = extraction as Record<string, unknown>;

    if (data.gainLoss !== undefined && data.gainLoss !== null) {
      const gainLoss = data.gainLoss as number;
      if (gainLoss > 0) {
        insights.push({
          insightType: "mf_gain",
          content: `Your mutual fund is showing gains of ₹${gainLoss.toLocaleString("en-IN")}.`,
          severity: "success",
        });
      } else if (gainLoss < 0) {
        insights.push({
          insightType: "mf_loss",
          content: `Your mutual fund shows a loss of ₹${Math.abs(gainLoss).toLocaleString("en-IN")} — stay invested for long-term goals.`,
          severity: "warning",
        });
      }
    }

    return insights;
  },

  generateTaxInsights(extraction: ExtractedData): DocumentInsightItem[] {
    const insights: DocumentInsightItem[] = [];
    const data = extraction as Record<string, unknown>;

    if (data.refund && (data.refund as number) > 0) {
      insights.push({
        insightType: "tax_refund",
        content: `Tax refund of ₹${(data.refund as number).toLocaleString("en-IN")} expected.`,
        severity: "success",
      });
    }

    if (data.taxPaid && data.deductions) {
      const taxPaid = data.taxPaid as number;
      const deductions = data.deductions as number;
      if (deductions < taxPaid * 0.3) {
        insights.push({
          insightType: "tax_optimization",
          content: "Consider exploring more deductions under 80C/80D to optimize tax liability.",
          severity: "info",
        });
      }
    }

    return insights;
  },

  generateCopilotContext(documents: { category: DocumentCategory; insights: DocumentInsightItem[] }[]): string {
    const parts: string[] = [];
    for (const doc of documents) {
      const categoryLabel = doc.category.replace(/_/g, " ").toLowerCase();
      parts.push(`From ${categoryLabel}:`);
      for (const insight of doc.insights.slice(0, 2)) {
        parts.push(`- ${insight.content}`);
      }
    }
    return parts.join("\n");
  },
};
