import { prisma } from "@/lib/prisma";
import type { FraudInputType } from "@/generated/prisma/enums";

export const fraudRepository = {
  findAll(userId: string) {
    return prisma.fraudReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(userId: string, data: {
    inputType: FraudInputType;
    content: string;
    riskScore: number;
    threatCategory: string;
    explanation: string;
    actions: string[];
  }) {
    return prisma.fraudReport.create({
      data: { userId, ...data, actions: data.actions },
    });
  },
};
