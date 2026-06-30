"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { History, Loader2, Shield, ShieldAlert } from "lucide-react";
import { formatDate } from "@/utils/format";
import { getRiskBandColor } from "@/lib/fraud-utils";

interface FraudReport {
  id: string;
  inputType: string;
  content: string;
  riskScore: number;
  threatCategory: string;
  explanation: string;
  createdAt: string;
}

interface FraudReportListProps {
  refreshKey?: number;
}

export function FraudReportList({ refreshKey = 0 }: FraudReportListProps) {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fraud/reports");
      if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data ?? []);
      } else {
        throw new Error(json.error?.message || "Failed to load reports");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshKey]);

  const getBand = (score: number): "Safe" | "Medium" | "High" => {
    if (score <= 30) return "Safe";
    if (score <= 60) return "Medium";
    return "High";
  };

  const getTitle = (report: FraudReport): string => {
    const cat = report.threatCategory;
    if (cat.includes("Lottery")) return "Lottery scam SMS";
    if (cat.includes("KYC")) return "KYC update phishing link";
    if (cat.includes("Phishing") && report.inputType === "PHONE") return "Fake bank call / refund scam";
    if (cat.includes("Payment")) return "UPI payment request scam";
    if (cat.includes("Credential")) return "Unknown number asking OTP";
    return cat;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/50 py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50">
          <History className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">Scan History</h3>
          <p className="text-xs text-zinc-500">{reports.length} past analyses</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
          <p className="text-sm text-rose-400">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-2 text-xs text-teal-400 hover:text-teal-300"
          >
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-800 py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/50">
            <Shield className="h-7 w-7 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No scans yet</p>
          <p className="mt-1 max-w-[200px] text-xs text-zinc-600">
            Analyze suspicious content or load demo data from Settings to see sample history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, i) => {
            const band = getBand(report.riskScore);
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/50"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {band === "High" && <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />}
                    <span className="text-sm font-medium text-zinc-200">{getTitle(report)}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(report.createdAt)}</span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskBandColor(band)}`}
                  >
                    {band} Risk · {report.riskScore}/100
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-zinc-500">{report.content}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
