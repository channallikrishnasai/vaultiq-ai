import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { documentService } from "@/services/document/document.service";

export async function GET() {
  try {
    const session = await requireAuth();
    const stats = await documentService.getStats(session.user.id);
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
