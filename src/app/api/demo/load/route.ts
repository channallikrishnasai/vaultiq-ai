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
    // Create Expenses
    // -----------------------------------------------------------------------

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    await prisma.expense.createMany({
      data: [
        {
          userId,
          amount: 4000,
          category: "Food",
          notes: "Groceries & dining",
          date: new Date(startOfMonth.getTime() + 86400000 * 2),
        },
        {
          userId,
          amount: 2500,
          category: "Transport",
          notes: "Fuel & cab rides",
          date: new Date(startOfMonth.getTime() + 86400000 * 5),
          
        },
        {
          userId,
          amount: 3500,
          category: "Shopping",
          notes: "Online purchases",
          date: new Date(startOfMonth.getTime() + 86400000 * 8),
          
        },
      ],
    });

    // -----------------------------------------------------------------------
    // Create Goals
    // -----------------------------------------------------------------------

    await prisma.goal.createMany({
      data: [
        {
          userId,
          name: "Emergency Fund",
          targetAmount: 50000,
          currentAmount: 12500,
          deadline: new Date(now.getFullYear(), now.getMonth() + 6, 1),
          type: "EMERGENCY",
         
        },
        {
          userId,
          name: "Laptop",
          targetAmount: 80000,
          currentAmount: 20000,
          deadline: new Date(now.getFullYear(), now.getMonth() + 4, 1),
          type: "SAVINGS",
          
        },
        {
          userId,
          name: "Europe Trip",
          targetAmount: 200000,
          currentAmount: 35000,
          deadline: new Date(now.getFullYear() + 1, now.getMonth(), 1),
          type: "SAVINGS",
         
        },
      ],
    });

    // -----------------------------------------------------------------------
    // Create Portfolio + Trades
    // -----------------------------------------------------------------------

    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name: "Default Portfolio",
        cashBalance: 5000,
        totalValue: 50000,
        isDefault: true,
      },
    });

    await prisma.trade.createMany({
      data: [
        {
          portfolioId: portfolio.id,
          symbol: "TCS",
          type: "BUY",
          quantity: 5,
          price: 3000,
          totalAmount: 15000,
          executedAt: new Date(startOfMonth.getTime() + 86400000 * 3),
        },
        {
          portfolioId: portfolio.id,
          symbol: "Infosys",
          type: "BUY",
          quantity: 10,
          price: 1200,
          totalAmount: 12000,
          executedAt: new Date(startOfMonth.getTime() + 86400000 * 6),
        },
        {
          portfolioId: portfolio.id,
          symbol: "Reliance",
          type: "BUY",
          quantity: 6,
          price: 3000,
          totalAmount: 18000,
          executedAt: new Date(startOfMonth.getTime() + 86400000 * 9),
        },
      ],
    });

    // -----------------------------------------------------------------------
    // Update Portfolio totalValue
    // -----------------------------------------------------------------------

    const trades = await prisma.trade.findMany({
      where: { portfolioId: portfolio.id },
    });

    const invested = trades.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalValue = portfolio.cashBalance + invested;

    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { totalValue },
    });

    return NextResponse.json({
      success: true,
      data: {
        expensesCreated: 3,
        goalsCreated: 3,
        portfolioCreated: 1,
        tradesCreated: 3,
      },
    });
  } catch (error) {
    console.error("[Demo Load] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load demo data" },
      { status: 500 }
    );
  }
}