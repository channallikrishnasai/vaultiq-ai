import { prisma } from "@/lib/prisma";
import { marketService } from "@/services/market/market.service";
import { logger } from "@/lib/logger";
import type {
  SearchResult,
  SearchResponse,
  SearchFilters,
  SearchEntityType,
} from "@/types/financial-hub";

const TAG = "SearchService";

class SearchServiceImpl {
  async search(userId: string, query: string, filters?: SearchFilters): Promise<SearchResponse> {
    if (!query || query.trim().length < 1) {
      return { results: [], grouped: {} as Record<SearchEntityType, SearchResult[]>, total: 0, query, filters };
    }

    const lower = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    const [transactionResults, goalResults, budgetResults, documentResults, stockResults, alertResults, incomeResults] =
      await Promise.all([
        this.searchTransactions(userId, lower, filters),
        this.searchGoals(userId, lower, filters),
        this.searchBudgets(userId, lower, filters),
        this.searchDocuments(userId, lower, filters),
        this.searchStocks(userId, lower),
        this.searchAlerts(userId, lower),
        this.searchIncomes(userId, lower, filters),
      ]);

    results.push(
      ...transactionResults,
      ...goalResults,
      ...budgetResults,
      ...documentResults,
      ...stockResults,
      ...alertResults,
      ...incomeResults,
    );

    results.sort((a, b) => b.relevance - a.relevance);

    const grouped = this.groupResults(results);

    return {
      results,
      grouped,
      total: results.length,
      query,
      filters,
    };
  }

  private async searchTransactions(
    userId: string,
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResult[]> {
    try {
      const where: Record<string, unknown> = { userId };
      if (filters?.dateFrom || filters?.dateTo) {
        where.date = {};
        if (filters.dateFrom) (where.date as Record<string, Date>).gte = new Date(filters.dateFrom);
        if (filters.dateTo) (where.date as Record<string, Date>).lte = new Date(filters.dateTo);
      }
      if (filters?.category) {
        where.category = { contains: filters.category };
      }

      const expenses = await prisma.expense.findMany({
        where: {
          ...where,
          OR: [
            { category: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        take: 10,
        orderBy: { date: "desc" },
      });

      return expenses.map((e) => ({
        id: e.id,
        entityType: "expense" as SearchEntityType,
        title: e.category,
        subtitle: e.notes || `₹${e.amount.toLocaleString("en-IN")}`,
        value: e.amount,
        date: e.date.toISOString(),
        icon: "Receipt",
        color: "text-red-500",
        relevance: this.calculateRelevance(query, e.category + " " + (e.notes || "")),
        data: { category: e.category, amount: e.amount },
      }));
    } catch (error) {
      logger.error(TAG, "Transaction search failed", error);
      return [];
    }
  }

  private async searchGoals(
    userId: string,
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResult[]> {
    try {
      const goals = await prisma.goal.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query } },
          ],
        },
        take: 10,
      });

      return goals.map((g) => ({
        id: g.id,
        entityType: "goal" as SearchEntityType,
        title: g.name,
        subtitle: `${g.type} - ₹${g.currentAmount.toLocaleString("en-IN")} / ₹${g.targetAmount.toLocaleString("en-IN")}`,
        value: g.targetAmount,
        date: g.deadline?.toISOString(),
        icon: "Target",
        color: "text-blue-500",
        relevance: this.calculateRelevance(query, g.name + " " + g.type),
        data: { type: g.type, current: g.currentAmount, target: g.targetAmount },
      }));
    } catch (error) {
      logger.error(TAG, "Goal search failed", error);
      return [];
    }
  }

  private async searchBudgets(
    userId: string,
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResult[]> {
    try {
      const now = new Date();
      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          category: { contains: query },
        },
        take: 10,
      });

      return budgets.map((b) => ({
        id: b.id,
        entityType: "budget" as SearchEntityType,
        title: b.category,
        subtitle: `Budget: ₹${b.limit.toLocaleString("en-IN")}`,
        value: b.limit,
        icon: "Wallet",
        color: "text-green-500",
        relevance: this.calculateRelevance(query, b.category),
        data: { category: b.category, limit: b.limit },
      }));
    } catch (error) {
      logger.error(TAG, "Budget search failed", error);
      return [];
    }
  }

  private async searchDocuments(
    userId: string,
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResult[]> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          userId,
          OR: [
            { fileName: { contains: query } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      return documents.map((d) => ({
        id: d.id,
        entityType: "document" as SearchEntityType,
        title: d.fileName,
        subtitle: d.category.replace(/_/g, " "),
        icon: "FileText",
        color: "text-purple-500",
        relevance: this.calculateRelevance(query, d.name + " " + d.category),
        data: { category: d.category, status: d.status },
      }));
    } catch (error) {
      logger.error(TAG, "Document search failed", error);
      return [];
    }
  }

  private async searchStocks(userId: string, query: string): Promise<SearchResult[]> {
    try {
      const results = await marketService.search(query);
      return results.slice(0, 5).map((r) => ({
        id: r.symbol,
        entityType: "stock" as SearchEntityType,
        title: r.symbol,
        subtitle: r.name,
        icon: "TrendingUp",
        color: "text-emerald-500",
        relevance: this.calculateRelevance(query, r.symbol + " " + r.name),
        data: { symbol: r.symbol, name: r.name },
      }));
    } catch (error) {
      logger.error(TAG, "Stock search failed", error);
      return [];
    }
  }

  private async searchAlerts(userId: string, query: string): Promise<SearchResult[]> {
    try {
      const alerts = await prisma.alert.findMany({
        where: {
          userId,
          OR: [
            { symbol: { contains: query } },
            { companyName: { contains: query } },
          ],
        },
        take: 10,
      });

      return alerts.map((a) => ({
        id: a.id,
        entityType: "alert" as SearchEntityType,
        title: `${a.symbol} Alert`,
        subtitle: `${a.type} @ ₹${a.threshold}`,
        value: a.threshold,
        icon: "Bell",
        color: "text-yellow-500",
        relevance: this.calculateRelevance(query, a.symbol + " " + (a.companyName || "")),
        data: { symbol: a.symbol, type: a.type, threshold: a.threshold },
      }));
    } catch (error) {
      logger.error(TAG, "Alert search failed", error);
      return [];
    }
  }

  private async searchIncomes(
    userId: string,
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResult[]> {
    try {
      const incomes = await prisma.income.findMany({
        where: {
          userId,
          OR: [
            { category: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        take: 10,
        orderBy: { date: "desc" },
      });

      return incomes.map((i) => ({
        id: i.id,
        entityType: "income" as SearchEntityType,
        title: i.category,
        subtitle: i.notes || `₹${i.amount.toLocaleString("en-IN")}`,
        value: i.amount,
        date: i.date.toISOString(),
        icon: "ArrowDownLeft",
        color: "text-green-600",
        relevance: this.calculateRelevance(query, i.category + " " + (i.notes || "")),
        data: { category: i.category, amount: i.amount },
      }));
    } catch (error) {
      logger.error(TAG, "Income search failed", error);
      return [];
    }
  }

  private calculateRelevance(query: string, text: string): number {
    const lower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    if (lower === queryLower) return 100;
    if (lower.startsWith(queryLower)) return 90;
    if (lower.includes(queryLower)) return 70;

    const queryWords = queryLower.split(/\s+/);
    const matchCount = queryWords.filter((w) => lower.includes(w)).length;
    return Math.round((matchCount / queryWords.length) * 60);
  }

  private groupResults(results: SearchResult[]): Record<SearchEntityType, SearchResult[]> {
    const grouped = {} as Record<SearchEntityType, SearchResult[]>;
    for (const result of results) {
      if (!grouped[result.entityType]) {
        grouped[result.entityType] = [];
      }
      grouped[result.entityType].push(result);
    }
    return grouped;
  }

  async getSearchSuggestions(userId: string): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      const [goals, budgets, documents] = await Promise.all([
        prisma.goal.findMany({ where: { userId }, select: { name: true }, take: 5 }),
        prisma.budget.findMany({ where: { userId }, select: { category: true }, take: 5 }),
        prisma.document.findMany({ where: { userId }, select: { fileName: true }, take: 5 }),
      ]);

      suggestions.push(...goals.map((g) => g.name));
      suggestions.push(...budgets.map((b) => b.category));
      suggestions.push(...documents.map((d) => d.fileName));

      suggestions.push("Reliance", "Emergency Fund", "Salary Slip", "Netflix", "Budget", "Portfolio");
    } catch (error) {
      logger.error(TAG, "Failed to get suggestions", error);
    }

    return [...new Set(suggestions)].slice(0, 15);
  }
}

export const searchService = new SearchServiceImpl();
