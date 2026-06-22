import { requireAuth } from "@/lib/auth";
import { fraudRepository } from "@/repositories/fraud.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const reports = await fraudRepository.findAll(session.user.id);
    return successResponse(reports);
  } catch (error) {
    return handleApiError(error);
  }
}
