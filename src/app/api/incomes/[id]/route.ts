import { requireAuth } from "@/lib/auth";
import { updateIncomeSchema } from "@/validations/income";
import { incomeRepository } from "@/repositories/income.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const income = await incomeRepository.findById(id, session.user.id);
    if (!income) throw new NotFoundError("Income not found");
    return successResponse(income);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = updateIncomeSchema.parse(body);
    const result = await incomeRepository.update(id, session.user.id, data);
    if (result.count === 0) throw new NotFoundError("Income not found");
    const income = await incomeRepository.findById(id, session.user.id);
    return successResponse(income, "Income updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const result = await incomeRepository.delete(id, session.user.id);
    if (result.count === 0) throw new NotFoundError("Income not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
