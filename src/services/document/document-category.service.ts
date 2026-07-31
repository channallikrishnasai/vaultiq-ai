import type { DocumentCategory } from "@/generated/prisma/enums";

const TAG = "DocumentCategory";

export interface ClassificationResult {
  category: DocumentCategory;
  confidence: number;
  reasoning: string;
  subcategories: string[];
}

const KEYWORD_MAP: Record<DocumentCategory, string[]> = {
  BANK_STATEMENT: [
    "bank statement", "account statement", "savings account", "current account",
    "opening balance", "closing balance", "credits", "debits", "mini statement",
    "quarterly statement", "annual statement", "hdfc", "icici", "sbi", "axis",
    "kotak", "bank of baroda", "punjab national bank", "canara bank",
  ],
  SALARY_SLIP: [
    "salary slip", "payslip", "pay slip", "monthly salary", "gross salary",
    "net salary", "basic salary", "allowances", "deductions", "pf", "esi",
    "professional tax", "income tax", "hra", "da", "ta", "bonus",
  ],
  TAX_DOCUMENT: [
    "form 16", "form 16a", "form 16b", "form 26as", "itr", "income tax",
    "tax return", "tax deduction", "tds", "assessment year", "financial year",
    "tax paid", "tax refund", "deductions under", "80c", "80d", "80e",
    "tax computation", "challan",
  ],
  INSURANCE_POLICY: [
    "insurance policy", "life insurance", "health insurance", "motor insurance",
    "policy number", "premium", "sum insured", "coverage", "claim",
    "nominee", "policy holder", "policy term", "renewal", "expiry",
    "lic", "icici prudential", "hdfc life", "max life", "star health",
  ],
  MUTUAL_FUND_STATEMENT: [
    "mutual fund", "fund statement", "units", "nav", "amc", "sip",
    "lumpsum", "folio number", "scheme", "redemption", "switch",
    "systematic investment", "direct plan", "regular plan", "growth option",
    "idfc", "sbi magnum", "hdfc midcap", "axis bluechip",
  ],
  STOCK_HOLDING_STATEMENT: [
    "stock holding", "demat", "holding statement", "portfolio statement",
    "shares", "equity", "stocks", "trading", "broker", "cdsl", "nsdl",
    "isin", "market value", "pledge", "margin", "delivery",
  ],
  CREDIT_CARD_STATEMENT: [
    "credit card", "card statement", "billing cycle", "minimum due",
    "total due", "credit limit", "available credit", "reward points",
    "emi", "finance charge", "late payment", "annual fee",
  ],
  LOAN_DOCUMENT: [
    "loan", "emi", "loan statement", "repayment", "principal",
    "interest rate", "outstanding", "loan account", "prepayment",
    "tenure", "disbursement", "collateral", "mortgage", "home loan",
    "car loan", "personal loan", "education loan",
  ],
  INVESTMENT_REPORT: [
    "investment report", "portfolio report", "holding report",
    "dividend", "capital gains", "investment summary", "asset allocation",
    "returns", "xirr", "cagr", "benchmark", "fund manager",
  ],
  OTHER: [],
};

export const documentCategoryService = {
  classifyByText(text: string): ClassificationResult {
    const lowerText = text.toLowerCase();
    const scores: { category: DocumentCategory; score: number; matches: string[] }[] = [];

    for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
      const matches: string[] = [];
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }
      if (matches.length > 0) {
        scores.push({
          category: category as DocumentCategory,
          score: matches.length / keywords.length,
          matches,
        });
      }
    }

    if (scores.length === 0) {
      return {
        category: "OTHER",
        confidence: 0.3,
        reasoning: "No matching financial keywords found",
        subcategories: [],
      };
    }

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    const confidence = Math.min(0.95, 0.5 + best.score * 0.5);

    return {
      category: best.category,
      confidence,
      reasoning: `Matched ${best.matches.length} keywords: ${best.matches.slice(0, 5).join(", ")}`,
      subcategories: best.matches.slice(0, 5),
    };
  },

  classifyByFileName(fileName: string): DocumentCategory {
    const lower = fileName.toLowerCase();
    if (lower.includes("salary") || lower.includes("payslip")) return "SALARY_SLIP";
    if (lower.includes("bank") || lower.includes("statement")) return "BANK_STATEMENT";
    if (lower.includes("tax") || lower.includes("form16") || lower.includes("itr")) return "TAX_DOCUMENT";
    if (lower.includes("insurance") || lower.includes("policy")) return "INSURANCE_POLICY";
    if (lower.includes("mutual") || lower.includes("fund") || lower.includes("mf")) return "MUTUAL_FUND_STATEMENT";
    if (lower.includes("stock") || lower.includes("holding") || lower.includes("demat")) return "STOCK_HOLDING_STATEMENT";
    if (lower.includes("credit") || lower.includes("card")) return "CREDIT_CARD_STATEMENT";
    if (lower.includes("loan") || lower.includes("emi")) return "LOAN_DOCUMENT";
    if (lower.includes("investment") || lower.includes("portfolio")) return "INVESTMENT_REPORT";
    return "OTHER";
  },

  getCategoryIcon(category: DocumentCategory): string {
    const icons: Record<DocumentCategory, string> = {
      BANK_STATEMENT: "Building2",
      SALARY_SLIP: "Wallet",
      TAX_DOCUMENT: "Receipt",
      INSURANCE_POLICY: "Shield",
      MUTUAL_FUND_STATEMENT: "TrendingUp",
      STOCK_HOLDING_STATEMENT: "BarChart3",
      CREDIT_CARD_STATEMENT: "CreditCard",
      LOAN_DOCUMENT: "Landmark",
      INVESTMENT_REPORT: "PieChart",
      OTHER: "FileText",
    };
    return icons[category];
  },

  getCategoryLabel(category: DocumentCategory): string {
    const labels: Record<DocumentCategory, string> = {
      BANK_STATEMENT: "Bank Statement",
      SALARY_SLIP: "Salary Slip",
      TAX_DOCUMENT: "Tax Document",
      INSURANCE_POLICY: "Insurance Policy",
      MUTUAL_FUND_STATEMENT: "Mutual Fund Statement",
      STOCK_HOLDING_STATEMENT: "Stock Holding Statement",
      CREDIT_CARD_STATEMENT: "Credit Card Statement",
      LOAN_DOCUMENT: "Loan Document",
      INVESTMENT_REPORT: "Investment Report",
      OTHER: "Other",
    };
    return labels[category];
  },

  getCategoryColor(category: DocumentCategory): string {
    const colors: Record<DocumentCategory, string> = {
      BANK_STATEMENT: "#3b82f6",
      SALARY_SLIP: "#10b981",
      TAX_DOCUMENT: "#f59e0b",
      INSURANCE_POLICY: "#8b5cf6",
      MUTUAL_FUND_STATEMENT: "#06b6d4",
      STOCK_HOLDING_STATEMENT: "#ef4444",
      CREDIT_CARD_STATEMENT: "#ec4899",
      LOAN_DOCUMENT: "#f97316",
      INVESTMENT_REPORT: "#14b8a6",
      OTHER: "#6b7280",
    };
    return colors[category];
  },
};
