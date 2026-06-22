import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const platformRepository = {
  findAll(userId: string) {
    return prisma.platformRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(userId: string, preferences: Prisma.InputJsonValue, result: Prisma.InputJsonValue) {
    return prisma.platformRecommendation.create({
      data: { userId, preferences, result },
    });
  },
};
