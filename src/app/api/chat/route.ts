import { requireAuth } from "@/lib/auth";
import { chatMessageSchema } from "@/validations/chat";
import { chatService } from "@/services/ai/chat.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const sessions = await chatService.getSessions(session.user.id);
    return successResponse(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = chatMessageSchema.parse(body);
    const result = await chatService.sendMessage(
      session.user.id,
      data.message,
      data.sessionId,
    );
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
