"use client";
import React from "react";
import ThemeProvider from "@/components/providers/ThemeProvider";
import QueryProvider from "@/components/providers/query-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import LearningProgressProvider from "@/components/providers/learning-progress-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import GlobalAIChat from "@/components/dashboard/GlobalAIChat";
import ApiKeysWidget from "@/components/dashboard/ApiKeysWidget";
import LeftNav from "@/components/dashboard/LeftNav";
import type { Session } from "next-auth";

export default function AppProviders({ children, session }: { children: React.ReactNode, session: Session | null }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthSessionProvider session={session}>
          <LearningProgressProvider>
            {/* Sidebar */}
            <LeftNav />
            {/* Main content */}
            <main className="flex-1 h-full overflow-x-hidden overflow-y-auto">
              {children}
            </main>
            {/* Global widgets */}
            <GlobalAIChat />
            <ApiKeysWidget />
            <ToastProvider />
          </LearningProgressProvider>
        </AuthSessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
