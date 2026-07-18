import { randomUUID } from "crypto";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { getAIProvider } from "@/services/ai";
import { logger } from "@/lib/logger";

const TAG = "Chat";
import { buildFinancialContext, formatFinancialContext } from "./financial-context.service";
import { marketContextService } from "./market-context.service";
import {
  runFullAnalysis,
  generateMonthlyReport,
  simulateScenario,
  type WhatIfScenario,
} from "./analysis";

const ANALYSIS_KEYWORDS = [
  "analyze", "analysis", "review my finances", "financial review",
  "monthly report", "report", "health check", "financial health",
  "strengths", "weaknesses", "risks", "recommendations",
  "what if", "what-if", "simulation", "scenario",
  "what happens if", "how would", "project", "forecast",
];

function detectAnalysisIntent(message: string): {
  type: "full_analysis" | "monthly_report" | "simulation" | "none";
  params?: WhatIfScenario;
} {
  const lower = message.toLowerCase();

  if (lower.includes("what if") || lower.includes("what happens if") || lower.includes("how would")) {
    return {
      type: "simulation",
      params: parseWhatIfScenario(message),
    };
  }

  if (lower.includes("monthly report") || lower.includes("generate report") || lower.includes("my report")) {
    return { type: "monthly_report" };
  }

  if (ANALYSIS_KEYWORDS.some((k) => lower.includes(k))) {
    return { type: "full_analysis" };
  }

  return { type: "none" };
}

function parseWhatIfScenario(message: string): WhatIfScenario {
  const lower = message.toLowerCase();

  const incomeMatch = lower.match(/income\s+(?:becomes?|is|of|at)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
  if (incomeMatch) {
    const amount = parseInt(incomeMatch[1].replace(/,/g, ""), 10);
    return {
      type: "income_change",
      description: `Income changes to ₹${amount.toLocaleString("en-IN")}`,
      params: { customIncome: amount },
    };
  }

  const incomePercentMatch = lower.match(/income\s+(?:increases?|goes?\s+up|rise|grow)\s*(?:by)?\s*(\d+)\s*%/) ;
  if (incomePercentMatch) {
    return {
      type: "income_change",
      description: `Income increases by ${incomePercentMatch[1]}%`,
      params: { incomePercentChange: parseInt(incomePercentMatch[1], 10) },
    };
  }

  const expenseIncreaseMatch = lower.match(/expenses?\s+(?:increases?|go\s+up|rises?|grow)\s*(?:by)?\s*(\d+)\s*%/);
  if (expenseIncreaseMatch) {
    return {
      type: "expense_change",
      description: `Expenses increase by ${expenseIncreaseMatch[1]}%`,
      params: { expensePercentChange: parseInt(expenseIncreaseMatch[1], 10) },
    };
  }

  const savingsMatch = lower.match(/save\s+(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:\/|per|a)\s*month/);
  if (savingsMatch) {
    const amount = parseInt(savingsMatch[1].replace(/,/g, ""), 10);
    return {
      type: "savings_target",
      description: `Save ₹${amount.toLocaleString("en-IN")} per month`,
      params: { savingsTarget: amount },
    };
  }

  const bikeMatch = lower.match(/buy\s+(?:a\s+)?(?:bike|motorcycle|scooter|car|vehicle)/);
  if (bikeMatch) {
    return {
      type: "new_expense",
      description: "Purchase a vehicle (estimated ₹80,000 EMI over 36 months)",
      params: { newExpenseAmount: 25000, newExpenseCategory: "Vehicle EMI" },
    };
  }

  const loanMatch = lower.match(/(?:take|get|have)\s+(?:a\s+)?(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:lakh|lac|l)\s*loan/);
  if (loanMatch) {
    const amount = parseInt(loanMatch[1].replace(/,/g, ""), 10) * 100000;
    return {
      type: "new_loan",
      description: `Take a ₹${(amount / 100000).toFixed(0)} lakh loan`,
      params: { loanAmount: amount, loanInterestRate: 10, loanTenureMonths: 60 },
    };
  }

  const customExpenseMatch = lower.match(/(?:spend|expense|cost)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/);
  if (customExpenseMatch) {
    const amount = parseInt(customExpenseMatch[1].replace(/,/g, ""), 10);
    return {
      type: "new_expense",
      description: `Additional expense of ₹${amount.toLocaleString("en-IN")}`,
      params: { newExpenseAmount: amount },
    };
  }

  return {
    type: "expense_change",
    description: "Expenses increase by 20%",
    params: { expensePercentChange: 20 },
  };
}

function formatAnalysisForAI(analysis: ReturnType<typeof runFullAnalysis>): string {
  const lines: string[] = [];
  lines.push("=== FULL FINANCIAL ANALYSIS ===");
  lines.push(`Summary: ${analysis.summary}`);
  lines.push("");

  if (analysis.strengths.length > 0) {
    lines.push("STRENGTHS:");
    analysis.strengths.slice(0, 5).forEach((s) => lines.push(`  + ${s.title}: ${s.detail}`));
    lines.push("");
  }

  if (analysis.weaknesses.length > 0) {
    lines.push("WEAKNESSES:");
    analysis.weaknesses.slice(0, 5).forEach((w) => lines.push(`  - ${w.title}: ${w.detail}`));
    lines.push("");
  }

  if (analysis.risks.length > 0) {
    lines.push("RISKS:");
    analysis.risks.slice(0, 5).forEach((r) => lines.push(`  ! ${r.title}: ${r.detail}`));
    lines.push("");
  }

  lines.push("RECOMMENDATIONS (prioritized):");
  analysis.recommendations.slice(0, 7).forEach((r) => {
    lines.push(`  [P${r.priority}] ${r.action}`);
    lines.push(`    Reason: ${r.reason}`);
    lines.push(`    Impact: ${r.impact}`);
  });
  lines.push("");

  if (analysis.projections.length > 0) {
    lines.push("PROJECTIONS:");
    analysis.projections.forEach((p) => {
      lines.push(`  ${p.label}: ₹${p.current.toLocaleString("en-IN")} → ₹${p.projected.toLocaleString("en-IN")} (${p.timeframe})`);
    });
    lines.push("");
  }

  lines.push("ACTION PLAN:");
  analysis.actionPlan.forEach((a) => lines.push(`  ${a}`));

  return lines.join("\n");
}

function formatReportForAI(report: ReturnType<typeof generateMonthlyReport>): string {
  const lines: string[] = [];
  lines.push("=== MONTHLY FINANCIAL REPORT ===");
  lines.push(`Period: ${report.period}`);
  lines.push("");
  lines.push("SUMMARY:");
  lines.push(`  Income: ₹${report.summary.totalIncome.toLocaleString("en-IN")}`);
  lines.push(`  Expenses: ₹${report.summary.totalExpenses.toLocaleString("en-IN")}`);
  lines.push(`  Net Savings: ₹${report.summary.netSavings.toLocaleString("en-IN")}`);
  lines.push(`  Savings Rate: ${report.summary.savingsRate}%`);
  lines.push(`  Health Score: ${report.summary.healthScore}/100 (${report.summary.healthGrade})`);
  lines.push("");

  lines.push("ACHIEVEMENTS:");
  report.achievements.forEach((a) => lines.push(`  + ${a}`));
  lines.push("");

  if (report.concerns.length > 0) {
    lines.push("CONCERNS:");
    report.concerns.forEach((c) => lines.push(`  - ${c}`));
    lines.push("");
  }

  if (report.goalStatus.length > 0) {
    lines.push("GOAL STATUS:");
    report.goalStatus.forEach((g) => {
      lines.push(`  ${g.name}: ${g.progress}% ${g.onTrack ? "(on track)" : "(behind)"}`);
    });
    lines.push("");
  }

  lines.push("HEALTH BREAKDOWN:");
  report.healthBreakdown.forEach((h) => {
    lines.push(`  ${h.factor}: ${h.score}/${h.maxScore} — ${h.tip}`);
  });
  lines.push("");

  if (report.recommendations.length > 0) {
    lines.push("RECOMMENDATIONS:");
    report.recommendations.forEach((r) => {
      lines.push(`  [P${r.priority}] ${r.action}`);
    });
    lines.push("");
  }

  lines.push("NEXT MONTH PRIORITIES:");
  report.nextMonthPriorities.forEach((p) => lines.push(`  * ${p}`));

  return lines.join("\n");
}

function formatSimulationForAI(sim: ReturnType<typeof simulateScenario>): string {
  const lines: string[] = [];
  lines.push("=== WHAT-IF SIMULATION ===");
  lines.push(`Scenario: ${sim.description}`);
  lines.push("");
  lines.push("CHANGES:");
  if (sim.summary.incomeChange !== 0) {
    lines.push(`  Income: ${sim.summary.incomeChange > 0 ? "+" : ""}₹${sim.summary.incomeChange.toLocaleString("en-IN")}`);
  }
  if (sim.summary.expenseChange !== 0) {
    lines.push(`  Expenses: ${sim.summary.expenseChange > 0 ? "+" : ""}₹${sim.summary.expenseChange.toLocaleString("en-IN")}`);
  }
  lines.push(`  Net Savings: ${sim.summary.savingsChange > 0 ? "+" : ""}₹${sim.summary.savingsChange.toLocaleString("en-IN")}`);
  lines.push("");

  if (sim.findings.length > 0) {
    lines.push("IMPACT:");
    sim.findings.forEach((f) => lines.push(`  ${f.severity === "critical" ? "!!" : f.severity === "warning" ? "!" : f.severity === "positive" ? "+" : "-"} ${f.title}`));
    lines.push("");
  }

  if (sim.recommendations.length > 0) {
    lines.push("RECOMMENDATIONS:");
    sim.recommendations.forEach((r) => lines.push(`  ${r.action}`));
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are VaultIQ AI, India's AI-powered financial guardian and personal financial advisor.

You are NOT a generic chatbot. You have full access to the user's financial profile including:
- Income, expenses, savings rate, and net cash flow
- Financial goals, targets, and progress
- Emergency fund status
- Investment portfolio and holdings
- Financial health score and breakdown
- Budgets and category-level spending
- Financial twin projections and recommendations
- Fraud alerts

You also have access to LIVE MARKET DATA when the user asks about stocks, indices, commodities, or investments.

Use this data to give specific, actionable advice. Always reference the user's actual numbers when giving advice.
For example: "Your savings rate is 22%, which is above the recommended 20%" rather than generic "save more".

When asked about finances:
1. Always reference the user's actual data from the Financial Profile
2. Give specific INR amounts and percentages
3. Compare against benchmarks (20% savings rule, 6-month emergency fund, etc.)
4. Provide actionable next steps
5. Use Indian financial context (SIPs, PPF, EPF, NPS, mutual funds, etc.)

When LIVE MARKET DATA is provided:
1. Always use the ACTUAL prices and data from the market data section - NEVER make up or hallucinate prices
2. Reference the data source (Live/Cached/Mock) when relevant
3. Combine market data with the user's financial profile for personalized advice
4. If the user asks about a stock they hold, cross-reference with their portfolio holdings
5. Provide context about the stock's trend, P/E ratio, market cap when available
6. For indices (NIFTY, SENSEX), provide market overview context
7. For commodities (Gold, Silver), relate to the user's investment goals

When analysis data is provided, format your response as a clear, structured financial advisor report.
Use the strengths, weaknesses, risks, and recommendations to give a comprehensive assessment.

When asked about non-financial topics, answer normally but briefly redirect to financial matters if relevant.

Always be direct and data-driven. Never make up numbers - only use what's in the Financial Profile or Live Market Data.
If market data shows "Mock" as the source, mention that the data is simulated and not real-time.`;

export const chatService = {
  async sendMessage(userId: string, message: string, sessionId?: string) {
    const sid = sessionId ?? randomUUID();

    const db = requireSupabaseAdmin();

    // 1. Save user message to Supabase
    const { error: userInsertError } = await db
      .from("chat_messages")
      .insert({
        user_id: userId,
        role: "user",
        content: message,
        conversation_id: sid,
      });

    if (userInsertError) {
      logger.error(TAG, "Failed to save user message", userInsertError);
      throw new Error("Failed to save message");
    }

    // 2. Read conversation history from Supabase (last 10 messages for AI context)
    const { data: history, error: historyError } = await db
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("conversation_id", sid)
      .order("created_at", { ascending: true })
      .limit(10);

    if (historyError) {
      logger.error(TAG, "Failed to read history", historyError);
    }

    // 3. Build financial context and run analysis
    let financialContextStr = "";
    let analysisStr = "";
    let marketContextStr = "";
    const intent = detectAnalysisIntent(message);

    try {
      const ctx = await buildFinancialContext(userId);
      financialContextStr = formatFinancialContext(ctx);

      if (intent.type === "full_analysis") {
        const analysis = runFullAnalysis(ctx);
        analysisStr = formatAnalysisForAI(analysis);
      } else if (intent.type === "monthly_report") {
        const report = generateMonthlyReport(ctx);
        analysisStr = formatReportForAI(report);
      } else if (intent.type === "simulation" && intent.params) {
        const sim = simulateScenario(ctx, intent.params);
        analysisStr = formatSimulationForAI(sim);
      }
    } catch (err) {
      logger.error(TAG, "Failed to build financial context", err);
      financialContextStr = "Financial data not available.";
    }

    // 3b. Detect market intent and fetch market data
    try {
      const marketData = await marketContextService.buildMarketContext(message);
      if (marketData.intentDetected) {
        marketContextStr = marketContextService.formatMarketContext(marketData);
        if (marketData.quotes.length > 0) {
          logger.info(TAG, `Market data fetched: ${marketData.quotes.length} quotes, source: ${marketData.dataSource}`);
        }
      }
    } catch (err) {
      logger.error(TAG, "Failed to fetch market context", err);
      // Market context failure should never block the chat response
    }

    // 4. Generate AI response with financial context and analysis
    const ai = getAIProvider();
    let response: string;

    try {
      const systemContent = [
        SYSTEM_PROMPT,
        "\n\n=== FINANCIAL PROFILE ===",
        financialContextStr,
        marketContextStr ? "\n\n" + marketContextStr : "",
        analysisStr ? "\n\n=== ANALYSIS DATA ===\n" + analysisStr : "",
      ].join("");

      response = await ai.chat([
        { role: "system", content: systemContent },
        ...(history || []).map((h) => ({
          role: h.role as "user" | "assistant" | "system",
          content: h.content,
        })),
      ]);
    } catch (aiError) {
      logger.error(TAG, "AI generation failed", aiError);
      response = "I'm having trouble generating a response right now. Please try again.";
    }

    // 5. Save assistant response to Supabase (only if we have a real response)
    if (response) {
      const { error: assistantInsertError } = await db
        .from("chat_messages")
        .insert({
          user_id: userId,
          role: "assistant",
          content: response,
          conversation_id: sid,
        });

      if (assistantInsertError) {
        logger.error(TAG, "Failed to save assistant message", assistantInsertError);
      }
    }

    // 6. Return response
    return { sessionId: sid, message: response };
  },

  async getHistory(userId: string, sessionId?: string, limit = 50) {
    const db = requireSupabaseAdmin();
    let query = db
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (sessionId) {
      query = query.eq("conversation_id", sessionId);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      logger.error(TAG, "Failed to get history", error);
      return [];
    }

    return data || [];
  },

  async getSessions(userId: string) {
    const db = requireSupabaseAdmin();
    const { data, error } = await db
      .from("chat_messages")
      .select("conversation_id, content, role, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(TAG, "Failed to get sessions", error);
      return [];
    }

    // Group by conversation_id, keep only the first user message as summary
    const conversationMap = new Map<
      string,
      { conversation_id: string; summary: string; created_at: string }
    >();

    for (const msg of data || []) {
      if (!conversationMap.has(msg.conversation_id)) {
        conversationMap.set(msg.conversation_id, {
          conversation_id: msg.conversation_id,
          summary: msg.role === "user" ? msg.content.slice(0, 80) : "",
          created_at: msg.created_at,
        });
      } else if (msg.role === "user") {
        const conv = conversationMap.get(msg.conversation_id)!;
        if (!conv.summary) conv.summary = msg.content.slice(0, 80);
      }
    }

    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async deleteSession(userId: string, sessionId: string) {
    const db = requireSupabaseAdmin();
    const { error } = await db
      .from("chat_messages")
      .delete()
      .eq("user_id", userId)
      .eq("conversation_id", sessionId);

    if (error) {
      logger.error(TAG, "Failed to delete session", error);
      throw new Error("Failed to delete conversation");
    }
  },

  async deleteAllSessions(userId: string) {
    const db = requireSupabaseAdmin();
    const { error } = await db
      .from("chat_messages")
      .delete()
      .eq("user_id", userId);

    if (error) {
      logger.error(TAG, "Failed to delete all sessions", error);
      throw new Error("Failed to delete conversations");
    }
  },
};
