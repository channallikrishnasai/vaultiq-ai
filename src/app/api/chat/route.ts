import { NextRequest } from "next/server";
import { requireAuth, auth } from "@/lib/auth";
import { chatMessageSchema } from "@/validations/chat";
import { chatService } from "@/services/ai/chat.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");

    if (conversationId) {
      // Load messages for a specific conversation
      const messages = await chatService.getHistory(
        session.user.id,
        conversationId
      );
      return Response.json({ messages });
    }

    // List all conversations
    const conversations = await chatService.getSessions(session.user.id);
    return Response.json({ conversations });
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[chat] GET error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = chatMessageSchema.parse(body);
    const result = await chatService.sendMessage(
      session.user.id,
      data.message,
      data.sessionId
    );

    // Return as SSE stream for AIChat component compatibility
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
    if (error?.name === "UnauthorizedError") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[chat] POST error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");

    if (conversationId) {
      await chatService.deleteSession(session.user.id, conversationId);
    } else {
      await chatService.deleteAllSessions(session.user.id);
    }

    return Response.json({ ok: true });
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[chat] DELETE error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
