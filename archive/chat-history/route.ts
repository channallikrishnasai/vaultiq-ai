import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRLSClient } from "@/lib/supabase";

// GET — fetch chat sessions or specific session messages
export async function GET(req: NextRequest) {
  const session = await auth();
  console.log("[chat-history] GET session:", session?.user?.id ? "authenticated" : "unauthenticated");
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  const client = await createRLSClient(session.user.id);

  // Fetch specific session
  if (sessionId) {
    const { data, error } = await client
      .from("chat_history")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("session_id", sessionId)
      .single();

    if (error) {
      console.error("[chat-history] GET single error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  }

  // Fetch all sessions (list view)
  const { data, error } = await client
    .from("chat_history")
    .select("id, session_id, summary, created_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[chat-history] GET list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[chat-history] GET result:", data?.length, "sessions");
  return NextResponse.json({ history: data });
}

// POST — upsert a chat session (insert or update)
export async function POST(req: NextRequest) {
  const session = await auth();
  console.log("[chat-history] POST session:", session?.user?.id ? "authenticated" : "unauthenticated");
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { session_id, summary, messages } = body;

  if (!session_id || !messages) {
    return NextResponse.json({ error: "Missing session_id or messages" }, { status: 400 });
  }

  console.log("[chat-history] POST saving session:", session_id, "messages:", messages.length);

  const client = await createRLSClient(session.user.id);

  // Upsert: insert or update if session already exists for this user
  const { data, error } = await client
    .from("chat_history")
    .upsert(
      {
        user_id: session.user.id,
        session_id,
        summary: summary || "",
        messages,
      },
      { onConflict: "user_id,session_id" }
    )
    .select();

  if (error) {
    console.error("[chat-history] POST upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[chat-history] POST success:", data);
  return NextResponse.json({ ok: true });
}

// DELETE — delete a single session or all for the current user
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  const client = await createRLSClient(session.user.id);
  let query = client.from("chat_history").delete().eq("user_id", session.user.id);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { error } = await query;

  if (error) {
    console.error("[chat-history] DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
