import { randomUUID } from "crypto";
import { chatRepository } from "@/repositories/chat.repository";
import { getAIProvider } from "@/services/ai";
import { ChatRole } from "@/generated/prisma/enums";

export const chatService = {
  async sendMessage(userId: string, message: string, sessionId?: string) {
    const sid = sessionId ?? randomUUID();
    await chatRepository.addMessage(userId, ChatRole.USER, message, sid);

    const history = await chatRepository.findHistory(userId, sid, 20);
    const ai = getAIProvider();
    const response = await ai.chat(
      history.map((h) => ({
        role: h.role.toLowerCase() as "user" | "assistant" | "system",
        content: h.content,
      })),
    );

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
