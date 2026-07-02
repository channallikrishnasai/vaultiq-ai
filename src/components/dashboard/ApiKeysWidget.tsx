"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Eye, EyeOff, Save, Trash2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ApiKeysWidget() {
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [openaiKey, setOpenaiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [copiedOpenai, setCopiedOpenai] = useState(false);
  const [copiedGroq, setCopiedGroq] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load state from localStorage
    const savedMin = localStorage.getItem("api-keys-minimized");
    if (savedMin !== null) {
      setIsMinimized(JSON.parse(savedMin));
    }
    const savedOpenai = localStorage.getItem("vaultiq-openai-key");
    if (savedOpenai) setOpenaiKey(savedOpenai);
    const savedGroq = localStorage.getItem("vaultiq-groq-key");
    if (savedGroq) setGroqKey(savedGroq);
  }, []);

  const saveKeys = () => {
    localStorage.setItem("vaultiq-openai-key", openaiKey);
    localStorage.setItem("vaultiq-groq-key", groqKey);
    toast.success("API Keys saved successfully");
  };

  const clearKeys = () => {
    localStorage.removeItem("vaultiq-openai-key");
    localStorage.removeItem("vaultiq-groq-key");
    setOpenaiKey("");
    setGroqKey("");
    toast.success("API Keys cleared");
  };

  const copyToClipboard = (text: string, type: "openai" | "groq") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "openai") {
      setCopiedOpenai(true);
      setTimeout(() => setCopiedOpenai(false), 2000);
    } else {
      setCopiedGroq(true);
      setTimeout(() => setCopiedGroq(false), 2000);
    }
    toast.success("Copied to clipboard");
  };

  // Toggle minimized state and persist
  const toggleMinimize = () => {
    const nextVal = !isMinimized;
    setIsMinimized(nextVal);
    localStorage.setItem("api-keys-minimized", JSON.stringify(nextVal));
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 left-16 z-50">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized-key"
            onClick={toggleMinimize}
            whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(212,175,55,0.4)" }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer shadow-lg hover:border-[#D4AF37]/50 transition-colors"
            title="Manage API Keys"
          >
            <Key size={16} className="text-[#D4AF37]" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="w-80 rounded-xl border border-zinc-800 bg-[#06060a]/95 backdrop-blur-md p-4 shadow-2xl flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <div className="flex items-center gap-1.5">
                <Key size={14} className="text-[#D4AF37]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                  API Provider Keys
                </span>
              </div>
              <button
                onClick={toggleMinimize}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              {/* OpenAI */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  OpenAI API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showOpenai ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#D4AF37]/40 pr-16"
                  />
                  <div className="absolute right-1 flex items-center gap-1">
                    <button
                      onClick={() => setShowOpenai(!showOpenai)}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      {showOpenai ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(openaiKey, "openai")}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      {copiedOpenai ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Groq */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  Groq API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showGroq ? "text" : "password"}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#D4AF37]/40 pr-16"
                  />
                  <div className="absolute right-1 flex items-center gap-1">
                    <button
                      onClick={() => setShowGroq(!showGroq)}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      {showGroq ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(groqKey, "groq")}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      {copiedGroq ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-zinc-850 pt-3 mt-1">
              <button
                onClick={saveKeys}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-[10px] rounded transition"
              >
                <Save size={10} /> Save Keys
              </button>
              <button
                onClick={clearKeys}
                className="flex items-center justify-center px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-rose-400 font-bold text-[10px] rounded transition"
              >
                <Trash2 size={10} /> Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
