import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { getAIProvider } from "@/services/ai";
import { buildFinancialContext, formatFinancialContext } from "./financial-context.service";

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

Use this data to give specific, actionable advice. Always reference the user's actual numbers when giving advice.
For example: "Your savings rate is 22%, which is above the recommended 20%" rather than generic "save more".

When asked about finances:
1. Always reference the user's actual data from the Financial Profile
2. Give specific INR amounts and percentages
3. Compare against benchmarks (20% savings rule, 6-month emergency fund, etc.)
4. Provide actionable next steps
5. Use Indian financial context (SIPs, PPF, EPF, NPS, mutual funds, etc.)

When asked about non-financial topics, answer normally but briefly redirect to financial matters if relevant.

Always be direct and data-driven. Never make up numbers - only use what's in the Financial Profile.`;

export const chatService = {
  async sendMessage(userId: string, message: string, sessionId?: string) {
    const sid = sessionId ?? randomUUID();

    // 1. Save user message to Supabase
    const { error: userInsertError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        user_id: userId,
        role: "user",
        content: message,
        conversation_id: sid,
      });

    if (userInsertError) {
      console.error("[chatService] Failed to save user message:", userInsertError);
      throw new Error("Failed to save message");
    }

    // 2. Read conversation history from Supabase (last 10 messages for AI context)
    const { data: history, error: historyError } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("conversation_id", sid)
      .order("created_at", { ascending: true })
      .limit(10);

    if (historyError) {
      console.error("[chatService] Failed to read history:", historyError);
    }

    // 3. Build financial context and format it for the system prompt
    let financialContextStr = "";
    try {
      const ctx = await buildFinancialContext(userId);
      financialContextStr = formatFinancialContext(ctx);
    } catch (err) {
      console.error("[chatService] Failed to build financial context:", err);
      financialContextStr = "Financial data not available.";
    }

    // 4. Generate AI response with financial context
    const ai = getAIProvider();
    let response: string;

    try {
      response = await ai.chat([
        { role: "system", content: SYSTEM_PROMPT + "\n\n" + financialContextStr },
        ...(history || []).map((h) => ({
          role: h.role as "user" | "assistant" | "system",
          content: h.content,
        })),
      ]);
    } catch (aiError) {
      console.error("[chatService] AI generation failed:", aiError);
      response = "I'm having trouble generating a response right now. Please try again.";
    }

    // 5. Save assistant response to Supabase (only if we have a real response)
    if (response) {
      const { error: assistantInsertError } = await supabaseAdmin
        .from("chat_messages")
        .insert({
          user_id: userId,
          role: "assistant",
          content: response,
          conversation_id: sid,
        });

      if (assistantInsertError) {
        console.error("[chatService] Failed to save assistant message:", assistantInsertError);
      }
    }

    // 6. Return response
    return { sessionId: sid, message: response };
  },

  async getHistory(userId: string, sessionId?: string, limit = 50) {
    let query = supabaseAdmin
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
      console.error("[chatService] Failed to get history:", error);
      return [];
    }

    return data || [];
  },

  async getSessions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("conversation_id, content, role, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[chatService] Failed to get sessions:", error);
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
    const { error } = await supabaseAdmin
      .from("chat_messages")
      .delete()
      .eq("user_id", userId)
      .eq("conversation_id", sessionId);

    if (error) {
      console.error("[chatService] Failed to delete session:", error);
      throw new Error("Failed to delete conversation");
    }
  },

  async deleteAllSessions(userId: string) {
    const { error } = await supabaseAdmin
      .from("chat_messages")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[chatService] Failed to delete all sessions:", error);
      throw new Error("Failed to delete conversations");
    }
  },
};
