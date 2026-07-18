import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { marketService } from "@/services/market/market.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { MarketError } from "@/services/market/market-types";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const rateLimitResult = checkRateLimit(`market:search:${session.user.id}`, RATE_LIMITS.analysis);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return handleApiError(
        new MarketError({
          code: "INVALID_SYMBOL",
          message: "Provide 'q' query parameter with at least 2 characters",
          timestamp: new Date().toISOString(),
        }),
      );
    }

    const results = await marketService.search(query);
    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
