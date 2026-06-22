import { requireAuth } from "@/lib/auth";
import { createBudgetSchema } from "@/validations/budget";
import { budgetRepository } from "@/repositories/budget.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const budgets = await budgetRepository.findAll(session.user.id);
    return successResponse(budgets);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createBudgetSchema.parse(body);
    const budget = await budgetRepository.create(session.user.id, data);
    return successResponse(budget, "Budget created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
