import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { investmentAdvisorService } from "@/services/investment/investment-advisor.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimitResult = checkRateLimit(`investment-simulate:${session.user.id}`, RATE_LIMITS.analysis);
    if (!rateLimitResult.allowed) {
      return successResponse({ error: "Rate limit exceeded. Please try again later." }, "Rate limit exceeded", 429);
    }
    const body = await request.json();
    const { portfolioId, ...simulationInput } = body;
    const result = await investmentAdvisorService.runSimulation(
      session.user.id,
      simulationInput,
      portfolioId
    );
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
