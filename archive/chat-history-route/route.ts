import { requireAuth } from "@/lib/auth";
import { chatHistoryQuerySchema } from "@/validations/chat";
import { chatService } from "@/services/ai/chat.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = chatHistoryQuerySchema.parse({
      sessionId: searchParams.get("sessionId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const history = await chatService.getHistory(
      session.user.id,
      query.sessionId,
      query.limit,
    );
    return successResponse(history);
  } catch (error) {
    return handleApiError(error);
  }
}
