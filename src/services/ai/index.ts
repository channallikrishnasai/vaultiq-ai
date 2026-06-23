import Groq from "groq-sdk";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIService {
  chat(messages: AIMessage[]): Promise<string>;
}

// ---------------------------------------------------------------------------
// MockAIProvider — Fallback when no real AI is available
// ---------------------------------------------------------------------------

export class MockAIProvider implements AIService {
  async chat(messages: AIMessage[]): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const query = lastUser?.content ?? "";

    if (query.toLowerCase().includes("budget")) {
      return "Based on your spending patterns, I recommend allocating 50% to needs, 30% to wants, and 20% to savings. Would you like me to analyze your recent expenses?";
    }
    if (query.toLowerCase().includes("invest")) {
      return "For moderate risk appetite, consider a diversified portfolio: 60% equity mutual funds, 30% debt instruments, and 10% gold. Start with SIPs in index funds for long-term wealth building.";
    }
    if (query.toLowerCase().includes("fraud") || query.toLowerCase().includes("scam")) {
      return "Warning signs of financial fraud include: urgent payment requests, promises of guaranteed returns, requests for OTP/PIN, and unofficial payment links. Never share your credentials. Use VaultIQ Fraud Shield to analyze suspicious content.";
    }

    return `I'm VaultIQ AI, your personal finance assistant. You asked: "${query.slice(0, 100)}". I can help with budgeting, investments, fraud detection, financial planning, and learning. What would you like to explore?`;
  }
}

// ---------------------------------------------------------------------------
// GroqProvider — Uses Groq SDK with llama-3.3-70b-versatile
// ---------------------------------------------------------------------------

export class GroqProvider implements AIService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;

    // Fallback 1: No API key
    if (!apiKey) {
      console.warn("[GroqProvider] GROQ_API_KEY missing. Falling back to MockAIProvider.");
      return new MockAIProvider().chat(messages);
    }

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        model: "llama-3.3-70b-versatile",
        max_completion_tokens: 1024,
        temperature: 0.7,
      });

      const content = chatCompletion.choices[0]?.message?.content ?? "";

      if (!content) {
        console.warn("[GroqProvider] Empty response from Groq. Falling back to MockAIProvider.");
        return new MockAIProvider().chat(messages);
      }

      return content;
    } catch (error) {
      // Fallback 2: API error
      console.error("[GroqProvider] API error:", error);
      console.warn("[GroqProvider] Falling back to MockAIProvider due to API error.");
      return new MockAIProvider().chat(messages);
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAIProvider — Kept for backward compatibility
// ---------------------------------------------------------------------------

export class OpenAIProvider implements AIService {
  async chat(messages: AIMessage[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new MockAIProvider().chat(messages);
    }

    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey });
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 500,
      });
      return response.choices[0]?.message?.content ?? "I couldn't generate a response.";
    } catch {
      return new MockAIProvider().chat(messages);
    }
  }
}

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

export function getAIProvider(): AIService {
  const provider = process.env.AI_PROVIDER ?? "mock";

  console.log("AI_PROVIDER =", provider);
  console.log("GROQ KEY EXISTS =", !!process.env.GROQ_API_KEY);
  console.log("USING PROVIDER =", provider === "groq" ? "Groq" : provider === "openai" ? "OpenAI" : "Mock");

  if (provider === "groq") {
    return new GroqProvider();
  }

  if (provider === "openai") {
    return new OpenAIProvider();
  }

  return new MockAIProvider();
}