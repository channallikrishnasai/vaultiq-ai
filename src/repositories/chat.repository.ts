import { prisma } from "@/lib/prisma";
import { ChatRole } from "@/generated/prisma/enums";

export const chatRepository = {
  findHistory(userId: string, sessionId?: string, limit = 50) {
    return prisma.chatHistory.findMany({
      where: { userId, ...(sessionId ? { sessionId } : {}) },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  },

  addMessage(userId: string, role: ChatRole, content: string, sessionId?: string) {
    return prisma.chatHistory.create({
      data: { userId, role, content, sessionId },
    });
  },

  getSessions(userId: string) {
    return prisma.chatHistory.groupBy({
      by: ["sessionId"],
      where: { userId, sessionId: { not: null } },
      _max: { createdAt: true },
      _count: true,
    });
  },
};
