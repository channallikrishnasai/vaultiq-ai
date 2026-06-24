import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import AIAdvisorCard from "@/components/dashboard/AIAdvisorCard";
import ExpenseSummaryCard from "@/components/dashboard/ExpenseSummaryCard";
import PortfolioCard from "@/components/dashboard/PortfolioCard";
import GoalsCard from "@/components/dashboard/GoalsCard";
import KPICards from "@/components/dashboard/KPICards";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { GoalList } from "@/components/goals/GoalList";
import LevelCard from "@/components/dashboard/LevelCard";
import FraudShieldCard from "@/components/dashboard/FraudShieldCard";
import FinancialTwinCard from "@/components/dashboard/FinancialTwinCard";
import { healthScoreService } from "@/services/finance/health-score.service";
import { normalizeCategory, getCategoryColor } from "@/lib/expense-categories";
import { computeNetWorth, computeSavingsRate } from "@/lib/demo-profile";
import Link from "next/link";

async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });

  if (!user) throw new Error("User not found");

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { income: true, currency: true, riskAppetite: true, xp: true, streak: true },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [expensesRaw, expensesList, goalsRaw, goalsList, portfolioRaw, healthScore, fraudReports, activeTwin] =
    await Promise.all([
      prisma.expense.findMany({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
        select: { amount: true, category: true },
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.goal.findMany({
        where: { userId },
        select: { id: true, name: true, targetAmount: true, currentAmount: true, type: true },
        orderBy: { currentAmount: "desc" },
        take: 4,
      }),
      prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.portfolio.findFirst({
        where: { userId, isDefault: true },
        select: { id: true, name: true, cashBalance: true, totalValue: true },
      }),
      healthScoreService.calculate(userId),
      prisma.fraudReport.findMany({ where: { userId }, select: { riskScore: true } }),
      prisma.financialTwin.findFirst({
        where: { userId, isActive: true },
        select: { name: true, healthScore: true, snapshot: true },
      }),
    ]);

  const categoryTotals: Record<string, number> = {};
  let totalExpenses = 0;
  for (const e of expensesRaw) {
    const cat = normalizeCategory(e.category);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    totalExpenses += e.amount;
  }

  const categories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      color: getCategoryColor(name),
      percent: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const goalColors: Record<string, string> = {
    SAVINGS: "bg-emerald-500",
    EMERGENCY: "bg-blue-500",
    INVESTMENT: "bg-violet-500",
  };

  const goalIcons: Record<string, string> = {
    SAVINGS: "Target",
    EMERGENCY: "Shield",
    INVESTMENT: "TrendingUp",
  };

  const goals = goalsRaw.map((g) => {
    const percent =
      g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
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

  let portfolio = {
    totalValue: 0,
    cashBalance: 0,
    change: 0,
    changePercent: 2.4,
    allocation: [] as { name: string; percent: number; color: string }[],
    topHoldings: [] as { name: string; value: number; change: number }[],
    isEmpty: true,
  };

  if (portfolioRaw) {
    const trades = await prisma.trade.findMany({
      where: { portfolioId: portfolioRaw.id },
      select: { symbol: true, totalAmount: true },
      orderBy: { totalAmount: "desc" },
      take: 3,
    });

    const invested = trades.reduce((sum, t) => sum + t.totalAmount, 0);
    const total = portfolioRaw.totalValue || portfolioRaw.cashBalance + invested;

    portfolio = {
      totalValue: total,
      cashBalance: portfolioRaw.cashBalance,
      change: Math.round(total * 0.024),
      changePercent: 2.4,
      allocation: [
        {
          name: "Equity",
          percent: total > 0 ? Math.round((invested / total) * 100) : 0,
          color: "bg-teal-500",
        },
        {
          name: "Cash",
          percent: total > 0 ? Math.round((portfolioRaw.cashBalance / total) * 100) : 100,
          color: "bg-emerald-500",
        },
      ].filter((a) => a.percent > 0),
      topHoldings: trades.map((t) => ({
        name: t.symbol,
        value: t.totalAmount,
        change: 1.8,
      })),
      isEmpty: false,
    };
  }

  const monthlyIncome = profile?.income ?? 0;
  const savingsBalance = goals.reduce((sum, g) => sum + g.current, 0);
  const debt = savingsBalance > 0 || portfolio.totalValue > 0 ? 20_000 : 0;
  const netWorth = computeNetWorth(savingsBalance, portfolio.totalValue, debt);
  const savingsRate = computeSavingsRate(monthlyIncome, totalExpenses);

  const twinSnapshot = activeTwin?.snapshot as { netWorth?: number } | null;

  return {
    user,
    profile: profile
      ? {
          income: profile.income ?? 0,
          currency: profile.currency,
          riskAppetite: profile.riskAppetite,
          xp: profile.xp,
          streak: profile.streak,
        }
      : null,
    netWorth,
    netWorthChange: portfolio.change,
    netWorthChangePercent: portfolio.changePercent,
    monthlyIncome,
    monthlyExpenses: totalExpenses,
    savingsRate,
    healthScore: {
      score: healthScore.score,
      label: healthScore.label,
      breakdown: healthScore.breakdown,
      grade: healthScore.grade,
    },
    expenses: { total: totalExpenses, categories },
    portfolio,
    goals,
    expensesList: expensesList.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
    })),
    goalsList: goalsList.map((g) => ({
      ...g,
      deadline: g.deadline?.toISOString() ?? null,
      createdAt: g.createdAt.toISOString(),
    })),
    goalsTotal: goalsList.length,
    fraudStats: {
      scanCount: fraudReports.length,
      highRiskCount: fraudReports.filter((r) => r.riskScore > 60).length,
    },
    twinStats: {
      hasTwin: !!activeTwin,
      healthScore: activeTwin?.healthScore ?? healthScore.score,
      netWorth: twinSnapshot?.netWorth ?? netWorth,
      twinName: activeTwin?.name ?? null,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const data = await getDashboardData(session.user.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <DashboardHeader user={data.user} />

        <KPICards
          netWorth={data.netWorth}
          netWorthChange={data.netWorthChange}
          netWorthChangePercent={data.netWorthChangePercent}
          monthlyIncome={data.monthlyIncome}
          monthlyExpenses={data.monthlyExpenses}
          savingsRate={data.savingsRate}
        />

        <div className="grid gap-6 lg:grid-cols-4">
          <LevelCard xp={data.profile?.xp ?? 0} streak={data.profile?.streak ?? 0} />
          <HealthScoreCard healthScore={data.healthScore} />
          <AIAdvisorCard userId={session.user.id} />
          <QuickActionsCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ExpenseSummaryCard expenses={data.expenses} />
          <PortfolioCard portfolio={data.portfolio} />
          <GoalsCard goals={data.goals} totalGoals={data.goalsTotal} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FraudShieldCard
            scanCount={data.fraudStats.scanCount}
            highRiskCount={data.fraudStats.highRiskCount}
          />
          <FinancialTwinCard
            hasTwin={data.twinStats.hasTwin}
            healthScore={data.twinStats.healthScore}
            netWorth={data.twinStats.netWorth}
            twinName={data.twinStats.twinName ?? undefined}
          />
        </div>

        <div id="expenses" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300">Recent Expenses</h3>
              {data.expensesList.length >= 5 && (
                <Link href="#expenses" className="text-xs text-teal-400 hover:text-teal-300">
                  View all →
                </Link>
              )}
            </div>
            <ExpenseList expenses={data.expensesList} />
          </div>

          <div id="goals" className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300">All Goals</h3>
              {data.goalsTotal > 4 && (
                <span className="text-xs text-zinc-500">{data.goalsTotal} total</span>
              )}
            </div>
            <GoalList goals={data.goalsList} />
          </div>
        </div>
      </div>
    </main>
  );
}
