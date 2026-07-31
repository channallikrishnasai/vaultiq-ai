import { prisma } from "@/lib/prisma";
import type {
  NetWorthSnapshot,
  NetWorthTrend,
  AssetEntry,
  LiabilityEntry,
  AssetType,
  LiabilityType,
} from "@/types/financial-hub";

const ASSET_TYPE_MAP: Record<string, AssetType> = {
  savings: "bank_savings",
  current: "bank_current",
  mutual_fund: "mutual_fund",
  stock: "stock",
  crypto: "crypto",
  property: "property",
  fixed_deposit: "fixed_deposit",
  ppf: "ppf",
  nps: "nps",
  gold: "gold",
};

export const netWorthService = {
  async getSnapshot(userId: string): Promise<NetWorthSnapshot> {
    const [profile, goals, portfolios, bills] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.portfolio.findMany({
        where: { userId },
        include: { trades: { orderBy: { executedAt: "desc" } } },
      }),
      prisma.bill.findMany({ where: { userId, paid: false } }),
    ]);

    const assets = this.buildAssets(profile, goals, portfolios);
    const liabilities = this.buildLiabilities(bills, profile);

    const totalAssets = assets.reduce((s, a) => s + a.value, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);

    return {
      timestamp: new Date().toISOString(),
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assets,
      liabilities,
      breakdown: {
        assetByType: this.groupByType(assets, totalAssets),
        liabilityByType: this.groupLiabilityByType(liabilities, totalLiabilities),
      },
    };
  },

  async getTrend(userId: string, days = 90): Promise<NetWorthTrend[]> {
    const now = new Date();
    const start = new Date(now.getTime() - days * 86400000);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: start } },
      select: { amount: true, date: true },
    });
    const incomes = await prisma.income.findMany({
      where: { userId, date: { gte: start } },
      select: { amount: true, date: true },
    });

    const dailyNet: Record<string, { assets: number; liabilities: number }> = {};

    const current = new Date(start);
    let runningNet = 0;
    while (current <= now) {
      const key = current.toISOString().split("T")[0];
      const dayExpenses = expenses
        .filter((e) => e.date.toISOString().split("T")[0] === key)
        .reduce((s, e) => s + e.amount, 0);
      const dayIncome = incomes
        .filter((i) => i.date.toISOString().split("T")[0] === key)
        .reduce((s, i) => s + i.amount, 0);
      runningNet += dayIncome - dayExpenses;
      dailyNet[key] = { assets: runningNet, liabilities: 0 };
      current.setDate(current.getDate() + 1);
    }

    const snapshot = await this.getSnapshot(userId);
    const baseAssets = snapshot.totalAssets - runningNet;

    return Object.entries(dailyNet).map(([date, d]) => ({
      date,
      assets: baseAssets + d.assets,
      liabilities: snapshot.totalLiabilities,
      netWorth: baseAssets + d.assets - snapshot.totalLiabilities,
    }));
  },

  buildAssets(
    profile: { income?: number | null } | null,
    goals: { targetAmount: number; currentAmount: number; type: string }[],
    portfolios: { name?: string; cashBalance: number; totalValue: number; trades: { type: string; totalAmount: number }[] }[],
  ): AssetEntry[] {
    const assets: AssetEntry[] = [];
    let id = 0;

    const totalSaved = goals
      .filter((g) => g.type === "SAVINGS" || g.type === "EMERGENCY")
      .reduce((s, g) => s + g.currentAmount, 0);
    if (totalSaved > 0) {
      assets.push({
        id: String(++id),
        name: "Savings & Emergency Fund",
        type: "cash",
        value: totalSaved,
      });
    }

    for (const p of portfolios) {
      if (p.cashBalance > 0) {
        assets.push({
          id: String(++id),
          name: "Portfolio Cash",
          type: "cash",
          value: p.cashBalance,
        });
      }
      if (p.totalValue > p.cashBalance) {
        assets.push({
          id: String(++id),
          name: p.name || "Investments",
          type: "stock",
          value: p.totalValue - p.cashBalance,
        });
      }
    }

    const investmentGoals = goals.filter((g) => g.type === "INVESTMENT");
    const investTotal = investmentGoals.reduce((s, g) => s + g.currentAmount, 0);
    if (investTotal > 0 && portfolios.length === 0) {
      assets.push({
        id: String(++id),
        name: "Investments",
        type: "mutual_fund",
        value: investTotal,
      });
    }

    return assets;
  },

  buildLiabilities(
    bills: { name: string; amount: number; category: string }[],
    profile: { income?: number | null } | null,
  ): LiabilityEntry[] {
    const liabilities: LiabilityEntry[] = [];
    let id = 0;

    const loanBills = bills.filter(
      (b) =>
        b.category.toLowerCase().includes("loan") ||
        b.category.toLowerCase().includes("emi") ||
        b.name.toLowerCase().includes("loan"),
    );
    for (const b of loanBills) {
      liabilities.push({
        id: String(++id),
        name: b.name,
        type: "personal_loan",
        balance: b.amount,
        institution: b.category,
      });
    }

    const creditCardBills = bills.filter(
      (b) =>
        b.category.toLowerCase().includes("credit") ||
        b.name.toLowerCase().includes("credit card"),
    );
    for (const b of creditCardBills) {
      liabilities.push({
        id: String(++id),
        name: b.name,
        type: "credit_card",
        balance: b.amount,
      });
    }

    return liabilities;
  },

  groupByType(
    assets: AssetEntry[],
    total: number,
  ): { type: AssetType; value: number; percent: number }[] {
    const grouped: Record<string, number> = {};
    for (const a of assets) {
      grouped[a.type] = (grouped[a.type] || 0) + a.value;
    }
    return Object.entries(grouped)
      .map(([type, value]) => ({
        type: type as AssetType,
        value,
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  },

  groupLiabilityByType(
    liabilities: LiabilityEntry[],
    total: number,
  ): { type: LiabilityType; balance: number; percent: number }[] {
    const grouped: Record<string, number> = {};
    for (const l of liabilities) {
      grouped[l.type] = (grouped[l.type] || 0) + l.balance;
    }
    return Object.entries(grouped)
      .map(([type, balance]) => ({
        type: type as LiabilityType,
        balance,
        percent: total > 0 ? Math.round((balance / total) * 100) : 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  },
};
