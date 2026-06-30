import { randomUUID } from "crypto";
import { chatRepository } from "@/repositories/chat.repository";
import { getAIProvider } from "@/services/ai";
import { ChatRole } from "@/generated/prisma/enums";

export const chatService = {
  async sendMessage(userId: string, message: string, sessionId?: string) {
    const sid = sessionId ?? randomUUID();
    await chatRepository.addMessage(userId, ChatRole.USER, message, sid);

    const history = await chatRepository.findHistory(userId, sid, 6);
    const ai = getAIProvider();
    const response = await ai.chat([
  {
    role: "system",
    content: `
You are VaultIQ AI, India's AI-powered financial guardian.

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
Keep answers helpful and easy to understand.
`,
  },
  ...history.map((h) => ({
    role: h.role.toLowerCase() as "user" | "assistant" | "system",
    content: h.content,
  })),
]);

    await chatRepository.addMessage(userId, ChatRole.ASSISTANT, response, sid);
    return { sessionId: sid, message: response };
  },

  getHistory(userId: string, sessionId?: string, limit?: number) {
    return chatRepository.findHistory(userId, sessionId, limit);
  },

  getSessions(userId: string) {
    return chatRepository.getSessions(userId);
  },
};
