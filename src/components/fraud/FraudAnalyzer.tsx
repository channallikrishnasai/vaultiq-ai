"use client";

import { useState, useRef, useCallback } from "react";
import { Shield, Loader2, Sparkles, ScanLine, Upload, X, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FRAUD_INPUT_TYPES, FRAUD_EXAMPLES } from "@/lib/fraud-utils";
import { FraudResultCard } from "./FraudResultCard";
import type { FraudInputType } from "@/generated/prisma/enums";

export interface FraudAnalysisResponse {
  riskScore: number;
  riskBand: "Safe" | "Medium" | "High";
  threatCategory: string;
  threatIndicators?: string[];
  explanation: string;
  actions: string[];
  confidence?: number;
  reportId: string;
}

interface FraudAnalyzerProps {
  onAnalyzed?: () => void;
}

export function FraudAnalyzer({ onAnalyzed }: FraudAnalyzerProps) {
  const [inputType, setInputType] = useState<FraudInputType>("MESSAGE");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudAnalysisResponse | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setExtracting(true);

      try {
        const res = await fetch("/api/fraud/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();

        if (data.data?.text) {
          setContent(data.data.text);
          toast.success("Text extracted from screenshot");
        } else {
          toast.error("Could not extract text from image");
        }
      } catch {
        toast.error("Failed to process image");
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fraud/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType, content: content.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Analysis failed");
      setResult(json.data);
      toast.success("Analysis complete");
      onAnalyzed?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* First-use helper panel */}
      {!result && !content && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-zinc-900/50 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20">
              <ScanLine className="h-7 w-7 text-rose-400" />
            </div>
            <div>
              <h3 className="mb-1 text-base font-semibold text-zinc-50">
                Protect yourself from financial fraud
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Paste suspicious SMS, phishing links, phone numbers, or upload a
                screenshot. Our AI scans for urgency tactics, credential
                harvesting, fake KYC links, and lottery scams.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["SMS scams", "Phishing links", "Fake bank calls", "UPI fraud", "Screenshot OCR"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-700/60 bg-zinc-900/60 px-2.5 py-0.5 text-xs text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Shield className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-50">Fraud Shield Analyzer</h3>
            <p className="text-xs text-zinc-500">
              Instant AI-powered threat detection
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FRAUD_INPUT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                setInputType(type.value as FraudInputType);
                setImagePreview(null);
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                inputType === type.value
                  ? "border-teal-500/50 bg-teal-500/10 shadow-md shadow-teal-500/10"
                  : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
              }`}
            >
              <span className="text-lg">{type.icon}</span>
              <p className="mt-1 text-xs font-medium text-zinc-300">{type.label}</p>
            </button>
          ))}
        </div>

        {/* Screenshot Upload Zone */}
        {inputType === "SCREENSHOT" && (
          <div className="mb-4">
            {imagePreview ? (
              <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Screenshot"
                  className="w-full max-h-64 object-contain bg-black/40"
                />
                <button
                  onClick={() => { setImagePreview(null); setContent(""); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                >
                  <X size={14} />
                </button>
                {extracting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700">
                      <Loader2 size={16} className="animate-spin text-teal-400" />
                      <span className="text-xs text-zinc-300">Extracting text from screenshot...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700/60 bg-zinc-950/30 p-8 cursor-pointer transition-all hover:border-teal-500/40 hover:bg-teal-500/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                  <Upload size={20} className="text-zinc-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-300">
                    Drop a screenshot here or click to upload
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    PNG, JPG, WEBP up to 10MB — AI extracts text automatically
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            inputType === "SCREENSHOT"
              ? "Extracted text will appear here... or paste text manually"
              : "Paste suspicious message, link, or phone number here..."
          }
          rows={5}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500">Try example:</span>
          {FRAUD_EXAMPLES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setContent(example)}
              className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-300"
            >
              Example {i + 1}
            </button>
          ))}
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading || !content.trim()}
          className="mt-4 w-full bg-teal-500 text-zinc-950 shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-400 hover:shadow-teal-500/30"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze for Fraud
            </>
          )}
        </Button>
      </div>

      {result && <FraudResultCard result={result} />}
    </div>
  );
}
