"use client";

import { aiPrompts } from "@/lib/dashboard-data";
import { Sparkles, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AIAdvisorCard() {
  const [input, setInput] = useState("");

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <Sparkles className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">AI Advisor</h3>
          <p className="text-xs text-zinc-500">Ask anything about your finances</p>
        </div>
      </div>

      {/* Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask VaultIQ anything..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-4 pr-12 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-teal-500/50"
        />
        <button className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-teal-500 text-zinc-950 transition-colors hover:bg-teal-400">
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Suggested Prompts */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-600">Suggested:</p>
        <div className="flex flex-wrap gap-2">
          {aiPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-300"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <Link
        href="/dashboard/advisor"
        className="mt-5 block text-center text-xs font-medium text-teal-400 transition-colors hover:text-teal-300"
      >
        Open Full Advisor →
      </Link>
    </div>
  );
}