import { requireAuth } from "@/lib/auth";
import { healthScoreService } from "@/services/finance/health-score.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const result = await healthScoreService.calculate(session.user.id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
