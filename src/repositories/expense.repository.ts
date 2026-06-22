import { prisma } from "@/lib/prisma";

export const expenseRepository = {
  findAll(userId: string) {
    return prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
  },

  findById(id: string, userId: string) {
    return prisma.expense.findFirst({ where: { id, userId } });
  },

  create(userId: string, data: { amount: number; category: string; notes?: string; date: Date }) {
    return prisma.expense.create({ data: { userId, ...data } });
  },

  update(id: string, userId: string, data: Partial<{ amount: number; category: string; notes: string; date: Date }>) {
    return prisma.expense.updateMany({ where: { id, userId }, data });
  },

  delete(id: string, userId: string) {
    return prisma.expense.deleteMany({ where: { id, userId } });
  },

  getMonthlyTotals(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return prisma.expense.groupBy({
      by: ["category"],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
  },
};
