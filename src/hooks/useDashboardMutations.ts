"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

export function useDashboardMutations() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  const addExpense = useCallback(
    async (payload: { amount: number; category: string; notes?: string; date: string }) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to add expense");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const editExpense = useCallback(
    async (id: string, payload: { amount: number; category: string; notes?: string; date?: string }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update expense");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to delete expense");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const addIncome = useCallback(
    async (payload: { amount: number; category: string; notes?: string; date: string }) => {
      const res = await fetch("/api/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to add income");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const editIncome = useCallback(
    async (id: string, payload: { amount: number; category: string; notes?: string; date?: string }) => {
      const res = await fetch(`/api/incomes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update income");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to delete income");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const addGoal = useCallback(
    async (payload: { name: string; targetAmount: number; currentAmount: number; type: string; deadline?: string | null }) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to add goal");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const editGoal = useCallback(
    async (id: string, payload: { name: string; targetAmount: number; currentAmount: number; type: string; deadline?: string | null }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to update goal");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to delete goal");
      invalidate();
      return json.data;
    },
    [invalidate],
  );

  return {
    invalidate,
    addExpense,
    editExpense,
    deleteExpense,
    addIncome,
    editIncome,
    deleteIncome,
    addGoal,
    editGoal,
    deleteGoal,
  };
}
