import WelcomeCard from "@/components/dashboard/WelcomeCard";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import AIAdvisorCard from "@/components/dashboard/AIAdvisorCard";
import ExpenseSummaryCard from "@/components/dashboard/ExpenseSummaryCard";
import PortfolioCard from "@/components/dashboard/PortfolioCard";
import GoalsCard from "@/components/dashboard/GoalsCard";
import { Shield } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
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

        {/* Welcome Hero */}
        <WelcomeCard
  user={{
    name: "Krishna",
    email: "krishna@example.com",
    image: null,
  }}
  greeting="Good Evening"
  netWorth={4825000}
  netWorthChange={120000}
  netWorthChangePercent={2.5}
  profile={{
    income: 185000,
    currency: "INR",
    riskAppetite: "Moderate",
    xp: 240,
    streak: 12,
  }}
/>

        {/* Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <HealthScoreCard
  healthScore={{
    score: 785,
    label: "Excellent",
    breakdown: [
      { name: "Savings", value: 85 },
      { name: "Debt", value: 72 },
      { name: "Invest", value: 78 },
      { name: "Protect", value: 90 },
      { name: "Spend", value: 68 },
      { name: "Plan", value: 82 },
    ],
  }}
/>
          <AIAdvisorCard userId="demo-user" />
        </div>

        {/* Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ExpenseSummaryCard
  expenses={{
    total: 142000,
    categories: [
      { name: "Housing", amount: 45000, color: "bg-violet-500", percent: 32 },
      { name: "Food", amount: 28000, color: "bg-teal-500", percent: 20 },
      { name: "Transport", amount: 18000, color: "bg-blue-500", percent: 13 },
      { name: "Shopping", amount: 22000, color: "bg-amber-500", percent: 15 },
      { name: "Entertainment", amount: 15000, color: "bg-rose-500", percent: 11 },
      { name: "Others", amount: 14000, color: "bg-zinc-600", percent: 9 },
    ],
  }}
/>
          <PortfolioCard
  portfolio={{
    totalValue: 3250000,
    cashBalance: 250000,
    change: 85000,
    changePercent: 2.7,
    allocation: [
      { name: "Equity", percent: 45, color: "bg-teal-500" },
      { name: "Debt", percent: 30, color: "bg-blue-500" },
      { name: "Gold", percent: 15, color: "bg-amber-500" },
      { name: "Cash", percent: 10, color: "bg-emerald-500" },
    ],
    topHoldings: [
      { name: "Reliance", value: 485000, change: 1.2 },
      { name: "HDFC Bank", value: 320000, change: 0.8 },
      { name: "Nifty 50 ETF", value: 275000, change: 1.5 },
    ],
    isEmpty: false,
  }}
/>
         <GoalsCard
  goals={[
    {
      id: "1",
      name: "Emergency Fund",
      target: 500000,
      current: 400000,
      color: "bg-emerald-500",
      icon: "Shield",
      percent: 80,
    },
    {
      id: "2",
      name: "Europe Trip",
      target: 800000,
      current: 360000,
      color: "bg-blue-500",
      icon: "Target",
      percent: 45,
    },
    {
      id: "3",
      name: "Home Down Payment",
      target: 2500000,
      current: 500000,
      color: "bg-violet-500",
      icon: "Home",
      percent: 20,
    },
  ]}
/>
        </div>
      </div>
    </main>
  );
}