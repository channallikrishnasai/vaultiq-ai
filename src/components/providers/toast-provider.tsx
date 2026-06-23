"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        style: {
          background: "rgba(9, 9, 11, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#fafafa",
          backdropFilter: "blur(16px)",
          fontSize: "13px",
          borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        },
      }}
    />
  );
}