import { requireAuth } from "@/lib/auth";
import { createIncomeSchema } from "@/validations/income";
import { incomeRepository } from "@/repositories/income.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const incomes = await incomeRepository.findAll(session.user.id);
    return successResponse(incomes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createIncomeSchema.parse(body);
    const income = await incomeRepository.create(session.user.id, data);
    return successResponse(income, "Income logged", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
