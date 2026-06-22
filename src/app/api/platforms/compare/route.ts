import { requireAuth } from "@/lib/auth";
import { platformCompareSchema } from "@/validations/platform";
import { platformComparisonService } from "@/services/platforms/comparison.service";
import { platformRepository } from "@/repositories/platform.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const preferences = platformCompareSchema.parse(body);
    const result = platformComparisonService.compare(preferences);

    await platformRepository.create(session.user.id, preferences, result);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
