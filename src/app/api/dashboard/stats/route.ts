import { requireAuth } from "@/lib/auth";
import { userRepository } from "@/repositories/user.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const [
      expenseCount,
      budgetCount,
      goalCount,
      fraudCount,
      chatCount,
      lessonsCompleted,
      portfolio,
      twin,
      profile,
    ] = await userRepository.getDashboardStats(session.user.id);

    return successResponse({
      counts: {
        expenses: expenseCount,
        budgets: budgetCount,
        goals: goalCount,
        fraudReports: fraudCount,
        chatMessages: chatCount,
        lessonsCompleted,
      },
      portfolio: portfolio
        ? { id: portfolio.id, cashBalance: portfolio.cashBalance, totalValue: portfolio.totalValue }
        : null,
      financialTwin: twin
        ? { healthScore: twin.healthScore, name: twin.name }
        : null,
      profile: profile
        ? { xp: profile.xp, streak: profile.streak, riskAppetite: profile.riskAppetite }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
