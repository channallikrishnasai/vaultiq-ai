import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const roadmapRepository = {
  findAll(userId: string) {
    return prisma.roadmap.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(userId: string, input: Prisma.InputJsonValue, output: Prisma.InputJsonValue) {
    return prisma.roadmap.create({
      data: { userId, input, output },
    });
  },
};
