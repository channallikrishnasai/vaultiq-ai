"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface AIAdvisorCardProps {
  userId: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AIAdvisorCard({ userId }: AIAdvisorCardProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedPrompts = [
    "Should I prepay my home loan?",
    "How to save ₹20L for education?",
    "Is my portfolio balanced?",
    "Best SIP for retirement?",
  ];

  async function sendMessage(message: string) {
    if (!message.trim() || loading) return;

    setLoading(true);
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId: crypto.randomUUID(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      const assistantMsg = {
  role: "assistant",
  content:
    data?.data?.message ||
    data?.message ||
    data?.data?.content ||
    data?.content ||
    "No response received.",
};

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError("Unable to reach AI advisor. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <Sparkles className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">AI Advisor</h3>
          <p className="text-xs text-zinc-500">Ask anything about your finances</p>
        </div>
      </div>

      {/* Messages */}
      <div className="mb-4 flex-1 space-y-3 overflow-y-auto pr-1 max-h-64">
        {messages.length === 0 && (
          <div className="rounded-xl bg-zinc-950/50 p-3">
            <p className="text-sm text-zinc-400">
              Hi! I'm your AI financial advisor. Ask me about investments,
              savings, or your portfolio.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl p-3 ${
              msg.role === "user"
                ? "ml-6 bg-teal-500/10 text-teal-100"
                : "mr-6 bg-zinc-950/50 text-zinc-300"
            }`}
          >
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        ))}

        {loading && (
          <div className="mr-6 flex items-center gap-2 rounded-xl bg-zinc-950/50 p-3">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
            <span className="text-xs text-zinc-500">Thinking...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-500/10 p-3">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask VaultIQ anything..."
          disabled={loading}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-4 pr-12 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-violet-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-violet-500 text-zinc-950 transition-colors hover:bg-violet-400 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* Suggested Prompts */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-600">Suggested:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}