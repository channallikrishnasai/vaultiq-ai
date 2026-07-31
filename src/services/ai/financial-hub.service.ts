import { prisma } from "@/lib/prisma";
import { netWorthService } from "@/services/finance/net-worth.service";
import { healthScoreService } from "@/services/finance/health-score.service";
import { watchlistService } from "@/services/market/watchlist.service";
import { alertService } from "@/services/market/alert.service";
import { bankAggregationService } from "@/services/bank/bank-provider";
import { searchService } from "./search.service";
import { actionAgent } from "./action-agent.service";
import { memoryService } from "./memory.service";
import { logger } from "@/lib/logger";
import type {
  FinancialHubData,
  NetWorthSnapshot,
  NetWorthTrend,
  BankAccount,
  QuickAction,
  AgentActivity,
} from "@/types/financial-hub";

const TAG = "FinancialHub";

class FinancialHubServiceImpl {
  async getHubData(userId: string): Promise<FinancialHubData> {
    try {
      const [netWorth, bankAccounts, recentTransactions, searchSuggestions, agentActivity] =
        await Promise.all([
          netWorthService.getSnapshot(userId).catch(() => this.getEmptyNetWorth()),
          bankAggregationService.getConnectedAccounts(userId).catch(() => []),
          this.getRecentTransactions(userId).catch(() => []),
          searchService.getSearchSuggestions(userId).catch(() => []),
          this.getRecentAgentActivity(userId).catch(() => []),
        ]);

      const quickActions: QuickAction[] = [
        { id: "qa-1", label: "Add to Watchlist", icon: "Star", action: "add_watchlist" },
        { id: "qa-2", label: "Create Goal", icon: "Target", action: "create_goal" },
        { id: "qa-3", label: "Set Alert", icon: "Bell", action: "create_alert" },
        { id: "qa-4", label: "Create Budget", icon: "Wallet", action: "create_budget" },
        { id: "qa-5", label: "Virtual Trade", icon: "BarChart3", action: "create_virtual_trade" },
      ];

      return {
        netWorth,
        bankAccounts,
        recentTransactions,
        searchSuggestions,
        quickActions,
        agentActivity,
      };
    } catch (error) {
      logger.error(TAG, "Failed to get hub data", error);
      throw error;
    }
  }

  async getNetWorthTrend(userId: string, days = 90): Promise<NetWorthTrend[]> {
    return netWorthService.getTrend(userId, days);
  }

  async getNetWorthSnapshot(userId: string): Promise<NetWorthSnapshot> {
    return netWorthService.getSnapshot(userId);
  }

  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return bankAggregationService.getConnectedAccounts(userId);
  }

  async getDashboardSummary(userId: string) {
    const [snapshot, healthScore, watchlist, alerts] = await Promise.all([
      netWorthService.getSnapshot(userId),
      healthScoreService.calculate(userId).catch(() => ({
        score: 0, grade: "F" as const, label: "Unknown",
        breakdown: [], factors: [], summary: "",
      })),
      watchlistService.getWatchlistSummary(userId).catch(() => ({
        items: [], totalItems: 0, favoritesCount: 0,
        topGainer: null, topLoser: null, totalValue: 0,
        dailyChange: 0, dailyChangePercent: 0,
      })),
      alertService.getActiveAlerts(userId).catch(() => []),
    ]);

    return {
      netWorth: snapshot.netWorth,
      totalAssets: snapshot.totalAssets,
      totalLiabilities: snapshot.totalLiabilities,
      healthScore: healthScore.score,
      healthGrade: healthScore.grade,
      watchlistCount: watchlist.totalItems,
      activeAlertCount: alerts.length,
      assetBreakdown: snapshot.breakdown.assetByType,
      liabilityBreakdown: snapshot.breakdown.liabilityByType,
    };
  }

  private async getRecentTransactions(userId: string) {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
      select: {
        id: true,
        category: true,
        amount: true,
        date: true,
        notes: true,
      },
    });

    return expenses.map((e) => ({
      id: e.id,
      accountId: "local",
      date: e.date.toISOString(),
      description: e.notes || e.category,
      amount: e.amount,
      type: "debit" as const,
      category: e.category,
    }));
  }

  private async getRecentAgentActivity(userId: string): Promise<AgentActivity[]> {
    const recentActions = actionAgent.getRecentActions(userId, 5);
    return recentActions.map((a) => ({
      id: a.request.id,
      type: a.request.type,
      description: a.preview?.description || a.request.type,
      status: a.status,
      timestamp: a.createdAt,
    }));
  }

  private getEmptyNetWorth(): NetWorthSnapshot {
    return {
      timestamp: new Date().toISOString(),
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      assets: [],
      liabilities: [],
      breakdown: { assetByType: [], liabilityByType: [] },
    };
  }
}

export const financialHubService = new FinancialHubServiceImpl();
