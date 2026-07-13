import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-handler";
import { env } from "@/lib/env";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const rateLimitResult = checkRateLimit(`fraud:${session.user.id}`, RATE_LIMITS.fraud);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests." }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "AI service not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL text from this screenshot exactly as it appears. Preserve the original formatting, line breaks, and structure. Return ONLY the extracted text, no commentary or labels."
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.1,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.choices?.[0]?.message?.content) {
      return NextResponse.json({ success: false, error: "Failed to extract text from image" }, { status: 500 });
    }

    const extractedText = data.choices[0].message.content.trim();
    return NextResponse.json({ success: true, data: { text: extractedText } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handleApiError(error);
  }
}
