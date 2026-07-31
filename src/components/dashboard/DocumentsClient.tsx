"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Trash2, RefreshCw,
  Building2, Wallet, Receipt, Shield, TrendingUp, BarChart3,
  CreditCard, Landmark, PieChart, Clock, CheckCircle2, XCircle,
  AlertTriangle, Search, ChevronLeft,
  Brain, File, Image, FileSpreadsheet,
  Loader2, Sparkles, FolderOpen, Activity, X,
  Info,
} from "lucide-react";
import GlassCard from "./GlassCard";

// ── Types ────────────────────────────────────────────────────────────────────

interface DocumentItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  status: string;
  classification: Record<string, unknown> | null;
  extraction: Record<string, unknown> | null;
  transactions: Record<string, unknown> | null;
  insightsData: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentInsight {
  id: string;
  insightType: string;
  content: string;
  severity: string;
  createdAt: string;
}

interface DocumentStats {
  total: number;
  processed: number;
  pending: number;
  failed: number;
  byCategory: { category: string; count: number }[];
  latestInsight: string | null;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  result?: { id: string; status: string; classification?: { category: string; confidence: number } };
  error?: string;
}

interface DetailView {
  document: DocumentItem;
  insights: DocumentInsight[];
}

// ── Category Config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; label: string; bg: string }> = {
  BANK_STATEMENT: { icon: Building2, color: "#3b82f6", label: "Bank Statement", bg: "rgba(59,130,246,0.1)" },
  SALARY_SLIP: { icon: Wallet, color: "#10b981", label: "Salary Slip", bg: "rgba(16,185,129,0.1)" },
  TAX_DOCUMENT: { icon: Receipt, color: "#f59e0b", label: "Tax Document", bg: "rgba(245,158,11,0.1)" },
  INSURANCE_POLICY: { icon: Shield, color: "#8b5cf6", label: "Insurance Policy", bg: "rgba(139,92,246,0.1)" },
  MUTUAL_FUND_STATEMENT: { icon: TrendingUp, color: "#06b6d4", label: "Mutual Fund", bg: "rgba(6,182,212,0.1)" },
  STOCK_HOLDING_STATEMENT: { icon: BarChart3, color: "#ef4444", label: "Stock Holdings", bg: "rgba(239,68,68,0.1)" },
  CREDIT_CARD_STATEMENT: { icon: CreditCard, color: "#ec4899", label: "Credit Card", bg: "rgba(236,72,153,0.1)" },
  LOAN_DOCUMENT: { icon: Landmark, color: "#f97316", label: "Loan Document", bg: "rgba(249,115,22,0.1)" },
  INVESTMENT_REPORT: { icon: PieChart, color: "#14b8a6", label: "Investment Report", bg: "rgba(20,184,166,0.1)" },
  OTHER: { icon: FileText, color: "#6b7280", label: "Other", bg: "rgba(107,114,128,0.1)" },
};

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; label: string }> = {
  UPLOADING: { icon: Upload, color: "#f59e0b", label: "Uploading" },
  PROCESSING: { icon: Loader2, color: "#3b82f6", label: "Processing" },
  CLASSIFIED: { icon: Brain, color: "#8b5cf6", label: "Classified" },
  EXTRACTED: { icon: CheckCircle2, color: "#10b981", label: "Extracted" },
  FAILED: { icon: XCircle, color: "#ef4444", label: "Failed" },
};

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getFileIcon(fileType: string): React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> {
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("csv") || fileType.includes("excel") || fileType.includes("sheet")) return FileSpreadsheet;
  if (fileType.includes("image")) return Image;
  return File;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "#10b981";
  if (confidence >= 0.6) return "#f59e0b";
  return "#ef4444";
}

// ── Extraction Display ───────────────────────────────────────────────────────

function ExtractionDisplay({ extraction }: { category: string; extraction: Record<string, unknown> }) {
  if (!extraction) return null;

  const fields = Object.entries(extraction).filter(([, v]) => v !== undefined && v !== null && v !== "");

  if (fields.length === 0) return null;

  return (
    <div className="space-y-2">
      {fields.map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        const isAmount = typeof value === "number" && value > 100;
        return (
          <div
            key={key}
            className="flex items-center justify-between py-1.5 px-3 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span className="text-xs text-zinc-400">{label}</span>
            <span className="text-xs font-medium text-zinc-200">
              {isAmount ? `₹${(value as number).toLocaleString("en-IN")}` : String(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Transaction Intelligence Display ─────────────────────────────────────────

function TransactionIntelDisplay({ transactions }: { transactions: Record<string, unknown> }) {
  const [activeTab, setActiveTab] = useState<"breakdown" | "merchants" | "recurring" | "trend">("breakdown");

  if (!transactions) return null;

  const spendingBreakdown = (transactions.spendingBreakdown || []) as { category: string; amount: number; percent: number; count: number }[];
  const topMerchants = (transactions.topMerchants || []) as { name: string; total: number; count: number }[];
  const recurringPayments = (transactions.recurringPayments || []) as { merchant: string; averageAmount: number; frequency: string }[];
  const monthlyTrend = (transactions.monthlyTrend || []) as { month: string; income: number; expenses: number; savings: number }[];
  const savingsSummary = transactions.savingsSummary as { total: number; rate: number } | undefined;

  const tabs = [
    { key: "breakdown" as const, label: "Spending" },
    { key: "merchants" as const, label: "Merchants" },
    { key: "recurring" as const, label: "Recurring" },
    { key: "trend" as const, label: "Trend" },
  ];

  return (
    <div className="space-y-3">
      {savingsSummary && (
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: savingsSummary.rate > 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${savingsSummary.rate > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}
        >
          <div>
            <p className="text-xs text-zinc-400">Savings Rate</p>
            <p className="text-lg font-bold" style={{ color: savingsSummary.rate > 0 ? "#10b981" : "#ef4444" }}>
              {savingsSummary.rate}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">Total Saved</p>
            <p className="text-sm font-semibold text-zinc-200">₹{savingsSummary.total.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-1.5 px-2 rounded-md text-[10px] font-medium transition-all"
            style={{
              background: activeTab === tab.key ? "rgba(212,175,55,0.12)" : "transparent",
              color: activeTab === tab.key ? "#D4AF37" : "#71717a",
              border: activeTab === tab.key ? "1px solid rgba(212,175,55,0.2)" : "1px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "breakdown" && (
          <motion.div key="breakdown" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-1.5">
            {spendingBreakdown.length === 0 && <p className="text-xs text-zinc-500 text-center py-4">No spending data</p>}
            {spendingBreakdown.slice(0, 8).map((item) => (
              <div key={item.category} className="flex items-center gap-2 py-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300 truncate">{item.category}</span>
                    <span className="text-[10px] text-zinc-500 ml-2">{item.percent}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ background: `linear-gradient(90deg, #D4AF37, ${CATEGORY_CONFIG.OTHER.color})` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 w-16 text-right">₹{item.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "merchants" && (
          <motion.div key="merchants" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-1.5">
            {topMerchants.length === 0 && <p className="text-xs text-zinc-500 text-center py-4">No merchant data</p>}
            {topMerchants.slice(0, 6).map((m, i) => (
              <div
                key={m.name}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="text-[10px] font-bold text-zinc-600 w-4">#{i + 1}</span>
                <span className="text-xs text-zinc-300 flex-1 truncate">{m.name}</span>
                <span className="text-[10px] text-zinc-400">{m.count}x</span>
                <span className="text-xs font-medium text-zinc-200">₹{m.total.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "recurring" && (
          <motion.div key="recurring" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-1.5">
            {recurringPayments.length === 0 && <p className="text-xs text-zinc-500 text-center py-4">No recurring payments</p>}
            {recurringPayments.slice(0, 5).map((r) => (
              <div
                key={r.merchant}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.12)" }}
              >
                <RefreshCw size={12} className="text-purple-400 shrink-0" />
                <span className="text-xs text-zinc-300 flex-1 truncate">{r.merchant}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                  {r.frequency}
                </span>
                <span className="text-xs font-medium text-zinc-200">₹{r.averageAmount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "trend" && (
          <motion.div key="trend" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-1.5">
            {monthlyTrend.length === 0 && <p className="text-xs text-zinc-500 text-center py-4">No trend data</p>}
            {monthlyTrend.map((m) => {
              const maxVal = Math.max(m.income, m.expenses, 1);
              return (
                <div key={m.month} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium">{m.month}</span>
                    <span className="text-[10px] text-zinc-500">
                      ₹{m.income.toLocaleString("en-IN")} / ₹{m.expenses.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden flex gap-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(m.income / maxVal) * 100}%`, background: "#10b981" }} />
                    <div className="h-full rounded-full" style={{ width: `${(m.expenses / maxVal) * 100}%`, background: "#ef4444" }} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Insights Panel ───────────────────────────────────────────────────────────

function InsightsPanel({ insights }: { insights: DocumentInsight[] }) {
  const severityConfig: Record<string, { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; bg: string }> = {
    info: { icon: Info, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
    success: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
    warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    critical: { icon: XCircle, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  };

  return (
    <div className="space-y-2">
      {insights.map((insight) => {
        const config = severityConfig[insight.severity] || severityConfig.info;
        const Icon = config.icon;
        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 p-2.5 rounded-lg"
            style={{ background: config.bg, border: `1px solid ${config.color}22` }}
          >
            <Icon size={14} style={{ color: config.color }} className="mt-0.5 shrink-0" />
            <p className="text-xs text-zinc-300 leading-relaxed">{insight.content}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Processing Timeline ──────────────────────────────────────────────────────

function ProcessingTimeline({ document }: { document: DocumentItem }) {
  const steps: { label: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; done: boolean }[] = [
    { label: "Uploaded", icon: Upload, done: true },
    { label: "Processing", icon: Loader2, done: ["CLASSIFIED", "EXTRACTED"].includes(document.status) },
    { label: "Classified", icon: Brain, done: ["CLASSIFIED", "EXTRACTED"].includes(document.status) },
    { label: "Extracted", icon: CheckCircle2, done: document.status === "EXTRACTED" },
  ];

  if (document.status === "FAILED") {
    steps[1] = { ...steps[1], done: false };
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: step.done ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${step.done ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <Icon size={10} style={{ color: step.done ? "#10b981" : "#52525b" }} />
              </div>
              <span className="text-[8px] text-zinc-500">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mb-4"
                style={{ background: step.done ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Upload Area ──────────────────────────────────────────────────────────────

function UploadArea({ onUpload }: { onUpload: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  }, [onUpload]);

  const validateFiles = (files: File[]): File[] => {
    return files.filter((f) => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
      if (f.size > MAX_FILE_SIZE) return false;
      return true;
    });
  };

  return (
    <motion.div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      animate={{
        borderColor: isDragging ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)",
        background: isDragging ? "rgba(212,175,55,0.04)" : "rgba(255,255,255,0.02)",
      }}
      className="relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all hover:border-[rgba(212,175,55,0.3)] hover:bg-[rgba(212,175,55,0.02)]"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.xls,.xlsx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) onUpload(validateFiles(files));
          e.target.value = "";
        }}
      />
      <motion.div
        animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: isDragging ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Upload size={22} style={{ color: isDragging ? "#D4AF37" : "#71717a" }} />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-300">
            {isDragging ? "Drop files here" : "Drag & drop documents"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            PDF, CSV, XLSX, JPG, PNG — Max 10MB
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#D4AF37",
          }}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Browse Files
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Upload Queue ─────────────────────────────────────────────────────────────

function UploadQueue({ uploads, onCancel, onRetry }: {
  uploads: UploadFile[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  if (uploads.length === 0) return null;

  return (
    <div className="space-y-2">
      {uploads.map((upload) => {
        const FileIcon = getFileIcon(upload.file.type);
        return (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <FileIcon size={16} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-300 truncate">{upload.file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${upload.progress}%` }}
                    style={{
                      background: upload.status === "error" ? "#ef4444" : upload.status === "done" ? "#10b981" : "#D4AF37",
                    }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 w-8 text-right">{upload.progress}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {upload.status === "error" && (
                <button onClick={() => onRetry(upload.id)} className="p-1 rounded-md hover:bg-white/5">
                  <RefreshCw size={12} className="text-zinc-400" />
                </button>
              )}
              {upload.status !== "done" && (
                <button onClick={() => onCancel(upload.id)} className="p-1 rounded-md hover:bg-white/5">
                  <X size={12} className="text-zinc-400" />
                </button>
              )}
              {upload.status === "done" && (
                <CheckCircle2 size={14} className="text-emerald-400" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Document Detail Panel ────────────────────────────────────────────────────

function DocumentDetail({ detail, onClose, onDelete }: {
  detail: DetailView;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { document: doc, insights } = detail;
  const catConfig = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.OTHER;
  const CatIcon = catConfig.icon;
  const extraction = doc.extraction as Record<string, unknown> | null;
  const classification = doc.classification as { category?: string; confidence?: number; reasoning?: string } | null;
  const transactions = doc.transactions as Record<string, unknown> | null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft size={16} className="text-zinc-400" />
          </button>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: catConfig.bg, border: `1px solid ${catConfig.color}33` }}
          >
            <CatIcon size={18} style={{ color: catConfig.color }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">{doc.fileName}</h3>
            <p className="text-[10px] text-zinc-500">{catConfig.label} · {formatDate(doc.createdAt)}</p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>

      {/* Timeline */}
      <ProcessingTimeline document={doc} />

      {/* Classification */}
      {classification && (
        <div
          className="p-3 rounded-xl"
          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-purple-400" />
            <span className="text-xs font-medium text-purple-300">AI Classification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">{catConfig.label}</span>
            {classification.confidence && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `${getConfidenceColor(classification.confidence)}15`,
                  color: getConfidenceColor(classification.confidence),
                  border: `1px solid ${getConfidenceColor(classification.confidence)}30`,
                }}
              >
                {Math.round(classification.confidence * 100)}% confidence
              </span>
            )}
          </div>
          {classification.reasoning && (
            <p className="text-[10px] text-zinc-500 mt-1">{classification.reasoning}</p>
          )}
        </div>
      )}

      {/* Extracted Data */}
      {extraction && Object.keys(extraction).length > 0 && (
        <div
          className="p-3 rounded-xl"
          style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-cyan-400" />
            <span className="text-xs font-medium text-cyan-300">Extracted Information</span>
          </div>
          <ExtractionDisplay category={doc.category} extraction={extraction} />
        </div>
      )}

      {/* Transaction Intelligence */}
      {transactions && (
        <div
          className="p-3 rounded-xl"
          style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-300">Transaction Intelligence</span>
          </div>
          <TransactionIntelDisplay transactions={transactions} />
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div
          className="p-3 rounded-xl"
          style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">AI Insights</span>
          </div>
          <InsightsPanel insights={insights} />
        </div>
      )}
    </motion.div>
  );
}

// ── Main DocumentsClient ─────────────────────────────────────────────────────

export default function DocumentsClient() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [insights, setInsights] = useState<DocumentInsight[]>([]);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<DetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const filterStatus = "all";
  const abortRefs = useRef<Map<string, AbortController>>(new Map());

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      if (data.success) setDocuments(data.data);
    } catch {}
  }, [filterCategory, filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/stats");
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/insights");
      const data = await res.json();
      if (data.success) setInsights(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchStats(), fetchInsights()]).finally(() => setLoading(false));
  }, [fetchDocuments, fetchStats, fetchInsights]);

  const handleUpload = useCallback(async (files: File[]) => {
    const newUploads: UploadFile[] = files.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      progress: 0,
      status: "pending" as const,
    }));

    setUploads((prev) => [...newUploads, ...prev]);

    for (const upload of newUploads) {
      const controller = new AbortController();
      abortRefs.current.set(upload.id, controller);

      setUploads((prev) => prev.map((u) => u.id === upload.id ? { ...u, status: "uploading" } : u));

      try {
        const text = await upload.file.text();

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploads((prev) => prev.map((u) =>
            u.id === upload.id && u.progress < 90 ? { ...u, progress: u.progress + 10 } : u
          ));
        }, 200);

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: upload.file.name,
            fileType: upload.file.type,
            fileSize: upload.file.size,
            text,
          }),
          signal: controller.signal,
        });

        clearInterval(progressInterval);

        const data = await res.json();

        if (data.success && data.data) {
          setUploads((prev) => prev.map((u) =>
            u.id === upload.id ? { ...u, progress: 100, status: "done", result: data.data } : u
          ));
        } else {
          setUploads((prev) => prev.map((u) =>
            u.id === upload.id ? { ...u, status: "error", error: data.error || "Upload failed" } : u
          ));
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setUploads((prev) => prev.map((u) =>
          u.id === upload.id ? { ...u, status: "error", error: "Upload failed" } : u
        ));
      } finally {
        abortRefs.current.delete(upload.id);
      }
    }

    // Refresh data after uploads complete
    setTimeout(() => {
      fetchDocuments();
      fetchStats();
      fetchInsights();
    }, 1000);
  }, [fetchDocuments, fetchStats, fetchInsights]);

  const handleCancelUpload = useCallback((id: string) => {
    abortRefs.current.get(id)?.abort();
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const handleRetryUpload = useCallback((id: string) => {
    const upload = uploads.find((u) => u.id === id);
    if (upload) handleUpload([upload.file]);
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, [uploads, handleUpload]);

  const handleViewDocument = useCallback(async (doc: DocumentItem) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const data = await res.json();
      if (data.success) {
        const docInsights = insights.filter((i) => i.id && documents.find((d) => d.id === doc.id));
        setSelectedDetail({ document: data.data, insights: docInsights });
      }
    } catch {}
  }, [insights, documents]);

  const handleDeleteDocument = useCallback(async (docId: string) => {
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setSelectedDetail(null);
      fetchStats();
    } catch {}
  }, [fetchStats]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (searchQuery && !doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [documents, searchQuery]);

  const recentDocuments = filteredDocuments.slice(0, 10);
  const processingDocs = documents.filter((d) => ["UPLOADING", "PROCESSING", "CLASSIFIED"].includes(d.status));

  return (
    <div className="h-full overflow-y-auto scrollbar-none">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Document Center</h1>
            <p className="text-xs text-zinc-500 mt-0.5">AI-powered financial document intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchDocuments(); fetchStats(); fetchInsights(); }}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={14} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Documents", value: stats?.total ?? 0, icon: FileText, color: "#D4AF37" },
            { label: "Processed", value: stats?.processed ?? 0, icon: CheckCircle2, color: "#10b981" },
            { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "#f59e0b" },
            { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, color: "#ef4444" },
          ].map((stat, i) => (
            <GlassCard key={stat.label} delay={i * 0.05} glow="none" hover={false}>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon size={14} style={{ color: stat.color }} />
                  <span className="text-lg font-bold text-zinc-100">{stat.value}</span>
                </div>
                <p className="text-[10px] text-zinc-500">{stat.label}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="flex gap-4">
          {/* Left column */}
          <div className={`flex-1 space-y-4 ${selectedDetail ? "hidden lg:block" : ""}`}>
            {/* Upload Area */}
            <GlassCard delay={0.1} glow="gold">
              <div className="p-4">
                <UploadArea onUpload={handleUpload} />
              </div>
            </GlassCard>

            {/* Upload Queue */}
            <AnimatePresence>
              {uploads.length > 0 && (
                <GlassCard delay={0.15} glow="none">
                  <div className="p-4">
                    <h3 className="text-xs font-medium text-zinc-400 mb-3">Upload Queue</h3>
                    <UploadQueue uploads={uploads} onCancel={handleCancelUpload} onRetry={handleRetryUpload} />
                  </div>
                </GlassCard>
              )}
            </AnimatePresence>

            {/* Processing Queue */}
            {processingDocs.length > 0 && (
              <GlassCard delay={0.2} glow="blue">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 size={14} className="text-blue-400 animate-spin" />
                    <h3 className="text-xs font-medium text-blue-300">Processing Queue</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                      {processingDocs.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {processingDocs.map((doc) => {
                      const catConfig = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.OTHER;
                      const CatIcon = catConfig.icon;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-2 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                        >
                          <CatIcon size={14} style={{ color: catConfig.color }} />
                          <span className="text-xs text-zinc-300 flex-1 truncate">{doc.fileName}</span>
                          <Loader2 size={12} className="text-blue-400 animate-spin" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Documents List */}
            <GlassCard delay={0.25} glow="none">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-zinc-400">Recent Documents</h3>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <Search size={12} className="text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-xs text-zinc-300 outline-none w-24 placeholder:text-zinc-600"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-transparent outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa" }}
                    >
                      <option value="all">All Types</option>
                      {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
                    ))}
                  </div>
                ) : recentDocuments.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <FolderOpen size={28} className="text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">No documents yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Upload your first financial document to get started</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentDocuments.map((doc) => {
                      const catConfig = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.OTHER;
                      const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PROCESSING;
                      const CatIcon = catConfig.icon;

                      return (
                        <motion.div
                          key={doc.id}
                          whileHover={{ background: "rgba(255,255,255,0.04)" }}
                          onClick={() => handleViewDocument(doc)}
                          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: catConfig.bg, border: `1px solid ${catConfig.color}22` }}
                          >
                            <CatIcon size={16} style={{ color: catConfig.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-200 truncate">{doc.fileName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-zinc-500">{formatFileSize(doc.fileSize)}</span>
                              <span className="text-[10px] text-zinc-600">·</span>
                              <span className="text-[10px] text-zinc-500">{formatDate(doc.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: `${statusConfig.color}15`, color: statusConfig.color }}
                            >
                              {statusConfig.label}
                            </span>
                            {doc.classification && (doc.classification as { confidence?: number }).confidence && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: `${getConfidenceColor((doc.classification as { confidence: number }).confidence)}12`,
                                  color: getConfidenceColor((doc.classification as { confidence: number }).confidence),
                                }}
                              >
                                {Math.round((doc.classification as { confidence: number }).confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right column - Detail or Insights */}
          <div className={`w-[380px] shrink-0 space-y-4 ${!selectedDetail ? "hidden lg:block" : ""}`}>
            <AnimatePresence mode="wait">
              {selectedDetail ? (
                <GlassCard key="detail" delay={0} glow="gold">
                  <div className="p-4">
                    <DocumentDetail
                      detail={selectedDetail}
                      onClose={() => setSelectedDetail(null)}
                      onDelete={() => handleDeleteDocument(selectedDetail.document.id)}
                    />
                  </div>
                </GlassCard>
              ) : (
                <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* AI Insights */}
                  <GlassCard delay={0.3} glow="green">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-emerald-400" />
                        <h3 className="text-xs font-medium text-emerald-300">AI Insights</h3>
                      </div>
                      {insights.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
                          >
                            <Brain size={20} className="text-emerald-500" />
                          </div>
                          <p className="text-xs text-zinc-400">Upload documents to unlock AI insights</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {insights.slice(0, 6).map((insight) => {
                            const severityConfig: Record<string, { color: string; bg: string }> = {
                              info: { color: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
                              success: { color: "#10b981", bg: "rgba(16,185,129,0.06)" },
                              warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.06)" },
                              critical: { color: "#ef4444", bg: "rgba(239,68,68,0.06)" },
                            };
                            const cfg = severityConfig[insight.severity] || severityConfig.info;
                            return (
                              <div
                                key={insight.id}
                                className="p-2.5 rounded-lg"
                                style={{ background: cfg.bg, border: `1px solid ${cfg.color}18` }}
                              >
                                <p className="text-[11px] text-zinc-300 leading-relaxed">{insight.content}</p>
                                <p className="text-[9px] text-zinc-600 mt-1">{formatDate(insight.createdAt)}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  {/* Document Categories */}
                  {stats && stats.byCategory.length > 0 && (
                    <GlassCard delay={0.35} glow="none">
                      <div className="p-4">
                        <h3 className="text-xs font-medium text-zinc-400 mb-3">Categories</h3>
                        <div className="space-y-1.5">
                          {stats.byCategory.map((cat) => {
                            const cfg = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.OTHER;
                            const CatIcon = cfg.icon;
                            return (
                              <div
                                key={cat.category}
                                className="flex items-center gap-2.5 p-2 rounded-lg"
                                style={{ background: "rgba(255,255,255,0.02)" }}
                              >
                                <CatIcon size={12} style={{ color: cfg.color }} />
                                <span className="text-xs text-zinc-300 flex-1">{cfg.label}</span>
                                <span className="text-[10px] font-medium text-zinc-400">{cat.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </GlassCard>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
