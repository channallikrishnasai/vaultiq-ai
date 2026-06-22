import { requireAuth } from "@/lib/auth";
import { updateBudgetSchema } from "@/validations/budget";
import { budgetRepository } from "@/repositories/budget.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const budget = await budgetRepository.findById(id, session.user.id);
    if (!budget) throw new NotFoundError("Budget not found");
    return successResponse(budget);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = updateBudgetSchema.parse(body);
    const result = await budgetRepository.update(id, session.user.id, data);
    if (result.count === 0) throw new NotFoundError("Budget not found");
    const budget = await budgetRepository.findById(id, session.user.id);
    return successResponse(budget, "Budget updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const result = await budgetRepository.delete(id, session.user.id);
    if (result.count === 0) throw new NotFoundError("Budget not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
