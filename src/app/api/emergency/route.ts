import { requireAuth } from "@/lib/auth";
import { emergencyRepository } from "@/repositories/emergency.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const plans = await emergencyRepository.findAll(session.user.id);
    return successResponse(plans);
  } catch (error) {
    return handleApiError(error);
  }
}
