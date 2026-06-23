import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // -----------------------------------------------------------------------
    // Find and delete portfolio trades first (foreign key constraint)
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Delete demo data
    // -----------------------------------------------------------------------

    const expensesDeleted = await prisma.expense.deleteMany({
      where: { userId },
    });

    const goalsDeleted = await prisma.goal.deleteMany({
      where: { userId },
    });

    const portfoliosDeleted = await prisma.portfolio.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      data: {
        expensesDeleted: expensesDeleted.count,
        goalsDeleted: goalsDeleted.count,
        portfoliosDeleted: portfoliosDeleted.count,
      },
    });
  } catch (error) {
    console.error("[Demo Clear] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear demo data" },
      { status: 500 }
    );
  }
}