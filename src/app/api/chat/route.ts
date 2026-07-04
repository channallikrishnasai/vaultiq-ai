import { requireAuth } from "@/lib/auth";
import { chatMessageSchema } from "@/validations/chat";
import { chatService } from "@/services/ai/chat.service";

export async function GET() {
  try {
    const session = await requireAuth();
    const sessions = await chatService.getSessions(session.user.id);
    return Response.json({ success: true, data: sessions });
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    return Response.json({ success: false, error: { code: "INTERNAL", message: "Server error" } }, { status: 500 });
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

    // Return as SSE stream for AIChat component compatibility
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the full response as a single SSE chunk
        const sseData = `data: ${JSON.stringify({ content: result.message })}\n\ndata: [DONE]\n\n`;
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    return Response.json({ success: false, error: { code: "INTERNAL", message: "Server error" } }, { status: 500 });
  }
}
