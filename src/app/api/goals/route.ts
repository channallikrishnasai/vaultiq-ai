import { requireAuth } from "@/lib/auth";
import { createGoalSchema } from "@/validations/goal";
import { goalRepository } from "@/repositories/goal.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const goals = await goalRepository.findAll(session.user.id);
    return successResponse(goals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createGoalSchema.parse(body);
    const goal = await goalRepository.create(session.user.id, data);
    return successResponse(goal, "Goal created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
