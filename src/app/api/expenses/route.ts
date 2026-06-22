import { requireAuth } from "@/lib/auth";
import { createExpenseSchema } from "@/validations/expense";
import { expenseRepository } from "@/repositories/expense.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const expenses = await expenseRepository.findAll(session.user.id);
    return successResponse(expenses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createExpenseSchema.parse(body);
    const expense = await expenseRepository.create(session.user.id, data);
    return successResponse(expense, "Expense created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
