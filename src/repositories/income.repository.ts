import { prisma } from "@/lib/prisma";

export const incomeRepository = {
  findAll(userId: string) {
    return prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
  },

  findById(id: string, userId: string) {
    return prisma.income.findFirst({ where: { id, userId } });
  },

  async create(userId: string, data: { amount: number; category: string; notes?: string; date: Date }) {
    const income = await prisma.income.create({
      data: { userId, ...data },
    });

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        xp: {
          increment: 2,
        },
      },
    });

    console.log("[XP] Updated profile xp:", profile.xp);

    return income;
  },

  update(id: string, userId: string, data: Partial<{ amount: number; category: string; notes: string; date: Date }>) {
    return prisma.income.updateMany({ where: { id, userId }, data });
  },

  delete(id: string, userId: string) {
    return prisma.income.deleteMany({ where: { id, userId } });
  },
};
