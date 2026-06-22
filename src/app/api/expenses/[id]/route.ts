import { requireAuth } from "@/lib/auth";
import { updateExpenseSchema } from "@/validations/expense";
import { expenseRepository } from "@/repositories/expense.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const expense = await expenseRepository.findById(id, session.user.id);
    if (!expense) throw new NotFoundError("Expense not found");
    return successResponse(expense);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = updateExpenseSchema.parse(body);
    const result = await expenseRepository.update(id, session.user.id, data);
    if (result.count === 0) throw new NotFoundError("Expense not found");
    const expense = await expenseRepository.findById(id, session.user.id);
    return successResponse(expense, "Expense updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const result = await expenseRepository.delete(id, session.user.id);
    if (result.count === 0) throw new NotFoundError("Expense not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
