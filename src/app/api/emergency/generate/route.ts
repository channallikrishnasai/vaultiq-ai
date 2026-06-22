import { requireAuth } from "@/lib/auth";
import { emergencyGenerateSchema } from "@/validations/emergency";
import { emergencyPlannerService } from "@/services/emergency/planner.service";
import { emergencyRepository } from "@/repositories/emergency.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const input = emergencyGenerateSchema.parse(body);
    const plan = emergencyPlannerService.generate(input);
    const saved = await emergencyRepository.create(session.user.id, input.scenario, plan);
    return successResponse({ ...plan, id: saved.id });
  } catch (error) {
    return handleApiError(error);
  }
}
