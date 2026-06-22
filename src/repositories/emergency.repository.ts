import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const emergencyRepository = {
  findAll(userId: string) {
    return prisma.emergencyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(userId: string, scenario: string, plan: Prisma.InputJsonValue) {
    return prisma.emergencyPlan.create({
      data: { userId, scenario, plan },
    });
  },
};
