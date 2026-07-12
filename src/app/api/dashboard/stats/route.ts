import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { aggregateDashboardData } from "@/services/dashboard/dashboard-aggregation.service";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await aggregateDashboardData(session.user.id);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
