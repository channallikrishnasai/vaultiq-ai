import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { RiskAppetite } from "@/generated/prisma/enums";

export const financialTwinRepository = {
  findActive(userId: string) {
    return prisma.financialTwin.findFirst({
      where: { userId, isActive: true },
      orderBy: { updatedAt: "desc" },
    });
  },

  findAll(userId: string) {
    return prisma.financialTwin.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  },

  upsert(userId: string, data: {
    name?: string;
    riskAppetite: RiskAppetite;
      snapshot: Prisma.InputJsonValue;
      projections?: Prisma.InputJsonValue;
      recommendations?: Prisma.InputJsonValue;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.financialTwin.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      return tx.financialTwin.create({
        data: { userId, isActive: true, ...data },
      });
    });
  },
};
