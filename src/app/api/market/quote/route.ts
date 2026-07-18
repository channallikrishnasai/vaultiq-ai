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

    const rateLimitResult = checkRateLimit(`market:quote:${session.user.id}`, RATE_LIMITS.analysis);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      );
    }

    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get("symbols");

    if (!symbols) {
      const symbol = searchParams.get("symbol");
      if (!symbol) {
        return handleApiError(
          new MarketError({
            code: "INVALID_SYMBOL",
            message: "Provide either 'symbol' or 'symbols' query parameter",
            timestamp: new Date().toISOString(),
          }),
        );
      }

      const quote = await marketService.getQuote(symbol);
      return successResponse(quote);
    }

    const symbolList = symbols.split(",").map((s) => s.trim()).filter(Boolean);

    if (symbolList.length === 0) {
      return handleApiError(
        new MarketError({
          code: "INVALID_SYMBOL",
          message: "No valid symbols provided",
          timestamp: new Date().toISOString(),
        }),
      );
    }

    if (symbolList.length > 50) {
      return handleApiError(
        new MarketError({
          code: "INVALID_SYMBOL",
          message: "Maximum 50 symbols per request",
          timestamp: new Date().toISOString(),
        }),
      );
    }

    const response = await marketService.getBatchQuotes({ symbols: symbolList });
    return successResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
}
