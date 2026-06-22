export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIService {
  chat(messages: AIMessage[]): Promise<string>;
}

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

export function getAIProvider(): AIService {
  const provider = process.env.AI_PROVIDER ?? "mock";
  return provider === "openai" ? new OpenAIProvider() : new MockAIProvider();
}
