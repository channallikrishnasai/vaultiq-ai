import type { DocumentCategory } from "@/generated/prisma/enums";

const TAG = "DocumentParser";

export interface ParsedContent {
  text: string;
  tables: Record<string, string>[][];
  metadata: Record<string, unknown>;
}

export interface BankStatementData {
  accountName?: string;
  bank?: string;
  accountNumber?: string;
  statementPeriod?: string;
  openingBalance?: number;
  closingBalance?: number;
  credits?: number;
  debits?: number;
  monthlySavings?: number;
  averageBalance?: number;
}

export interface SalarySlipData {
  employer?: string;
  employee?: string;
  grossSalary?: number;
  netSalary?: number;
  allowances?: number;
  deductions?: number;
  basicSalary?: number;
  hra?: number;
  pf?: number;
}

export interface InsuranceData {
  provider?: string;
  policyNumber?: string;
  coverage?: number;
  premium?: number;
  expiry?: string;
  policyType?: string;
}

export interface MutualFundData {
  amc?: string;
  fund?: string;
  units?: number;
  currentValue?: number;
  investedValue?: number;
  gainLoss?: number;
  nav?: number;
}

export interface TaxData {
  assessmentYear?: string;
  taxPaid?: number;
  refund?: number;
  deductions?: number;
  taxableIncome?: number;
  taxRate?: string;
}

export type ExtractedData = BankStatementData | SalarySlipData | InsuranceData | MutualFundData | TaxData;

const NUMERIC_PATTERN = /[\d,]+\.?\d*/g;
const CURRENCY_PATTERN = /[₹$€£]\s*[\d,]+\.?\d*/g;
const PERCENTAGE_PATTERN = /\d+\.?\d*\s*%/g;
const DATE_PATTERN = /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/g;
const YEAR_PATTERN = /20\d{2}/g;

function extractNumbers(text: string): number[] {
  const matches = text.match(NUMERIC_PATTERN) || [];
  return matches
    .map((m) => parseFloat(m.replace(/,/g, "")))
    .filter((n) => !isNaN(n) && n > 0);
}

function extractCurrencyAmounts(text: string): number[] {
  const matches = text.match(CURRENCY_PATTERN) || [];
  return matches
    .map((m) => parseFloat(m.replace(/[₹$€£,\s]/g, "")))
    .filter((n) => !isNaN(n) && n > 0);
}

function extractDates(text: string): string[] {
  return text.match(DATE_PATTERN) || [];
}

function extractYear(text: string): string | undefined {
  const years = text.match(YEAR_PATTERN);
  return years?.[years.length - 1];
}

function inferBank(text: string): string | undefined {
  const banks = [
    "HDFC", "ICICI", "SBI", "Axis", "Kotak", "Bank of Baroda",
    "Punjab National Bank", "Canara Bank", "Union Bank", "IDBI",
    "Yes Bank", "IndusInd", "Federal Bank", "South Indian Bank",
    "Bank of India", "Central Bank", "Indian Bank", "UCO Bank",
  ];
  const upper = text.toUpperCase();
  for (const bank of banks) {
    if (upper.includes(bank.toUpperCase())) return bank;
  }
  return undefined;
}

function inferEmployer(text: string): string | undefined {
  const patterns = [
    /(?:employer|company|organization)[:\s]*([^\n,]+)/i,
    /(?:worked at|employed at| employed by)[:\s]*([^\n,]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function inferEmployee(text: string): string | undefined {
  const patterns = [
    /(?:employee name|name of employee|employee[:\s])([^\n,]+)/i,
    /(?:dear|mr|ms|mrs|miss)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function inferInsuranceProvider(text: string): string | undefined {
  const providers = [
    "LIC", "ICICI Prudential", "HDFC Life", "Max Life", "Star Health",
    "Bajaj Allianz", "New India Assurance", "United India", "Oriental Insurance",
    "TATA AIG", "Reliance General", "Digit", "Acko", "Policybazaar",
  ];
  const upper = text.toUpperCase();
  for (const provider of providers) {
    if (upper.includes(provider.toUpperCase())) return provider;
  }
  return undefined;
}

function inferAMC(text: string): string | undefined {
  const amcs = [
    "SBI Mutual Fund", "HDFC Mutual Fund", "ICICI Prudential", "Axis Mutual Fund",
    "Nippon India", "UTI Mutual Fund", "Aditya Birla", "Kotak Mutual Fund",
    "DSP Mutual Fund", "Mirae Asset", "IDFC Mutual Fund", "Invesco",
  ];
  const upper = text.toUpperCase();
  for (const amc of amcs) {
    if (upper.includes(amc.toUpperCase())) return amc;
  }
  return undefined;
}

export const documentParserService = {
  parseBankStatement(text: string): BankStatementData {
    const amounts = extractCurrencyAmounts(text);
    const numbers = extractNumbers(text);
    const bank = inferBank(text);

    const openingBalance = amounts.find((a) => {
      const idx = text.indexOf(String(a));
      return text.substring(Math.max(0, idx - 50), idx).toLowerCase().includes("opening");
    });
    const closingBalance = amounts.find((a) => {
      const idx = text.indexOf(String(a));
      return text.substring(Math.max(0, idx - 50), idx).toLowerCase().includes("closing");
    });

    const creditTotal = amounts.filter((a) => {
      const idx = text.indexOf(String(a));
      const context = text.substring(Math.max(0, idx - 30), idx).toLowerCase();
      return context.includes("credit") || context.includes("deposit");
    }).reduce((s, a) => s + a, 0);

    const debitTotal = amounts.filter((a) => {
      const idx = text.indexOf(String(a));
      const context = text.substring(Math.max(0, idx - 30), idx).toLowerCase();
      return context.includes("debit") || context.includes("withdrawal");
    }).reduce((s, a) => s + a, 0);

    return {
      accountName: inferEmployee(text),
      bank,
      statementPeriod: extractDates(text).join(" to ") || undefined,
      openingBalance: openingBalance || undefined,
      closingBalance: closingBalance || undefined,
      credits: creditTotal || undefined,
      debits: debitTotal || undefined,
      monthlySavings: creditTotal > 0 && debitTotal > 0 ? creditTotal - debitTotal : undefined,
      averageBalance: amounts.length > 0 ? amounts.reduce((s, a) => s + a, 0) / amounts.length : undefined,
    };
  },

  parseSalarySlip(text: string): SalarySlipData {
    const amounts = extractCurrencyAmounts(text);
    const employer = inferEmployer(text);
    const employee = inferEmployee(text);

    const gross = amounts.find((a) => {
      const idx = text.indexOf(String(a));
      return text.substring(Math.max(0, idx - 30), idx).toLowerCase().includes("gross");
    });
    const net = amounts.find((a) => {
      const idx = text.indexOf(String(a));
      return text.substring(Math.max(0, idx - 30), idx).toLowerCase().includes("net");
    });

    return {
      employer,
      employee,
      grossSalary: gross || amounts[0] || undefined,
      netSalary: net || amounts[1] || undefined,
      allowances: gross && net ? gross - net : undefined,
      deductions: gross && net ? gross - net : undefined,
    };
  },

  parseInsurance(text: string): InsuranceData {
    const amounts = extractCurrencyAmounts(text);
    const provider = inferInsuranceProvider(text);
    const dates = extractDates(text);

    return {
      provider,
      coverage: amounts[0] || undefined,
      premium: amounts[1] || undefined,
      expiry: dates[dates.length - 1] || undefined,
    };
  },

  parseMutualFund(text: string): MutualFundData {
    const numbers = extractNumbers(text);
    const amounts = extractCurrencyAmounts(text);
    const amc = inferAMC(text);

    const units = numbers.find((n) => n > 0 && n < 10000);
    const currentValue = amounts[0];
    const investedValue = amounts[1];

    return {
      amc,
      units: units || undefined,
      currentValue,
      investedValue,
      gainLoss: currentValue && investedValue ? currentValue - investedValue : undefined,
    };
  },

  parseTax(text: string): TaxData {
    const amounts = extractCurrencyAmounts(text);
    const year = extractYear(text);

    return {
      assessmentYear: year ? `AY ${year}-${String(parseInt(year) + 1).slice(-2)}` : undefined,
      taxPaid: amounts[0] || undefined,
      refund: amounts.find((a) => {
        const idx = text.indexOf(String(a));
        return text.substring(Math.max(0, idx - 30), idx).toLowerCase().includes("refund");
      }),
      deductions: amounts.find((a) => {
        const idx = text.indexOf(String(a));
        return text.substring(Math.max(0, idx - 30), idx).toLowerCase().includes("deduction");
      }),
    };
  },

  parseDocument(category: DocumentCategory, text: string): ExtractedData {
    switch (category) {
      case "BANK_STATEMENT":
        return this.parseBankStatement(text);
      case "SALARY_SLIP":
        return this.parseSalarySlip(text);
      case "INSURANCE_POLICY":
        return this.parseInsurance(text);
      case "MUTUAL_FUND_STATEMENT":
        return this.parseMutualFund(text);
      case "TAX_DOCUMENT":
        return this.parseTax(text);
      default:
        return {};
    }
  },

  extractText(content: string): string {
    return content
      .replace(/\s+/g, " ")
      .replace(/[^\w\s₹$,.\-\/()]/g, " ")
      .trim();
  },
};
