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
        <WelcomeCard />

        {/* Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <HealthScoreCard />
          <AIAdvisorCard />
        </div>

        {/* Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ExpenseSummaryCard />
          <PortfolioCard />
          <GoalsCard />
        </div>
      </div>
    </main>
  );
}