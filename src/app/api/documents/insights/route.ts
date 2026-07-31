import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { documentService } from "@/services/document/document.service";

export async function GET() {
  try {
    const session = await requireAuth();
    const insights = await documentService.getRecentInsights(session.user.id);
    return successResponse(insights);
  } catch (error) {
    return handleApiError(error);
  }
}
