const TAG = "DocumentTransaction";

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  merchant?: string;
}

export interface SpendingBreakdown {
  category: string;
  amount: number;
  percent: number;
  count: number;
}

export interface TopMerchant {
  name: string;
  total: number;
  count: number;
}

export interface RecurringPayment {
  merchant: string;
  averageAmount: number;
  frequency: string;
  lastSeen: string;
}

export interface TransactionIntelligence {
  transactions: Transaction[];
  spendingBreakdown: SpendingBreakdown[];
  topMerchants: TopMerchant[];
  recurringPayments: RecurringPayment[];
  largestExpenses: Transaction[];
  incomeSummary: { total: number; count: number; average: number };
  savingsSummary: { total: number; rate: number };
  monthlyTrend: { month: string; income: number; expenses: number; savings: number }[];
}

const SPEND_CATEGORIES: Record<string, string[]> = {
  Food: ["restaurant", "food", "swiggy", "zomato", "cafe", "tea", "coffee", "lunch", "dinner", "breakfast", "meal", "pizza", "burger"],
  Travel: ["uber", "ola", "metro", "bus", "train", "flight", "taxi", "travel", "petrol", "fuel", "parking", "toll"],
  Shopping: ["amazon", "flipkart", "myntra", "ajio", "shopping", "store", "mall", "market", "clothing", "shoes"],
  Bills: ["electricity", "water", "gas", "internet", "wifi", "broadband", "utility", "bill"],
  Entertainment: ["netflix", "hotstar", "prime", "movie", "theatre", "game", "spotify", "youtube", "subscription"],
  Investment: ["mutual fund", "sip", "stock", "equity", "bond", "fd", "rd", "investment", "zerodha", "groww", "upstox"],
  Salary: ["salary", "payroll", "wages", "stipend", "income"],
  Healthcare: ["hospital", "clinic", "doctor", "pharmacy", "medical", "health", "medicine", "lab"],
  Education: ["school", "college", "university", "course", "tuition", "education", "book", "exam"],
  Rent: ["rent", "house rent", "maintenance", "society"],
  Transfers: ["transfer", "neft", "imps", "rtgs", "upi", "send", "received"],
  Subscriptions: ["subscription", "monthly", "annual plan", "membership", "premium"],
  CashWithdrawal: ["atm", "cash withdrawal", "cash", "withdrawal"],
};

function categorizeTransaction(description: string): string {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(SPEND_CATEGORIES)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }
  return "Other";
}

function extractMerchant(description: string): string {
  const parts = description.split(/[\s-]+/);
  const meaningful = parts.filter((p) => p.length > 2 && !/^\d+$/.test(p));
  return meaningful.slice(0, 3).join(" ") || description.slice(0, 30);
}

export const documentTransactionService = {
  analyzeTransactions(transactions: Transaction[]): TransactionIntelligence {
    const categorized = transactions.map((t) => ({
      ...t,
      category: t.category || categorizeTransaction(t.description),
    }));

    // Spending breakdown
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    const debits = categorized.filter((t) => t.type === "debit");
    for (const t of debits) {
      if (!categoryTotals[t.category]) categoryTotals[t.category] = { amount: 0, count: 0 };
      categoryTotals[t.category].amount += t.amount;
      categoryTotals[t.category].count += 1;
    }
    const totalSpent = debits.reduce((s, t) => s + t.amount, 0);
    const spendingBreakdown: SpendingBreakdown[] = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percent: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top merchants
    const merchantTotals: Record<string, { total: number; count: number }> = {};
    for (const t of debits) {
      const merchant = extractMerchant(t.description);
      if (!merchantTotals[merchant]) merchantTotals[merchant] = { total: 0, count: 0 };
      merchantTotals[merchant].total += t.amount;
      merchantTotals[merchant].count += 1;
    }
    const topMerchants: TopMerchant[] = Object.entries(merchantTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Recurring payments
    const merchantCounts: Record<string, Transaction[]> = {};
    for (const t of debits) {
      const merchant = extractMerchant(t.description);
      if (!merchantCounts[merchant]) merchantCounts[merchant] = [];
      merchantCounts[merchant].push(t);
    }
    const recurringPayments: RecurringPayment[] = Object.entries(merchantCounts)
      .filter(([, txns]) => txns.length >= 2)
      .map(([merchant, txns]) => ({
        merchant,
        averageAmount: txns.reduce((s, t) => s + t.amount, 0) / txns.length,
        frequency: txns.length >= 4 ? "Monthly" : "Recurring",
        lastSeen: txns[txns.length - 1].date,
      }))
      .sort((a, b) => b.averageAmount - a.averageAmount);

    // Largest expenses
    const largestExpenses = [...debits].sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Income summary
    const credits = categorized.filter((t) => t.type === "credit");
    const totalIncome = credits.reduce((s, t) => s + t.amount, 0);
    const incomeSummary = {
      total: totalIncome,
      count: credits.length,
      average: credits.length > 0 ? totalIncome / credits.length : 0,
    };

    // Savings summary
    const savings = totalIncome - totalSpent;
    const savingsSummary = {
      total: savings,
      rate: totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0,
    };

    // Monthly trend (group by month from dates)
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    for (const t of categorized) {
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
      if (t.type === "credit") monthlyData[month].income += t.amount;
      else monthlyData[month].expenses += t.amount;
    }
    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      transactions: categorized,
      spendingBreakdown,
      topMerchants,
      recurringPayments,
      largestExpenses,
      incomeSummary,
      savingsSummary,
      monthlyTrend,
    };
  },

  parseCSVTransactions(csvText: string): Transaction[] {
    const lines = csvText.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const descIdx = headers.findIndex((h) => h.includes("description") || h.includes("narration") || h.includes("particular"));
    const amountIdx = headers.findIndex((h) => h.includes("amount"));
    const debitIdx = headers.findIndex((h) => h.includes("debit") || h.includes("withdrawal"));
    const creditIdx = headers.findIndex((h) => h.includes("credit") || h.includes("deposit"));

    const transactions: Transaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.length < 3) continue;

      const date = dateIdx >= 0 ? cols[dateIdx] : cols[0];
      const description = descIdx >= 0 ? cols[descIdx] : cols[1] || "";
      let amount = 0;
      let type: "credit" | "debit" = "debit";

      if (amountIdx >= 0) {
        amount = Math.abs(parseFloat(cols[amountIdx].replace(/[,₹]/g, "")) || 0);
        type = amount < 0 ? "debit" : "credit";
      } else if (debitIdx >= 0 && creditIdx >= 0) {
        const debit = Math.abs(parseFloat(cols[debitIdx].replace(/[,₹]/g, "")) || 0);
        const credit = Math.abs(parseFloat(cols[creditIdx].replace(/[,₹]/g, "")) || 0);
        if (credit > 0) { amount = credit; type = "credit"; }
        else { amount = debit; type = "debit"; }
      }

      if (amount > 0) {
        transactions.push({
          date,
          description,
          amount,
          type,
          category: categorizeTransaction(description),
          merchant: extractMerchant(description),
        });
      }
    }
    return transactions;
  },

  categorizeTransaction,
  extractMerchant,
};
