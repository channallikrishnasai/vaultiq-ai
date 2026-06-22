import { prisma } from "@/lib/prisma";

export const learningRepository = {
  getProgress(userId: string) {
    return prisma.learningProgress.findMany({ where: { userId } });
  },

  upsertProgress(userId: string, courseId: string, lessonId: string, completed: boolean) {
    return prisma.learningProgress.upsert({
      where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
      create: {
        userId,
        courseId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  },

  saveQuizResult(userId: string, courseId: string, score: number, total: number, passed: boolean) {
    return prisma.quizResult.create({
      data: { userId, courseId, score, total, passed },
    });
  },

  getQuizResults(userId: string) {
    return prisma.quizResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
};
