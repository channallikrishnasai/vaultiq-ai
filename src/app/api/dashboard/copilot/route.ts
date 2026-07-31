import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { generateCopilotBriefing } from "@/services/ai/copilot.service";

export async function GET() {
  try {
    const session = await requireAuth();
    const briefing = await generateCopilotBriefing(session.user.id);
    return successResponse(briefing);
  } catch (error) {
    return handleApiError(error);
  }
}
