import { prisma } from "@/lib/prisma";

export const billRepository = {
  findAll(userId: string) {
    return prisma.bill.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
    });
  },

  findById(id: string, userId: string) {
    return prisma.bill.findFirst({ where: { id, userId } });
  },

  create(userId: string, data: { name: string; amount: number; dueDate: Date; category: string }) {
    return prisma.bill.create({
      data: { userId, ...data },
    });
  },

  async togglePaid(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirstOrThrow({
        where: { id, userId },
      });

      const nextPaidState = !bill.paid;

      // Update the bill
      const updated = await tx.bill.update({
        where: { id },
        data: { paid: nextPaidState },
      });

      // Auto-deduction from demat cash balance and logging expense if marked as PAID
      if (nextPaidState) {
        // 1. Deduct from portfolio
        const defaultPortfolio = await tx.portfolio.findFirst({
          where: { userId, isDefault: true },
        });

        if (defaultPortfolio) {
          const newBalance = Math.max(0, defaultPortfolio.cashBalance - bill.amount);
          await tx.portfolio.update({
            where: { id: defaultPortfolio.id },
            data: { cashBalance: newBalance, totalValue: newBalance },
          });
        }

        // 2. Log corresponding expense
        await tx.expense.create({
          data: {
            userId,
            amount: bill.amount,
            category: bill.category,
            notes: `Auto-deducted for paid bill: ${bill.name}`,
            date: new Date(),
          },
        });
      }

      return updated;
    });
  },

  delete(id: string, userId: string) {
    return prisma.bill.deleteMany({ where: { id, userId } });
  },
};
