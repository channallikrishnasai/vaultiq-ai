import { buildFinancialContext } from "./financial-context.service";
import { alertService } from "@/services/market/alert.service";
import { healthScoreService } from "@/services/finance/health-score.service";
import type { FinancialContext } from "./financial-context.service";

export interface CopilotRecommendation {
  id: string;
  category: "spending" | "savings" | "goals" | "investments" | "risk" | "market";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionLabel: string;
  actionHref: string;
}

export interface CopilotMarketSummary {
  hasWatchlist: boolean;
  topGainer: { symbol: string; changePercent: number } | null;
  topLoser: { symbol: string; changePercent: number } | null;
  biggestOpportunity: { symbol: string; reason: string } | null;
  activeAlertCount: number;
  triggeredAlertCount: number;
  marketStatus: "open" | "closed";
  watchlistMovers: number;
}

export interface CopilotHealthSummary {
  emergencyFundCoverage: number;
  emergencyFundStatus: string;
  savingsProgress: number;
  debtStatus: string;
  goalCompletion: number;
  healthTrend: string;
  healthScore: number;
  healthGrade: string;
}

export interface CopilotActionSuggestion {
  id: string;
  icon: string;
  label: string;
  description: string;
  href: string;
  category: string;
}

export interface CopilotCelebration {
  id: string;
  icon: string;
  title: string;
  message: string;
  category: "milestone" | "achievement" | "streak" | "improvement";
}

export interface CopilotWarning {
  id: string;
  icon: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  actionLabel?: string;
  actionHref?: string;
}

export interface CopilotBriefing {
  greeting: string;
  userName: string;
  contextLine: string;
  netWorth: number;
  savingsRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  healthScore: number;
  healthGrade: string;
  healthLabel: string;
  emergencyFundProgress: number;
  emergencyFundTarget: number;
  goalProgress: number;
  watchlistSummary: CopilotMarketSummary;
  activeAlerts: { symbol: string; type: string; message: string | null }[];
  keyInsight: string;
  celebrations: CopilotCelebration[];
  warnings: CopilotWarning[];
  recommendations: CopilotRecommendation[];
  marketSummary: CopilotMarketSummary;
  healthSummary: CopilotHealthSummary;
  actionSuggestions: CopilotActionSuggestion[];
  generatedAt: string;
}

// ── Time-aware greeting ──────────────────────────────────────────────────────

function getTimeContext(): { period: "morning" | "afternoon" | "evening"; hour: number } {
  const hour = new Date().getHours();
  if (hour < 12) return { period: "morning", hour };
  if (hour < 17) return { period: "afternoon", hour };
  return { period: "evening", hour };
}

function getGreeting(): string {
  const { period } = getTimeContext();
  const greetings = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
  };
  return greetings[period];
}

// ── Market hours (IST: 9:15 AM – 3:30 PM, Mon–Fri) ─────────────────────────

function getMarketStatus(): "open" | "closed" {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) - now.getTimezoneOffset() * 60 * 1000);
  const day = ist.getDay();
  if (day === 0 || day === 6) return "closed";
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  return minutes >= 555 && minutes <= 930 ? "open" : "closed";
}

// ── Context line ─────────────────────────────────────────────────────────────

function generateContextLine(
  ctx: FinancialContext,
  marketStatus: "open" | "closed",
): string {
  const parts: string[] = [];
  const { period } = getTimeContext();

  if (period === "morning") {
    parts.push("Start your day with a financial snapshot");
  } else if (period === "afternoon") {
    parts.push("Midday check-in on your finances");
  } else {
    parts.push("End-of-day financial recap");
  }

  if (marketStatus === "open" && ctx.watchlist.items.length > 0) {
    const movers = ctx.watchlist.items.filter((i) => i.changePercent !== null && Math.abs(i.changePercent ?? 0) > 1);
    if (movers.length > 0) {
      parts.push(`markets open — ${movers.length} watchlist ${movers.length === 1 ? "stock is" : "stocks are"} moving`);
    } else {
      parts.push("markets open — your watchlist is steady");
    }
  } else if (marketStatus === "closed" && ctx.watchlist.items.length > 0) {
    parts.push("markets closed — reviewing today's activity");
  }

  return parts.join(" · ");
}

// ── Celebrations ─────────────────────────────────────────────────────────────

function generateCelebrations(ctx: FinancialContext, healthScore: { score: number }): CopilotCelebration[] {
  const celebrations: CopilotCelebration[] = [];

  // Emergency fund milestones
  const emergencyMonths = ctx.emergencyFund.monthsCovered;
  if (emergencyMonths >= 6 && ctx.emergencyFund.status === "excellent") {
    celebrations.push({
      id: "emergency-excellent",
      icon: "Shield",
      title: "Emergency fund fully funded",
      message: `You've built ${emergencyMonths.toFixed(1)} months of expense coverage — exceptional financial resilience.`,
      category: "milestone",
    });
  } else if (emergencyMonths >= 3 && emergencyMonths < 6) {
    celebrations.push({
      id: "emergency-3months",
      icon: "Shield",
      title: "Emergency fund hit 3-month target",
      message: `${emergencyMonths.toFixed(1)} months covered — your safety net is growing strong.`,
      category: "milestone",
    });
  }

  // Goal completion
  const completedGoals = ctx.goals.filter((g) => g.percent >= 100);
  completedGoals.forEach((g) => {
    celebrations.push({
      id: `goal-done-${g.id}`,
      icon: "Target",
      title: `"${g.name}" completed`,
      message: `You've reached your ₹${g.target.toLocaleString("en-IN")} target — incredible discipline.`,
      category: "achievement",
    });
  });

  // Near-completion goals (90%+)
  const nearCompleteGoals = ctx.goals.filter((g) => g.percent >= 90 && g.percent < 100);
  nearCompleteGoals.forEach((g) => {
    celebrations.push({
      id: `goal-near-${g.id}`,
      icon: "Target",
      title: `"${g.name}" almost there`,
      message: `${g.percent}% done — just ₹${g.remaining.toLocaleString("en-IN")} to go.`,
      category: "milestone",
    });
  });

  // Savings streak (profile.streak)
  if (ctx.profile && ctx.profile.streak >= 7) {
    celebrations.push({
      id: "savings-streak",
      icon: "Flame",
      title: `${ctx.profile.streak}-day savings streak`,
      message: "Consistent tracking builds wealth — you're on a roll.",
      category: "streak",
    });
  }

  // Health score improvement threshold
  if (healthScore.score >= 80) {
    celebrations.push({
      id: "health-excellent",
      icon: "Heart",
      title: "Excellent health score",
      message: `Score ${healthScore.score}/100 — your financial health is outstanding.`,
      category: "improvement",
    });
  } else if (healthScore.score >= 65) {
    celebrations.push({
      id: "health-good",
      icon: "Heart",
      title: "Good financial health",
      message: `Score ${healthScore.score}/100 — you're on a solid path.`,
      category: "improvement",
    });
  }

  // High savings rate
  if (ctx.savings.savingsRate >= 30) {
    celebrations.push({
      id: "high-savings",
      icon: "TrendingUp",
      title: `${ctx.savings.savingsRate}% savings rate`,
      message: "You're saving nearly a third of your income — outstanding.",
      category: "achievement",
    });
  }

  return celebrations.slice(0, 3);
}

// ── Smart Warnings ───────────────────────────────────────────────────────────

function generateWarnings(
  ctx: FinancialContext,
  marketStatus: "open" | "closed",
): CopilotWarning[] {
  const warnings: CopilotWarning[] = [];

  // Overspending: expenses > income
  if (ctx.income.currentMonth > 0 && ctx.expenses.currentMonth > ctx.income.currentMonth) {
    const overage = ctx.expenses.currentMonth - ctx.income.currentMonth;
    warnings.push({
      id: "overspending",
      icon: "AlertTriangle",
      title: "Overspending this month",
      message: `Expenses exceed income by ₹${overage.toLocaleString("en-IN")} — review your spending.`,
      severity: "critical",
      actionLabel: "Review expenses",
      actionHref: "/dashboard/expenses",
    });
  }

  // Savings rate dropped below 10%
  if (ctx.savings.savingsRate < 10 && ctx.savings.savingsRate > 0 && ctx.income.currentMonth > 0) {
    warnings.push({
      id: "low-savings",
      icon: "TrendingDown",
      title: "Savings rate critically low",
      message: `At ${ctx.savings.savingsRate}%, your savings are well below the 20% target.`,
      severity: "critical",
      actionLabel: "Adjust budget",
      actionHref: "/dashboard/budgets",
    });
  }

  // Goal falling behind
  const behindGoals = ctx.goals.filter((g) => {
    if (!g.deadline) return false;
    const deadline = new Date(g.deadline);
    const monthsLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return monthsLeft > 0 && monthsLeft < 3 && g.percent < 80;
  });

  if (behindGoals.length > 0) {
    warnings.push({
      id: "goal-behind",
      icon: "Clock",
      title: `"${behindGoals[0].name}" deadline approaching`,
      message: `${behindGoals[0].percent}% complete with less than 3 months left.`,
      severity: "warning",
      actionLabel: "Review goal",
      actionHref: "/dashboard/goals",
    });
  }

  // High watchlist volatility (any stock moving > 3%)
  if (marketStatus === "open") {
    const volatile = ctx.watchlist.items.filter(
      (i) => i.changePercent !== null && Math.abs(i.changePercent ?? 0) > 3,
    );
    if (volatile.length > 0) {
      warnings.push({
        id: "watchlist-volatility",
        icon: "Activity",
        title: "High watchlist volatility",
        message: `${volatile.map((v) => v.symbol).join(", ")} ${volatile.length === 1 ? "is" : "are"} moving ±${Math.abs(volatile[0].changePercent ?? 0).toFixed(1)}%+ today.`,
        severity: "info",
      });
    }
  }

  // Emergency fund critical
  if (ctx.emergencyFund.status === "critical" && ctx.income.currentMonth > 0) {
    warnings.push({
      id: "emergency-critical",
      icon: "ShieldAlert",
      title: "Emergency fund not established",
      message: "No emergency savings — one unexpected expense could derail your finances.",
      severity: "warning",
      actionLabel: "Start building",
      actionHref: "/dashboard/goals",
    });
  }

  return warnings.slice(0, 3);
}

// ── Dynamic Daily Insight ────────────────────────────────────────────────────

function generateDailyInsight(ctx: FinancialContext): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
  );

  // Pool of contextual insights seeded by day-of-year for daily variety
  const pools: string[][] = [];

  if (ctx.savings.savingsRate >= 20) {
    pools.push([
      `At ${ctx.savings.savingsRate}% savings, you'll accumulate ₹${((ctx.savings.savingsRate / 100) * ctx.income.currentMonth * 12).toLocaleString("en-IN")} this year at current pace.`,
      `Your savings rate puts you ahead of ${ctx.savings.savingsRate >= 30 ? "90" : "70"}% of Indian savers.`,
      `Compounding your ₹${ctx.savings.totalSaved.toLocaleString("en-IN")} at 12% annually could grow to ₹${(ctx.savings.totalSaved * Math.pow(1.12, 5)).toFixed(0)} in 5 years.`,
    ]);
  } else if (ctx.savings.savingsRate > 0) {
    pools.push([
      `Increasing savings from ${ctx.savings.savingsRate}% to 20% would add ₹${(((0.2 - ctx.savings.savingsRate / 100) * ctx.income.currentMonth) * 12).toLocaleString("en-IN")} annually.`,
      `Even a 5% savings rate improvement adds ₹${((0.05 * ctx.income.currentMonth) * 12).toLocaleString("en-IN")}/year to your wealth.`,
    ]);
  }

  if (ctx.emergencyFund.status === "excellent") {
    pools.push([
      "Your fully-funded emergency fund means you can take calculated investment risks.",
      "With your safety net in place, consider exploring higher-return investment strategies.",
    ]);
  } else if (ctx.emergencyFund.monthsCovered > 0) {
    const monthsNeeded = Math.max(0, 6 - ctx.emergencyFund.monthsCovered);
    const monthlyNeeded = ctx.expenses.currentMonth > 0
      ? Math.ceil((ctx.expenses.currentMonth * monthsNeeded) / 3)
      : 0;
    pools.push([
      `Adding ₹${monthlyNeeded.toLocaleString("en-IN")}/month to your emergency fund would hit the 6-month target in 3 months.`,
      `Your emergency fund covers ${ctx.emergencyFund.monthsCovered.toFixed(1)} months — ${(6 - ctx.emergencyFund.monthsCovered).toFixed(1)} months to go.`,
    ]);
  }

  if (ctx.goals.length > 0) {
    const onTrack = ctx.goals.filter((g) => g.percent >= 50);
    if (onTrack.length === ctx.goals.length) {
      pools.push([
        `All ${ctx.goals.length} goals are 50%+ complete — you're ahead of schedule.`,
        `With ${ctx.goals.length} active goals, your financial discipline is building real momentum.`,
      ]);
    }
  }

  if (ctx.watchlist.items.length > 0 && ctx.watchlist.items.some((i) => (i.changePercent ?? 0) < -2)) {
    pools.push([
      "Market dips create buying opportunities — consider if any watchlist stocks fit your strategy.",
      "Volatility is the price of admission for long-term returns — stay focused on your goals.",
    ]);
  }

  if (pools.length === 0) {
    pools.push([
      "Track your income and expenses daily to unlock AI-powered financial insights.",
      "Setting clear financial goals is the first step toward building wealth.",
    ]);
  }

  // Use day-of-year as a simple seed to rotate through insights
  const allInsights = pools.flat();
  return allInsights[dayOfYear % allInsights.length];
}

// ── Existing helpers (unchanged) ─────────────────────────────────────────────

function generateRecommendations(ctx: FinancialContext): CopilotRecommendation[] {
  const recs: CopilotRecommendation[] = [];

  if (ctx.savings.savingsRate < 20 && ctx.profile?.monthlyIncome) {
    const targetSavings = ctx.profile.monthlyIncome * 0.2;
    const currentSavings = ctx.profile.monthlyIncome - ctx.expenses.currentMonth;
    const gap = targetSavings - currentSavings;
    recs.push({
      id: "increase-savings",
      category: "savings",
      title: "Boost your savings rate",
      description: `Increasing your monthly savings by ₹${gap.toLocaleString("en-IN")} would reach the 20% benchmark.`,
      priority: "high",
      actionLabel: "Review budget",
      actionHref: "/dashboard/budgets",
    });
  }

  if (ctx.emergencyFund.status === "critical" || ctx.emergencyFund.status === "needs_work") {
    const remaining = ctx.emergencyFund.target - ctx.emergencyFund.current;
    recs.push({
      id: "build-emergency",
      category: "savings",
      title: "Build your emergency fund",
      description: `₹${remaining.toLocaleString("en-IN")} away from your 6-month target. This is your financial safety net.`,
      priority: "high",
      actionLabel: "Set up auto-save",
      actionHref: "/dashboard/goals",
    });
  }

  const behindGoals = ctx.goals.filter((g) => {
    if (!g.deadline) return false;
    const deadline = new Date(g.deadline);
    const monthsLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return monthsLeft > 0 && g.monthlyNeeded && g.monthlyNeeded > (ctx.profile?.monthlyIncome ?? 0) * 0.3;
  });

  if (behindGoals.length > 0) {
    const goal = behindGoals[0];
    recs.push({
      id: "catch-up-goal",
      category: "goals",
      title: `Catch up on "${goal.name}"`,
      description: `This goal is behind schedule. Consider increasing your monthly contribution to ₹${goal.monthlyNeeded?.toLocaleString("en-IN")}.`,
      priority: "medium",
      actionLabel: "Adjust goal",
      actionHref: "/dashboard/goals",
    });
  }

  if (ctx.virtualPortfolio && ctx.virtualPortfolio.cashBalance > ctx.virtualPortfolio.totalValue * 0.6) {
    recs.push({
      id: "rebalance-portfolio",
      category: "investments",
      title: "Rebalance your virtual portfolio",
      description: `${Math.round((ctx.virtualPortfolio.cashBalance / ctx.virtualPortfolio.totalValue) * 100)}% is in cash. Practice different allocation strategies.`,
      priority: "medium",
      actionLabel: "Open portfolio",
      actionHref: "/dashboard/portfolio",
    });
  }

  if (ctx.watchlist.items.length === 0) {
    recs.push({
      id: "create-watchlist",
      category: "market",
      title: "Start a watchlist",
      description: "Track stocks you're interested in to monitor market movements and spot opportunities.",
      priority: "low",
      actionLabel: "Add stocks",
      actionHref: "/dashboard/portfolio",
    });
  }

  if (ctx.savings.savingsRate >= 20 && ctx.emergencyFund.status !== "critical") {
    recs.push({
      id: "explore-investments",
      category: "investments",
      title: "Explore investment opportunities",
      description: "With strong savings and an emergency fund, consider virtual trading to practice investment strategies.",
      priority: "low",
      actionLabel: "Start investing",
      actionHref: "/dashboard/investments",
    });
  }

  return recs.slice(0, 5);
}

function generateMarketSummary(
  watchlistItems: FinancialContext["watchlist"]["items"],
  alerts: FinancialContext["watchlist"]["alerts"],
): CopilotMarketSummary {
  if (watchlistItems.length === 0) {
    return {
      hasWatchlist: false,
      topGainer: null,
      topLoser: null,
      biggestOpportunity: null,
      activeAlertCount: alerts.length,
      triggeredAlertCount: 0,
      marketStatus: getMarketStatus(),
      watchlistMovers: 0,
    };
  }

  const withChanges = watchlistItems.filter((item) => item.changePercent !== null);
  const sorted = [...withChanges].sort(
    (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0),
  );

  const topGainer = sorted[0]
    ? { symbol: sorted[0].symbol, changePercent: sorted[0].changePercent ?? 0 }
    : null;
  const topLoser = sorted[sorted.length - 1]
    ? { symbol: sorted[sorted.length - 1].symbol, changePercent: sorted[sorted.length - 1].changePercent ?? 0 }
    : null;

  let biggestOpportunity: CopilotMarketSummary["biggestOpportunity"] = null;
  const favorites = watchlistItems.filter((i) => i.isFavorite);
  if (favorites.length > 0) {
    const best = favorites.reduce((prev, curr) =>
      (curr.changePercent ?? 0) < (prev.changePercent ?? 0) ? curr : prev,
    );
    if ((best.changePercent ?? 0) < -2) {
      biggestOpportunity = {
        symbol: best.symbol,
        reason: `Down ${Math.abs(best.changePercent ?? 0).toFixed(1)}% — potential buying opportunity`,
      };
    }
  }

  const movers = withChanges.filter((i) => Math.abs(i.changePercent ?? 0) > 1).length;

  return {
    hasWatchlist: true,
    topGainer,
    topLoser,
    biggestOpportunity,
    activeAlertCount: alerts.length,
    triggeredAlertCount: 0,
    marketStatus: getMarketStatus(),
    watchlistMovers: movers,
  };
}

function generateHealthSummary(
  ctx: FinancialContext,
  healthScore: { score: number; grade: string; label: string },
): CopilotHealthSummary {
  const avgGoalProgress =
    ctx.goals.length > 0
      ? Math.round(ctx.goals.reduce((sum, g) => sum + g.percent, 0) / ctx.goals.length)
      : 0;

  const emergencyStatusMap: Record<string, string> = {
    excellent: "Fully funded",
    adequate: "Meets minimum target",
    needs_work: "Needs growth",
    critical: "Below target",
    none: "Not established",
  };

  return {
    emergencyFundCoverage: ctx.emergencyFund.monthsCovered,
    emergencyFundStatus: emergencyStatusMap[ctx.emergencyFund.status] ?? "Unknown",
    savingsProgress: ctx.savings.savingsRate,
    debtStatus: "No outstanding debt",
    goalCompletion: avgGoalProgress,
    healthTrend: healthScore.score >= 65 ? "Stable" : "Needs attention",
    healthScore: healthScore.score,
    healthGrade: healthScore.grade,
  };
}

function generateActionSuggestions(ctx: FinancialContext): CopilotActionSuggestion[] {
  const actions: CopilotActionSuggestion[] = [];

  if (ctx.emergencyFund.status === "critical" || ctx.emergencyFund.status === "needs_work") {
    actions.push({
      id: "build-emergency-action",
      icon: "Shield",
      label: "Build emergency fund",
      description: "Set up auto-save to grow your safety net",
      href: "/dashboard/goals",
      category: "savings",
    });
  }

  if (ctx.savings.savingsRate < 20 && ctx.profile?.monthlyIncome) {
    actions.push({
      id: "increase-sip",
      icon: "TrendingUp",
      label: "Increase SIP",
      description: "Boost your systematic investment plan",
      href: "/dashboard/investments",
      category: "investments",
    });
  }

  if (ctx.watchlist.items.length < 3) {
    actions.push({
      id: "add-watchlist",
      icon: "Star",
      label: "Add to watchlist",
      description: "Track stocks you're interested in",
      href: "/dashboard/portfolio",
      category: "market",
    });
  }

  actions.push({
    id: "review-expenses",
    icon: "Receipt",
    label: "Review expenses",
    description: "Check your spending patterns this month",
    href: "/dashboard/expenses",
    category: "spending",
  });

  if (!ctx.virtualPortfolio || ctx.virtualPortfolio.invested === 0) {
    actions.push({
      id: "start-trading",
      icon: "BarChart3",
      label: "Start virtual trading",
      description: "Practice investing with virtual money",
      href: "/dashboard/portfolio",
      category: "investments",
    });
  } else {
    actions.push({
      id: "continue-trading",
      icon: "BarChart3",
      label: "Continue virtual trading",
      description: "Practice more investment strategies",
      href: "/dashboard/portfolio",
      category: "investments",
    });
  }

  return actions.slice(0, 5);
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateCopilotBriefing(userId: string): Promise<CopilotBriefing> {
  const [ctx, activeAlerts, healthScore, predData] = await Promise.all([
    buildFinancialContext(userId),
    alertService.getActiveAlerts(userId).catch(() => []),
    healthScoreService.calculate(userId).catch(() => ({
      score: 0,
      grade: "F" as const,
      label: "Unknown",
      breakdown: [],
      factors: [],
      summary: "",
    })),
    (async () => {
      try {
        const { predictiveFinanceService } = await import("@/services/predictive/predictive-finance.service");
        return await predictiveFinanceService.getPredictionsForCopilot(userId);
      } catch {
        return { alerts: [] as { title: string; message: string; severity: string }[], goalForecasts: [] as { name: string; advice: string; probability: number }[], cashFlowSummary: "" };
      }
    })(),
  ]);

  const goalProgress =
    ctx.goals.length > 0
      ? Math.round(ctx.goals.reduce((sum, g) => sum + g.percent, 0) / ctx.goals.length)
      : 0;

  const marketStatus = getMarketStatus();
  const marketSummary = generateMarketSummary(ctx.watchlist.items, ctx.watchlist.alerts);

  const topAlerts = activeAlerts.slice(0, 3).map((a) => ({
    symbol: a.symbol,
    type: a.type,
    message: a.message,
  }));

  const existingWarnings = generateWarnings(ctx, marketStatus);
  const predictiveWarnings: CopilotWarning[] = predData.alerts.slice(0, 2).map((a) => ({
    id: `pred-${a.title}`,
    icon: "TrendingUp",
    title: a.title,
    message: a.message,
    severity: a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "info",
  }));
  const allWarnings = [...existingWarnings, ...predictiveWarnings].slice(0, 5);

  return {
    greeting: getGreeting(),
    userName: ctx.user.name ?? "there",
    contextLine: generateContextLine(ctx, marketStatus),
    netWorth: ctx.savings.totalSaved,
    savingsRate: ctx.savings.savingsRate,
    monthlyIncome: ctx.income.currentMonth || ctx.profile?.monthlyIncome || 0,
    monthlyExpenses: ctx.expenses.currentMonth,
    healthScore: healthScore.score,
    healthGrade: healthScore.grade,
    healthLabel: healthScore.label,
    emergencyFundProgress: ctx.emergencyFund.current,
    emergencyFundTarget: ctx.emergencyFund.target,
    goalProgress,
    watchlistSummary: marketSummary,
    activeAlerts: topAlerts,
    keyInsight: generateDailyInsight(ctx),
    celebrations: generateCelebrations(ctx, healthScore),
    warnings: allWarnings,
    recommendations: generateRecommendations(ctx),
    marketSummary,
    healthSummary: generateHealthSummary(ctx, healthScore),
    actionSuggestions: generateActionSuggestions(ctx),
    generatedAt: new Date().toISOString(),
  };
}
