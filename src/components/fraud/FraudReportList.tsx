"use client";

import { useEffect, useState, useCallback } from "react";
import { History, Loader2, Shield } from "lucide-react";
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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fraud/reports");
      const json = await res.json();
      if (json.success) setReports(json.data);
    } catch {
      /* ignore */
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50">
          <History className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">Scan History</h3>
          <p className="text-xs text-zinc-500">{reports.length} past analyses</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Shield className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No scans yet. Analyze suspicious content above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const band = getBand(report.riskScore);
            return (
              <div
                key={report.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskBandColor(band)}`}
                  >
                    {band} · {report.riskScore}/100
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(report.createdAt)}</span>
                </div>
                <p className="mb-1 text-xs font-medium text-zinc-400">{report.threatCategory}</p>
                <p className="line-clamp-2 text-sm text-zinc-300">{report.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
