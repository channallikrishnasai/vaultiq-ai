import { requireAuth } from "@/lib/auth";
import { updateGoalSchema } from "@/validations/goal";
import { goalRepository } from "@/repositories/goal.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const goal = await goalRepository.findById(id, session.user.id);
    if (!goal) throw new NotFoundError("Goal not found");
    return successResponse(goal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = updateGoalSchema.parse(body);
    const result = await goalRepository.update(id, session.user.id, data);
    if (result.count === 0) throw new NotFoundError("Goal not found");
    const goal = await goalRepository.findById(id, session.user.id);
    return successResponse(goal, "Goal updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const result = await goalRepository.delete(id, session.user.id);
    if (result.count === 0) throw new NotFoundError("Goal not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
