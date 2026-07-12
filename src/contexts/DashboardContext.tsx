"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { DashboardData } from "@/types/dashboard";

interface DashboardContextValue {
  data: DashboardData;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshDashboard: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: DashboardData;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useDashboardData(initialData);

  const refreshDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  return (
    <DashboardContext.Provider
      value={{
        data: data ?? initialData,
        isLoading,
        isRefreshing: isFetching && !isLoading,
        refreshDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardContext must be used within DashboardProvider");
  return ctx;
}
