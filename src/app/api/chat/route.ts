import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { chatMessageSchema } from "@/validations/chat";
import { chatService } from "@/services/ai/chat.service";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-handler";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");

    if (conversationId) {
      const messages = await chatService.getHistory(
        session.user.id,
        conversationId
      );
      return Response.json({ messages });
    }

    const conversations = await chatService.getSessions(session.user.id);
    return Response.json({ conversations });
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error?.name === "UnauthorizedError") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimitResult = checkRateLimit(`chat:${session.user.id}`, RATE_LIMITS.chat);
    if (!rateLimitResult.allowed) {
      return Response.json({ error: "Too many requests. Please try again later." }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const body = await request.json();
    const data = chatMessageSchema.parse(body);
    const result = await chatService.sendMessage(
      session.user.id,
      data.message,
      data.sessionId
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const sseData = `data: ${JSON.stringify({ content: result.message })}\n\ndata: [DONE]\n\n`;
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error?.name === "UnauthorizedError") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");

    if (conversationId) {
      await chatService.deleteSession(session.user.id, conversationId);
    } else {
      await chatService.deleteAllSessions(session.user.id);
    }

    return Response.json({ ok: true });
  } catch (error: any) {
    if (error instanceof UnauthorizedError || error?.name === "UnauthorizedError") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(error);
  }
}
