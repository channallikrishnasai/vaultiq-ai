import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { getAIProvider } from "@/services/ai";

const SYSTEM_PROMPT = `You are VaultIQ AI, India's AI-powered financial guardian.

You help users with:
- SIPs
- Mutual Funds
- Stocks
- Budgeting
- Saving Money
- Financial Planning
- Taxes
- Loans
- Credit Scores
- Fraud Detection
- Scam Prevention

Always answer the user's question directly.
Give practical and accurate financial guidance.
Use Indian examples and INR currency.
Keep answers helpful and easy to understand.`;

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

    // 2. Read conversation history from Supabase (last 6 messages for AI context)
    const { data: history, error: historyError } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("conversation_id", sid)
      .order("created_at", { ascending: true })
      .limit(6);

    if (historyError) {
      console.error("[chatService] Failed to read history:", historyError);
    }

    // 3. Generate AI response
    const ai = getAIProvider();
    let response: string;

    try {
      response = await ai.chat([
        { role: "system", content: SYSTEM_PROMPT },
        ...(history || []).map((h) => ({
          role: h.role as "user" | "assistant" | "system",
          content: h.content,
        })),
      ]);
    } catch (aiError) {
      console.error("[chatService] AI generation failed:", aiError);
      response = "I'm having trouble generating a response right now. Please try again.";
    }

    // 4. Save assistant response to Supabase (only if we have a real response)
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

    // 5. Return response
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
