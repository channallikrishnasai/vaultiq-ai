import { prisma } from "@/lib/prisma";
import type { RiskAppetite } from "@/generated/prisma/enums";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        profile: { create: {} },
      },
      include: { profile: true },
    });
  },

  updateProfile(
    userId: string,
    data: {
      name?: string;
      age?: number;
      income?: number;
      currency?: string;
      riskAppetite?: RiskAppetite;
    },
  ) {
    const { name, ...profileData } = data;
    return prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({ where: { id: userId }, data: { name } });
      }
      return tx.profile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData,
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      });
    });
  },

  delete(userId: string) {
    return prisma.user.delete({ where: { id: userId } });
  },

  getDashboardStats(userId: string) {
    return prisma.$transaction([
      prisma.expense.count({ where: { userId } }),
      prisma.budget.count({ where: { userId } }),
      prisma.goal.count({ where: { userId } }),
      prisma.fraudReport.count({ where: { userId } }),
      prisma.chatHistory.count({ where: { userId } }),
      prisma.learningProgress.count({ where: { userId, completed: true } }),
      prisma.portfolio.findFirst({ where: { userId, isDefault: true } }),
      prisma.financialTwin.findFirst({ where: { userId, isActive: true } }),
      prisma.profile.findUnique({ where: { userId } }),
    ]);
  },
};
