import { prisma } from "@/lib/prisma";

export const budgetRepository = {
  findAll(userId: string) {
    return prisma.budget.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  },

  findById(id: string, userId: string) {
    return prisma.budget.findFirst({ where: { id, userId } });
  },

  create(userId: string, data: { category: string; limit: number; month: number; year: number }) {
    return prisma.budget.create({ data: { userId, ...data } });
  },

  update(id: string, userId: string, data: Partial<{ category: string; limit: number; month: number; year: number }>) {
    return prisma.budget.updateMany({ where: { id, userId }, data });
  },

  delete(id: string, userId: string) {
    return prisma.budget.deleteMany({ where: { id, userId } });
  },
};
