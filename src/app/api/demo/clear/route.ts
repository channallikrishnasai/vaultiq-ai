import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      select: { id: true },
    });

    const portfolioIds = portfolios.map((p) => p.id);

    if (portfolioIds.length > 0) {
      await prisma.trade.deleteMany({
        where: { portfolioId: { in: portfolioIds } },
      });
    }

    const [expensesDeleted, goalsDeleted, portfoliosDeleted, fraudDeleted, twinsDeleted] =
      await Promise.all([
        prisma.expense.deleteMany({ where: { userId } }),
        prisma.goal.deleteMany({ where: { userId } }),
        prisma.portfolio.deleteMany({ where: { userId } }),
        prisma.fraudReport.deleteMany({ where: { userId } }),
        prisma.financialTwin.deleteMany({ where: { userId } }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        expensesDeleted: expensesDeleted.count,
        goalsDeleted: goalsDeleted.count,
        portfoliosDeleted: portfoliosDeleted.count,
        fraudReportsDeleted: fraudDeleted.count,
        twinsDeleted: twinsDeleted.count,
      },
    });
  } catch (error) {
    console.error("[Demo Clear] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear demo data" },
      { status: 500 },
    );
  }
}
