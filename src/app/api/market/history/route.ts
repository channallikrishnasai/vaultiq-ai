import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { marketService } from "@/services/market/market.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { MarketError } from "@/services/market/market-types";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { isValidInterval } from "@/services/market/market-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const rateLimitResult = checkRateLimit(`market:history:${session.user.id}`, RATE_LIMITS.analysis);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const interval = searchParams.get("interval") ?? "1mo";

    if (!symbol) {
      return handleApiError(
        new MarketError({
          code: "INVALID_SYMBOL",
          message: "Provide 'symbol' query parameter",
          timestamp: new Date().toISOString(),
        }),
      );
    }

    if (!isValidInterval(interval)) {
      const validIntervals = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"];
      return handleApiError(
        new MarketError({
          code: "INVALID_INTERVAL",
          message: `Invalid interval: ${interval}. Valid: ${validIntervals.join(", ")}`,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    const history = await marketService.getHistory(symbol, interval);
    return successResponse(history);
  } catch (error) {
    return handleApiError(error);
  }
}
