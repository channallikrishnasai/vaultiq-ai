import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { portfolioEngineService } from "@/services/portfolio/portfolio-engine.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get("portfolioId") ?? undefined;

    const performance = await portfolioEngineService.getPerformance(session.user.id, portfolioId);
    return successResponse(performance);
  } catch (error) {
    return handleApiError(error);
  }
}
