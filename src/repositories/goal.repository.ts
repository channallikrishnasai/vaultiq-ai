import { prisma } from "@/lib/prisma";
import type { GoalType } from "@/generated/prisma/enums";

export const goalRepository = {
  findAll(userId: string) {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string, userId: string) {
    return prisma.goal.findFirst({ where: { id, userId } });
  },

  create(userId: string, data: { name: string; targetAmount: number; currentAmount?: number; type: GoalType; deadline?: Date }) {
    return prisma.goal.create({ data: { userId, ...data } });
  },

  update(id: string, userId: string, data: Partial<{ name: string; targetAmount: number; currentAmount: number; type: GoalType; deadline: Date }>) {
    return prisma.goal.updateMany({ where: { id, userId }, data });
  },

  delete(id: string, userId: string) {
    return prisma.goal.deleteMany({ where: { id, userId } });
  },
};
