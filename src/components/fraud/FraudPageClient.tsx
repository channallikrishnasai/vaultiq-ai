"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { FraudAnalyzer } from "@/components/fraud/FraudAnalyzer";
import { FraudReportList } from "@/components/fraud/FraudReportList";

interface FraudPageClientProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function FraudPageClient({ user }: FraudPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <DashboardHeader user={user} visible={true} />

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
              <Shield className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-50">Fraud Shield</h1>
              <p className="text-sm text-zinc-500">
                AI-powered scam detection for SMS, links, and phishing attempts
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FraudAnalyzer onAnalyzed={() => setRefreshKey((k) => k + 1)} />
          </div>
          <div className="lg:col-span-2">
            <FraudReportList refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </main>
  );
}
