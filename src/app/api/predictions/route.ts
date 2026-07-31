import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { predictiveFinanceService } from "@/services/predictive/predictive-finance.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "predictions";

    switch (type) {
      case "predictions": {
        const forceRefresh = searchParams.get("refresh") === "true";
        const data = await predictiveFinanceService.getPredictions(session.user.id, forceRefresh);
        return successResponse(data);
      }
      case "risk": {
        const data = await predictiveFinanceService.getRiskAssessment(session.user.id);
        return successResponse(data);
      }
      case "dashboard": {
        const data = await predictiveFinanceService.getPredictionsForDashboard(session.user.id);
        return successResponse(data);
      }
      default:
        return successResponse({ error: "Invalid type" }, undefined, 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { action, params } = body;
    if (action === "scenario") {
      const result = await predictiveFinanceService.runScenario(session.user.id, params || {});
      return successResponse(result);
    }

    return successResponse({ error: "Invalid action" }, undefined, 400);
  } catch (error) {
    return handleApiError(error);
  }
}
