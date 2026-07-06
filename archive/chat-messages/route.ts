import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRLSClient } from "@/lib/supabase";

// POST — save a single message (user or assistant)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role, content, conversation_id } = body;

    if (!role || !content || !conversation_id) {
      console.error("[chat-messages] POST missing fields:", { role: !!role, content: !!content, conversation_id: !!conversation_id });
      return NextResponse.json({ error: "Missing role, content, or conversation_id" }, { status: 400 });
    }

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json({ error: "Role must be 'user' or 'assistant'" }, { status: 400 });
    }

    const client = await createRLSClient(session.user.id);
    const { data, error } = await client
      .from("chat_messages")
      .insert({
        user_id: session.user.id,
        role,
        content,
        conversation_id,
      })
      .select()
      .single();

    if (error) {
      console.error("[chat-messages] POST insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[chat-messages] POST saved:", { id: data.id, role, conversation_id });
    return NextResponse.json({ ok: true, message: data });
  } catch (e) {
    console.error("[chat-messages] POST unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — load messages for a conversation, or all conversations for the user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await createRLSClient(session.user.id);
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");

    if (conversationId) {
      // Load messages for a specific conversation
      const { data, error } = await client
        .from("chat_messages")
        .select("id, role, content, conversation_id, created_at")
        .eq("user_id", session.user.id)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[chat-messages] GET conversation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("[chat-messages] GET conversation:", data?.length, "messages for", conversationId);
      return NextResponse.json({ messages: data });
    }

    // Load all conversations list (latest message per conversation for summary)
    const { data, error } = await client
      .from("chat_messages")
      .select("conversation_id, content, role, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[chat-messages] GET list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by conversation_id, keep only the first user message as summary
    const conversationMap = new Map<string, { conversation_id: string; summary: string; created_at: string }>();
    for (const msg of data || []) {
      if (!conversationMap.has(msg.conversation_id)) {
        conversationMap.set(msg.conversation_id, {
          conversation_id: msg.conversation_id,
          summary: msg.role === "user" ? msg.content.slice(0, 80) : "",
          created_at: msg.created_at,
        });
      } else if (msg.role === "user") {
        const conv = conversationMap.get(msg.conversation_id)!;
        if (!conv.summary) conv.summary = msg.content.slice(0, 80);
      }
    }

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log("[chat-messages] GET conversations:", conversations.length);
    return NextResponse.json({ conversations });
  } catch (e) {
    console.error("[chat-messages] GET unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — delete messages for a conversation
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");

    const client = await createRLSClient(session.user.id);
    let query = client
      .from("chat_messages")
      .delete()
      .eq("user_id", session.user.id);

    if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    const { error } = await query;

    if (error) {
      console.error("[chat-messages] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[chat-messages] DELETE conversation:", conversationId || "all");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[chat-messages] DELETE unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
