import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { MarketError } from "@/services/market/market-types";
import { errorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const TAG = "API";

function marketErrorCodeToStatus(code: string): number {
  switch (code) {
    case "INVALID_SYMBOL":
    case "UNKNOWN_SYMBOL":
      return 400;
    case "PROVIDER_UNAVAILABLE":
      return 503;
    case "RATE_LIMITED":
      return 429;
    case "NETWORK_TIMEOUT":
      return 504;
    default:
      return 502;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(TAG, `${error.code}: ${error.message}`, error);
    }
    return errorResponse(
      error.code,
      error.message,
      error.statusCode,
      error.details,
    );
  }

  if (error instanceof MarketError) {
    const status = marketErrorCodeToStatus(error.code);
    if (status >= 500) {
      logger.error(TAG, `MarketError: ${error.code}: ${error.message}`, error);
    }
    return errorResponse(
      error.code,
      error.message,
      status,
      { symbol: error.symbol, provider: error.provider },
    );
  }

  if (error instanceof ZodError) {
    return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, {
      issues: error.issues,
    });
  }

  logger.error(TAG, "Unhandled API error", error);
  return errorResponse(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    500,
  );
}
