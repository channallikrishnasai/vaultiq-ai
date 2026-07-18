import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { investmentAdvisorService } from "@/services/investment/investment-advisor.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimitResult = checkRateLimit(`investment-health:${session.user.id}`, RATE_LIMITS.analysis);
    if (!rateLimitResult.allowed) {
      return successResponse({ error: "Rate limit exceeded. Please try again later." }, "Rate limit exceeded", 429);
    }
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get("portfolioId") ?? undefined;
    const health = await investmentAdvisorService.getHealthScore(
      session.user.id,
      portfolioId
    );
    return successResponse(health);
  } catch (error) {
    return handleApiError(error);
  }
}
