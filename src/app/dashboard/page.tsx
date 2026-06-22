import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import AIAdvisorCard from "@/components/dashboard/AIAdvisorCard";
import ExpenseSummaryCard from "@/components/dashboard/ExpenseSummaryCard";
import PortfolioCard from "@/components/dashboard/PortfolioCard";
import GoalsCard from "@/components/dashboard/GoalsCard";
import KPICards from "@/components/dashboard/KPICards";
import { Shield } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  profile: {
    income: number;
    currency: string;
    riskAppetite: string;
    xp: number;
    streak: number;
  } | null;
  netWorth: number;
  netWorthChange: number;
  netWorthChangePercent: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: {
    score: number;
    label: string;
    breakdown: { name: string; value: number }[];
  };
  expenses: {
    total: number;
    categories: { name: string; amount: number; color: string; percent: number }[];
  };
  portfolio: {
    totalValue: number;
    cashBalance: number;
    change: number;
    changePercent: number;
    allocation: { name: string; percent: number; color: string }[];
    topHoldings: { name: string; value: number; change: number }[];
    isEmpty: boolean;
  };
  goals: {
    id: string;
    name: string;
    target: number;
    current: number;
    color: string;
    icon: string;
    percent: number;
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function computeHealthScore(
  profile: DashboardData["profile"],
  expenses: DashboardData["expenses"],
  goals: DashboardData["goals"],
  portfolio: DashboardData["portfolio"]
): DashboardData["healthScore"] {
  let score = 500;
  let label = "Getting Started";

  const breakdown = [
    { name: "Savings", value: 50 },
    { name: "Debt", value: 50 },
    { name: "Invest", value: 50 },
    { name: "Protect", value: 50 },
    { name: "Spend", value: 50 },
    { name: "Plan", value: 50 },
  ];

  if (!profile && expenses.total === 0 && goals.length === 0 && portfolio.isEmpty) {
    return { score, label, breakdown };
  }

  let savingsScore = 50;
  let investScore = 50;
  let spendScore = 50;
  let planScore = 50;
  let debtScore = 50;
  let protectScore = 50;

  if (profile && profile.income > 0) {
    const savingsRate = (profile.income - expenses.total) / profile.income;
    savingsScore = Math.min(100, Math.max(0, Math.round(savingsRate * 100)));
  }

  if (!portfolio.isEmpty && portfolio.totalValue > 0) {
    investScore = Math.min(100, Math.round(60 + (portfolio.totalValue / 1000000) * 40));
  }

  if (profile && profile.income > 0 && expenses.total > 0) {
    const expenseRatio = expenses.total / profile.income;
    spendScore = Math.min(100, Math.max(0, Math.round((1 - expenseRatio) * 100)));
  }

  if (goals.length > 0) {
    const avgProgress = goals.reduce((sum, g) => sum + g.percent, 0) / goals.length;
    planScore = Math.min(100, Math.round(avgProgress));
  }

  if (profile && profile.income > 0) {
    protectScore = Math.min(100, Math.round(50 + (profile.income / 50000) * 10));
  }

  breakdown[0].value = savingsScore;
  breakdown[1].value = debtScore;
  breakdown[2].value = investScore;
  breakdown[3].value = protectScore;
  breakdown[4].value = spendScore;
  breakdown[5].value = planScore;

  score = Math.round(
    (savingsScore + debtScore + investScore + protectScore + spendScore + planScore) / 6 * 10
  );

  if (score >= 800) label = "Excellent";
  else if (score >= 650) label = "Good";
  else if (score >= 500) label = "Fair";
  else label = "Needs Work";

  return { score, label, breakdown };
}
// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

async function getDashboardData(userId: string): Promise<DashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      income: true,
      currency: true,
      riskAppetite: true,
      xp: true,
      streak: true,
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expensesRaw = await prisma.expense.findMany({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { amount: true, category: true },
  });

  const categoryTotals: Record<string, number> = {};
  let totalExpenses = 0;
  for (const e of expensesRaw) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    totalExpenses += e.amount;
  }

  const expenseColors: Record<string, string> = {
    Housing: "bg-violet-500",
    Food: "bg-teal-500",
    Transport: "bg-blue-500",
    Shopping: "bg-amber-500",
    Entertainment: "bg-rose-500",
    Others: "bg-zinc-600",
  };

  const categories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      color: expenseColors[name] || "bg-zinc-600",
      percent: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const goalsRaw = await prisma.goal.findMany({
    where: { userId },
    select: { id: true, name: true, targetAmount: true, currentAmount: true, type: true },
    take: 3,
  });

  const goalColors: Record<string, string> = {
    SAVINGS: "bg-emerald-500",
    EMERGENCY: "bg-blue-500",
    INVESTMENT: "bg-violet-500",
  };

  const goalIcons: Record<string, string> = {
    SAVINGS: "Shield",
    EMERGENCY: "Shield",
    INVESTMENT: "TrendingUp",
  };

  const goals = goalsRaw.map((g) => {
    const percent = g.targetAmount > 0
      ? Math.round((g.currentAmount / g.targetAmount) * 100)
      : 0;
    return {
      id: g.id,
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
      color: goalColors[g.type] || "bg-zinc-500",
      icon: goalIcons[g.type] || "Target",
      percent,
    };
  });

  const portfolioRaw = await prisma.portfolio.findFirst({
    where: { userId, isDefault: true },
    select: { id: true, name: true, cashBalance: true, totalValue: true },
  });

  let portfolio: DashboardData["portfolio"] = {
    totalValue: 0,
    cashBalance: 0,
    change: 0,
    changePercent: 0,
    allocation: [],
    topHoldings: [],
    isEmpty: true,
  };

  if (portfolioRaw) {
    const trades = await prisma.trade.findMany({
      where: { portfolioId: portfolioRaw.id },
      select: { symbol: true, totalAmount: true, type: true },
      orderBy: { totalAmount: "desc" },
      take: 3,
    });

    const holdings = trades.map((t) => ({
      name: t.symbol,
      value: t.totalAmount,
      change: 0,
    }));

    const invested = trades.reduce((sum, t) => sum + t.totalAmount, 0);
    const total = portfolioRaw.cashBalance + invested;

    portfolio = {
      totalValue: total,
      cashBalance: portfolioRaw.cashBalance,
      change: 0,
      changePercent: 0,
      allocation: [
        { name: "Equity", percent: total > 0 ? Math.round((invested / total) * 100) : 0, color: "bg-teal-500" },
        { name: "Cash", percent: total > 0 ? Math.round((portfolioRaw.cashBalance / total) * 100) : 100, color: "bg-emerald-500" },
      ].filter((a) => a.percent > 0),
      topHoldings: holdings,
      isEmpty: false,
    };
  }

  const income = profile?.income || 0;
  const netWorth = portfolio.totalValue + (income * 6) - totalExpenses;
  const netWorthChange = portfolio.change;
  const netWorthChangePercent = netWorth > 0 ? (netWorthChange / netWorth) * 100 : 0;
  const monthlyIncome = income;
  const monthlyExpenses = totalExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  const healthScore = computeHealthScore(profile, { total: totalExpenses, categories }, goals, portfolio);

  return {
    user,
    profile,
    netWorth,
    netWorthChange,
    netWorthChangePercent,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    healthScore,
    expenses: { total: totalExpenses, categories },
    portfolio,
    goals,
  };
}
// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const data = await getDashboardData(session.user.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* VaultIQ Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10">
              <Shield className="h-7 w-7 text-teal-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
                VaultIQ AI
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                AI-Powered Financial Intelligence Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
              System Online
            </div>

            <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400">
              Premium Dashboard
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards
          netWorth={data.netWorth}
          netWorthChange={data.netWorthChange}
          netWorthChangePercent={data.netWorthChangePercent}
          monthlyIncome={data.monthlyIncome}
          monthlyExpenses={data.monthlyExpenses}
          savingsRate={data.savingsRate}
        />

        {/* Row 1: Health + Advisor */}
        <div className="grid gap-6 lg:grid-cols-2">
          <HealthScoreCard healthScore={data.healthScore} />
          <AIAdvisorCard userId={session.user.id} />
        </div>

        {/* Row 2: Expenses + Portfolio + Goals */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ExpenseSummaryCard expenses={data.expenses} />
          <PortfolioCard portfolio={data.portfolio} />
          <GoalsCard goals={data.goals} />
        </div>
      </div>
    </main>
  );
}