import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { ConversationTurn, ConversationContext, ConversationSession, MemoryEntry } from "@/types/financial-hub";

const TAG = "MemoryService";

class MemoryServiceImpl {
  private memoryStore = new Map<string, MemoryEntry[]>();
  private recentContexts = new Map<string, ConversationContext>();

  buildContextFromMessage(message: string, existingContext?: ConversationContext): ConversationContext {
    const lower = message.toLowerCase();

    const topic = this.detectTopic(lower);
    const entities = this.extractEntities(lower, existingContext);
    const sentiment = this.analyzeSentiment(lower);

    return {
      topic,
      entities,
      sentiment,
    };
  }

  private detectTopic(text: string): string {
    const topicPatterns: Record<string, string[]> = {
      budget: ["budget", "spending", "expense", "monthly expense", "category"],
      goals: ["goal", "target", "savings goal", "emergency fund", "milestone"],
      investments: ["invest", "portfolio", "stock", "mutual fund", "sip", "etf"],
      market: ["market", "nifty", "sensex", "share", "price", "trading"],
      documents: ["document", "statement", "slip", "upload", "tax", "insurance"],
      predictions: ["predict", "forecast", "future", "when will", "what if"],
      alerts: ["alert", "notification", "price alert", "notify"],
      profile: ["profile", "income", "salary", "risk appetite"],
      health: ["health", "score", "financial health", "grade"],
      watchlist: ["watchlist", "track", "add stock", "remove stock"],
    };

    for (const [topic, keywords] of Object.entries(topicPatterns)) {
      if (keywords.some((k) => text.includes(k))) {
        return topic;
      }
    }
    return "general";
  }

  private extractEntities(text: string, existingContext?: ConversationContext): { type: string; value: string }[] {
    const entities: { type: string; value: string }[] = [];

    const stockMatch = text.match(/\b(reliance|tcs|infy|hdfc|icici|wipro|sbi|itc|bharti|hindunilvr|adani|tata|reliance)\b/i);
    if (stockMatch) {
      entities.push({ type: "stock", value: stockMatch[1].toUpperCase() });
    }

    const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|lac|l|crore|cr)?/i);
    if (amountMatch) {
      let amount = parseInt(amountMatch[1].replace(/,/g, ""), 10);
      if (text.includes("lakh") || text.includes("lac") || text.includes("l")) {
        amount *= 100000;
      } else if (text.includes("crore") || text.includes("cr")) {
        amount *= 10000000;
      }
      entities.push({ type: "amount", value: String(amount) });
    }

    const percentMatch = text.match(/(\d+)\s*%/);
    if (percentMatch) {
      entities.push({ type: "percent", value: percentMatch[1] });
    }

    if (existingContext?.entities) {
      for (const existing of existingContext.entities) {
        if (!entities.some((e) => e.type === existing.type)) {
          entities.push(existing);
        }
      }
    }

    return entities;
  }

  private analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
    const positiveWords = ["good", "great", "excellent", "increase", "better", "more", "growth", "profit", "up", "high"];
    const negativeWords = ["bad", "poor", "decrease", "worse", "less", "loss", "down", "low", "risk", "debt", "overspending"];

    const positiveCount = positiveWords.filter((w) => text.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => text.includes(w)).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  resolveAmbiguousReference(
    message: string,
    recentContext: ConversationContext,
  ): string {
    const lower = message.toLowerCase();

    const pronouns = ["it", "that", "this", "them", "those", "increase it", "update it"];
    const hasPronoun = pronouns.some((p) => lower.includes(p));

    if (!hasPronoun) return message;

    if (recentContext.entities.length > 0) {
      const lastEntity = recentContext.entities[recentContext.entities.length - 1];
      let resolved = message;

      if (lower.includes("increase") && lastEntity.type === "amount") {
        resolved = `increase ${lastEntity.type} to ${lastEntity.value}`;
      } else if (lower.includes("it") || lower.includes("that")) {
        resolved = `${recentContext.topic} ${lastEntity.type} ${lastEntity.value}`;
      }

      logger.debug(TAG, `Resolved ambiguous reference: "${message}" -> "${resolved}"`);
      return resolved;
    }

    return message;
  }

  storeMemory(userId: string, key: string, value: string, context: string, ttlMs?: number): void {
    if (!this.memoryStore.has(userId)) {
      this.memoryStore.set(userId, []);
    }

    const entry: MemoryEntry = {
      key,
      value,
      context,
      createdAt: new Date().toISOString(),
      expiresAt: ttlMs ? new Date(Date.now() + ttlMs).toISOString() : undefined,
    };

    this.memoryStore.get(userId)!.push(entry);
  }

  getMemory(userId: string, key: string): MemoryEntry | undefined {
    const memories = this.memoryStore.get(userId) ?? [];
    const now = Date.now();

    return memories
      .filter((m) => m.key === key && (!m.expiresAt || new Date(m.expiresAt).getTime() > now))
      .pop();
  }

  getRecentMemories(userId: string, limit = 10): MemoryEntry[] {
    const memories = this.memoryStore.get(userId) ?? [];
    const now = Date.now();
    return memories
      .filter((m) => !m.expiresAt || new Date(m.expiresAt).getTime() > now)
      .slice(-limit);
  }

  storeContext(userId: string, context: ConversationContext): void {
    this.recentContexts.set(userId, context);
  }

  getRecentContext(userId: string): ConversationContext {
    return this.recentContexts.get(userId) ?? { topic: "general", entities: [] };
  }

  buildFollowUpContext(message: string, userId: string): string {
    const recentContext = this.getRecentContext(userId);
    const resolvedMessage = this.resolveAmbiguousReference(message, recentContext);

    if (resolvedMessage !== message) {
      return `Follow-up context: User is continuing conversation about ${recentContext.topic}. Resolved message: "${resolvedMessage}"`;
    }

    return "";
  }
}

export const memoryService = new MemoryServiceImpl();
