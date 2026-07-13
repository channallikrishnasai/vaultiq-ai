import { prisma } from "@/lib/prisma";
import { healthScoreService } from "@/services/finance/health-score.service";
import { computeSavingsRate } from "@/lib/finance-utils";
import { computeProjections } from "@/lib/twin-utils";
import { generateTwinRecommendations } from "@/lib/twin-recommendations";
import { normalizeCategory } from "@/lib/expense-categories";
import type { RiskAppetite } from "@/generated/prisma/enums";

export interface FinancialContext {
  user: {
    name: string | null;
    email: string | null;
    occupation: string | null;
  };
  profile: {
    monthlyIncome: number;
    riskAppetite: RiskAppetite;
    xp: number;
    streak: number;
  } | null;
  income: {
    total: number;
    currentMonth: number;
    sources: { category: string; amount: number }[];
  };
  expenses: {
    total: number;
    currentMonth: number;
    categories: { name: string; amount: number; percent: number }[];
    recentTransactions: { category: string; amount: number; date: string; notes: string | null }[];
  };
  savings: {
    totalSaved: number;
    savingsRate: number;
  };
  goals: {
    id: string;
    name: string;
    target: number;
    current: number;
    percent: number;
    type: string;
    deadline: string | null;
    remaining: number;
    monthsToComplete: number | null;
    monthlyNeeded: number | null;
  }[];
  emergencyFund: {
    current: number;
    target: number;
    monthsCovered: number;
    status: "excellent" | "adequate" | "needs_work" | "critical" | "none";
  };
  healthScore: {
    score: number;
    grade: string;
    label: string;
    factors: { name: string; score: number; maxScore: number; tip: string }[];
  };
  portfolio: {
    totalValue: number;
    cashBalance: number;
    invested: number;
    allocation: { name: string; percent: number }[];
    topHoldings: { symbol: string; value: number }[];
  } | null;
  budgets: {
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentUsed: number;
  }[];
  fraud: {
    totalScans: number;
    highRiskCount: number;
    recentAlerts: { riskScore: number; threatCategory: string; date: string }[];
  };
  twin: {
    exists: boolean;
    name: string | null;
    projections: { oneYear: number; threeYear: number; fiveYear: number; tenYear: number } | null;
    recommendations: string[];
  };
  cashFlow: {
    monthlyNet: number;
    emergencyMonths: number;
  };
}

export async function buildFinancialContext(userId: string): Promise<FinancialContext> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    user,
    profile,
    allExpenses,
    currentMonthExpenses,
    allIncomes,
    currentMonthIncomes,
    goals,
    budgets,
    portfolioRaw,
    fraudReports,
    activeTwin,
    aiProfile,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    prisma.profile.findUnique({
      where: { userId },
      select: { income: true, riskAppetite: true, xp: true, streak: true, occupation: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: { amount: true, category: true, date: true, notes: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      select: { amount: true, category: true },
    }),
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: { amount: true, category: true, date: true },
    }),
    prisma.income.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      select: { amount: true, category: true },
    }),
    prisma.goal.findMany({
      where: { userId },
      select: {
        id: true, name: true, targetAmount: true, currentAmount: true,
        type: true, deadline: true,
      },
    }),
    prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      select: { category: true, limit: true },
    }),
    prisma.portfolio.findFirst({
      where: { userId, isDefault: true },
      select: { id: true, cashBalance: true, totalValue: true },
    }),
    prisma.fraudReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { riskScore: true, threatCategory: true, createdAt: true },
    }),
    prisma.financialTwin.findFirst({
      where: { userId, isActive: true },
      select: { name: true, snapshot: true, projections: true, recommendations: true },
    }),
    prisma.aiProfile.findUnique({ where: { userId } }),
  ]);

  // ── Income ─────────────────────────────────────────────────────────────────
  const currentMonthIncomeTotal = currentMonthIncomes.reduce((s, i) => s + i.amount, 0);
  const totalIncome = allIncomes.reduce((s, i) => s + i.amount, 0);
  const incomeSources = Object.entries(
    allIncomes.reduce((acc, i) => {
      const cat = normalizeCategory(i.category);
      acc[cat] = (acc[cat] || 0) + i.amount;
      return acc;
    }, {} as Record<string, number>),
  ).map(([category, amount]) => ({ category, amount }));

  // ── Expenses ───────────────────────────────────────────────────────────────
  const currentMonthExpenseTotal = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);

  const categoryMap: Record<string, number> = {};
  for (const e of currentMonthExpenses) {
    const cat = normalizeCategory(e.category);
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
  }
  const expenseCategories = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: currentMonthExpenseTotal > 0 ? Math.round((amount / currentMonthExpenseTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const recentTransactions = allExpenses.slice(0, 10).map((e) => ({
    category: normalizeCategory(e.category),
    amount: e.amount,
    date: e.date.toISOString(),
    notes: e.notes,
  }));

  // ── Savings ────────────────────────────────────────────────────────────────
  const monthlyIncome = profile?.income ?? 0;
  const effectiveIncome = currentMonthIncomeTotal > 0 ? currentMonthIncomeTotal : monthlyIncome;
  const savingsRate = computeSavingsRate(effectiveIncome, currentMonthExpenseTotal);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  // ── Goals ──────────────────────────────────────────────────────────────────
  const goalData = goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const percent = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
    const monthlySavings = effectiveIncome - currentMonthExpenseTotal;
    let monthsToComplete: number | null = null;
    let monthlyNeeded: number | null = null;

    if (remaining > 0 && monthlySavings > 0) {
      monthsToComplete = Math.ceil(remaining / monthlySavings);
      monthlyNeeded = monthlySavings;
    } else if (remaining > 0 && g.deadline) {
      const deadline = new Date(g.deadline);
      const monthsLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      monthlyNeeded = Math.ceil(remaining / monthsLeft);
    }

    return {
      id: g.id,
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
      percent,
      type: g.type,
      deadline: g.deadline?.toISOString() ?? null,
      remaining,
      monthsToComplete,
      monthlyNeeded,
    };
  });

  // ── Emergency Fund ─────────────────────────────────────────────────────────
  const emergencyGoal = goals.find((g) => g.type === "EMERGENCY");
  const emergencyCurrent = emergencyGoal?.currentAmount ?? 0;
  const emergencyTarget = emergencyGoal?.targetAmount ?? monthlyIncome * 6;
  const emergencyMonths = currentMonthExpenseTotal > 0
    ? emergencyCurrent / currentMonthExpenseTotal
    : 0;

  let emergencyStatus: FinancialContext["emergencyFund"]["status"] = "none";
  if (emergencyMonths >= 6) emergencyStatus = "excellent";
  else if (emergencyMonths >= 3) emergencyStatus = "adequate";
  else if (emergencyMonths > 0) emergencyStatus = "needs_work";
  else emergencyStatus = "critical";

  // ── Health Score ───────────────────────────────────────────────────────────
  const healthScore = await healthScoreService.calculate(userId);

  // ── Portfolio ──────────────────────────────────────────────────────────────
  let portfolio: FinancialContext["portfolio"] = null;
  if (portfolioRaw) {
    const trades = await prisma.trade.findMany({
      where: { portfolioId: portfolioRaw.id },
      select: { symbol: true, totalAmount: true },
      orderBy: { totalAmount: "desc" },
      take: 5,
    });
    const invested = trades.reduce((s, t) => s + t.totalAmount, 0);
    const total = portfolioRaw.totalValue || portfolioRaw.cashBalance + invested;
    portfolio = {
      totalValue: total,
      cashBalance: portfolioRaw.cashBalance,
      invested,
      allocation: [
        { name: "Equity", percent: total > 0 ? Math.round((invested / total) * 100) : 0 },
        { name: "Cash", percent: total > 0 ? Math.round((portfolioRaw.cashBalance / total) * 100) : 100 },
      ].filter((a) => a.percent > 0),
      topHoldings: trades.map((t) => ({ symbol: t.symbol, value: t.totalAmount })),
    };
  }

  // ── Budgets ────────────────────────────────────────────────────────────────
  const budgetData = budgets.map((b) => {
    const spent = currentMonthExpenses
      .filter((e) => normalizeCategory(e.category) === normalizeCategory(b.category))
      .reduce((s, e) => s + e.amount, 0);
    return {
      category: normalizeCategory(b.category),
      limit: b.limit,
      spent,
      remaining: Math.max(0, b.limit - spent),
      percentUsed: b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0,
    };
  });

  // ── Fraud ──────────────────────────────────────────────────────────────────
  const allFraudReports = await prisma.fraudReport.findMany({
    where: { userId },
    select: { riskScore: true, threatCategory: true, createdAt: true },
  });

  // ── Twin ───────────────────────────────────────────────────────────────────
  const riskAppetite = (profile?.riskAppetite as RiskAppetite) ?? "MODERATE";
  const netWorth = totalSaved + (portfolio?.totalValue ?? 0);
  const twinProjections = computeProjections(netWorth, riskAppetite);
  const twinRecs = generateTwinRecommendations({
    savingsRate,
    debt: 0,
    savings: totalSaved,
    investments: portfolio?.totalValue ?? 0,
    monthlyExpenses: currentMonthExpenseTotal,
    emergencyFundCurrent: emergencyCurrent,
    emergencyFundTarget: emergencyTarget,
    goalProgress: goalData.map((g) => ({
      name: g.name,
      percent: g.percent,
      remaining: g.remaining,
    })),
    riskAppetite,
  });

  // ── Cash Flow ──────────────────────────────────────────────────────────────
  const monthlyNet = effectiveIncome - currentMonthExpenseTotal;

  return {
    user: {
      name: user?.name ?? null,
      email: user?.email ?? null,
      occupation: aiProfile?.occupation ?? profile?.occupation ?? null,
    },
    profile: profile
      ? {
          monthlyIncome: profile.income ?? 0,
          riskAppetite,
          xp: profile.xp,
          streak: profile.streak,
        }
      : null,
    income: {
      total: totalIncome,
      currentMonth: currentMonthIncomeTotal,
      sources: incomeSources,
    },
    expenses: {
      total: totalExpenses,
      currentMonth: currentMonthExpenseTotal,
      categories: expenseCategories,
      recentTransactions,
    },
    savings: {
      totalSaved,
      savingsRate,
    },
    goals: goalData,
    emergencyFund: {
      current: emergencyCurrent,
      target: emergencyTarget,
      monthsCovered: Math.round(emergencyMonths * 10) / 10,
      status: emergencyStatus,
    },
    healthScore: {
      score: healthScore.score,
      grade: healthScore.grade,
      label: healthScore.label,
      factors: healthScore.factors,
    },
    portfolio,
    budgets: budgetData,
    fraud: {
      totalScans: allFraudReports.length,
      highRiskCount: allFraudReports.filter((r) => r.riskScore > 60).length,
      recentAlerts: fraudReports.slice(0, 3).map((r) => ({
        riskScore: r.riskScore,
        threatCategory: r.threatCategory,
        date: r.createdAt.toISOString(),
      })),
    },
    twin: {
      exists: !!activeTwin,
      name: activeTwin?.name ?? null,
      projections: twinProjections,
      recommendations: twinRecs,
    },
    cashFlow: {
      monthlyNet,
      emergencyMonths: Math.round(emergencyMonths * 10) / 10,
    },
  };
}

export function formatFinancialContext(ctx: FinancialContext): string {
  const lines: string[] = [];

  lines.push("=== USER FINANCIAL PROFILE ===");
  lines.push(`Name: ${ctx.user.name || "Not set"}`);
  lines.push(`Occupation: ${ctx.user.occupation || "Not specified"}`);
  lines.push(`Risk Appetite: ${ctx.profile?.riskAppetite || "Not set"}`);
  lines.push("");

  lines.push("=== INCOME ===");
  lines.push(`Monthly Income (from profile): ₹${ctx.profile?.monthlyIncome?.toLocaleString("en-IN") || "0"}`);
  lines.push(`Current Month Actual Income: ₹${ctx.income.currentMonth.toLocaleString("en-IN")}`);
  lines.push(`Total Historical Income: ₹${ctx.income.total.toLocaleString("en-IN")}`);
  if (ctx.income.sources.length > 0) {
    lines.push(`Income Sources: ${ctx.income.sources.map((s) => `${s.category} (₹${s.amount.toLocaleString("en-IN")})`).join(", ")}`);
  }
  lines.push("");

  lines.push("=== EXPENSES ===");
  lines.push(`Current Month Expenses: ₹${ctx.expenses.currentMonth.toLocaleString("en-IN")}`);
  lines.push(`Total Historical Expenses: ₹${ctx.expenses.total.toLocaleString("en-IN")}`);
  if (ctx.expenses.categories.length > 0) {
    lines.push("Category Breakdown (Current Month):");
    ctx.expenses.categories.forEach((c) => {
      lines.push(`  - ${c.name}: ₹${c.amount.toLocaleString("en-IN")} (${c.percent}%)`);
    });
  }
  if (ctx.expenses.recentTransactions.length > 0) {
    lines.push("Recent Transactions:");
    ctx.expenses.recentTransactions.slice(0, 5).forEach((t) => {
      lines.push(`  - ${t.date.split("T")[0]}: ${t.category} ₹${t.amount.toLocaleString("en-IN")}${t.notes ? ` (${t.notes})` : ""}`);
    });
  }
  lines.push("");

  lines.push("=== SAVINGS ===");
  lines.push(`Total Saved: ₹${ctx.savings.totalSaved.toLocaleString("en-IN")}`);
  lines.push(`Savings Rate: ${ctx.savings.savingsRate}%`);
  lines.push(`Monthly Net Cash Flow: ₹${ctx.cashFlow.monthlyNet.toLocaleString("en-IN")}`);
  lines.push("");

  lines.push("=== EMERGENCY FUND ===");
  lines.push(`Current: ₹${ctx.emergencyFund.current.toLocaleString("en-IN")}`);
  lines.push(`Target: ₹${ctx.emergencyFund.target.toLocaleString("en-IN")}`);
  lines.push(`Months Covered: ${ctx.emergencyFund.monthsCovered}`);
  lines.push(`Status: ${ctx.emergencyFund.status}`);
  lines.push("");

  if (ctx.goals.length > 0) {
    lines.push("=== GOALS ===");
    ctx.goals.forEach((g) => {
      lines.push(`  - ${g.name} (${g.type}): ₹${g.current.toLocaleString("en-IN")} / ₹${g.target.toLocaleString("en-IN")} (${g.percent}%)`);
      if (g.deadline) lines.push(`    Deadline: ${g.deadline.split("T")[0]}`);
      if (g.remaining > 0) lines.push(`    Remaining: ₹${g.remaining.toLocaleString("en-IN")}`);
      if (g.monthlyNeeded) lines.push(`    Monthly needed to stay on track: ₹${g.monthlyNeeded.toLocaleString("en-IN")}`);
    });
    lines.push("");
  }

  lines.push("=== FINANCIAL HEALTH ===");
  lines.push(`Score: ${ctx.healthScore.score}/100 (Grade ${ctx.healthScore.grade} - ${ctx.healthScore.label})`);
  ctx.healthScore.factors.forEach((f) => {
    lines.push(`  - ${f.name}: ${f.score}/${f.maxScore} — ${f.tip}`);
  });
  lines.push("");

  if (ctx.portfolio) {
    lines.push("=== PORTFOLIO ===");
    lines.push(`Total Value: ₹${ctx.portfolio.totalValue.toLocaleString("en-IN")}`);
    lines.push(`Cash: ₹${ctx.portfolio.cashBalance.toLocaleString("en-IN")}`);
    lines.push(`Invested: ₹${ctx.portfolio.invested.toLocaleString("en-IN")}`);
    if (ctx.portfolio.topHoldings.length > 0) {
      lines.push(`Top Holdings: ${ctx.portfolio.topHoldings.map((h) => `${h.symbol} (₹${h.value.toLocaleString("en-IN")})`).join(", ")}`);
    }
    lines.push("");
  }

  if (ctx.budgets.length > 0) {
    lines.push("=== BUDGETS (Current Month) ===");
    ctx.budgets.forEach((b) => {
      lines.push(`  - ${b.category}: ₹${b.spent.toLocaleString("en-IN")} / ₹${b.limit.toLocaleString("en-IN")} (${b.percentUsed}% used)`);
    });
    lines.push("");
  }

  lines.push("=== FRAUD ALERTS ===");
  lines.push(`Total Scans: ${ctx.fraud.totalScans}`);
  lines.push(`High Risk Alerts: ${ctx.fraud.highRiskCount}`);
  if (ctx.fraud.recentAlerts.length > 0) {
    ctx.fraud.recentAlerts.forEach((a) => {
      lines.push(`  - Risk ${a.riskScore}/100: ${a.threatCategory} (${a.date.split("T")[0]})`);
    });
  }
  lines.push("");

  lines.push("=== FINANCIAL TWIN ===");
  lines.push(`Twin Active: ${ctx.twin.exists ? "Yes" : "No"}`);
  if (ctx.twin.exists) lines.push(`Twin Name: ${ctx.twin.name}`);
  if (ctx.twin.projections) {
    lines.push("Projections:");
    lines.push(`  1 Year: ₹${ctx.twin.projections.oneYear.toLocaleString("en-IN")}`);
    lines.push(`  3 Years: ₹${ctx.twin.projections.threeYear.toLocaleString("en-IN")}`);
    lines.push(`  5 Years: ₹${ctx.twin.projections.fiveYear.toLocaleString("en-IN")}`);
    lines.push(`  10 Years: ₹${ctx.twin.projections.tenYear.toLocaleString("en-IN")}`);
  }
  if (ctx.twin.recommendations.length > 0) {
    lines.push("AI Recommendations:");
    ctx.twin.recommendations.forEach((r) => lines.push(`  - ${r}`));
  }
  lines.push("");

  lines.push("=== NET WORTH ===");
  lines.push(`Net Worth: ₹${(ctx.savings.totalSaved + (ctx.portfolio?.totalValue ?? 0)).toLocaleString("en-IN")}`);
  lines.push(`Debt: ₹0`);

  return lines.join("\n");
}
