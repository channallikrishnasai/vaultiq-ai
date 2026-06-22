import { requireAuth } from "@/lib/auth";
import { analyticsService } from "@/services/finance/analytics.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const analytics = await analyticsService.getAnalytics(session.user.id);
    return successResponse(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}
