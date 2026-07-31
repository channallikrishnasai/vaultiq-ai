"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, FileText, Target, Wallet, TrendingUp,
  Bell, Receipt, ArrowDownLeft, Filter, Loader2,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface SearchResult {
  id: string;
  entityType: string;
  title: string;
  subtitle: string;
  value?: number;
  date?: string;
  icon: string;
  color: string;
  relevance: number;
}

interface SearchResponse {
  results: SearchResult[];
  grouped: Record<string, SearchResult[]>;
  total: number;
  query: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Receipt, Target, Wallet, TrendingUp, Bell, FileText, ArrowDownLeft,
};

const ENTITY_LABELS: Record<string, string> = {
  expense: "Expenses",
  goal: "Goals",
  budget: "Budgets",
  document: "Documents",
  stock: "Stocks",
  alert: "Alerts",
  income: "Income",
  bill: "Bills",
};

interface UniversalSearchProps {
  userId: string;
  onSelect?: (result: SearchResult) => void;
  onAction?: (action: string, params: Record<string, unknown>) => void;
}

export default function UniversalSearch({ userId, onSelect }: UniversalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 1) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // Search failed silently
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, debouncedSearch]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredResults = selectedGroup && results
    ? results.grouped[selectedGroup] ?? []
    : results?.results ?? [];

  const groups = results?.grouped ? Object.keys(results.grouped) : [];

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
      >
        <Search className="h-4 w-4" />
        <span>Search anything...</span>
        <kbd className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/40">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                ) : (
                  <Search className="h-5 w-5 text-white/40" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search transactions, goals, stocks, documents..."
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {groups.length > 0 && (
                <div className="flex gap-1 border-b border-white/5 px-4 py-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className={`rounded-lg px-2 py-1 text-xs transition-colors ${
                      !selectedGroup ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    All ({results?.total ?? 0})
                  </button>
                  {groups.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={`rounded-lg px-2 py-1 text-xs transition-colors whitespace-nowrap ${
                        selectedGroup === g ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      {ENTITY_LABELS[g] ?? g} ({results?.grouped[g]?.length ?? 0})
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-[400px] overflow-y-auto p-2">
                {filteredResults.length === 0 && query && !loading && (
                  <div className="py-8 text-center text-sm text-white/30">
                    No results found for &quot;{query}&quot;
                  </div>
                )}
                {filteredResults.map((result) => {
                  const Icon = ICON_MAP[result.icon] || FileText;
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        onSelect?.(result);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ${result.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{result.title}</div>
                        <div className="text-xs text-white/40 truncate">{result.subtitle}</div>
                      </div>
                      {result.value !== undefined && (
                        <div className="text-sm font-medium text-white/70">{formatCurrency(result.value)}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
