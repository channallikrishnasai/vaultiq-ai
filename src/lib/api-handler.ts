import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { errorResponse } from "@/lib/api-response";

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(
      error.code,
      error.message,
      error.statusCode,
      error.details,
    );
  }

  if (error instanceof ZodError) {
    return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, {
      issues: error.issues,
    });
  }

  console.error("[API Error]", error);
  return errorResponse(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    500,
  );
}
