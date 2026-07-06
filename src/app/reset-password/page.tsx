"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 glass rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="text-lightgray">
            No reset token provided. Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block rounded-xl bg-gold text-grey px-6 py-2 font-medium hover:bg-gold/80"
          >
            Forgot Password
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error?.message ?? "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 glass rounded-xl p-8 text-center">
          <div className="text-4xl">&#10003;</div>
          <h1 className="text-2xl font-bold">Password Reset</h1>
          <p className="text-lightgray">
            Your password has been reset successfully. You can now sign in with
            your new password.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-xl bg-gold text-grey px-6 py-2 font-medium hover:bg-gold/80"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 glass rounded-xl p-8">
        <div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="mt-1 text-sm text-lightgray">
            Enter your new password below.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-gold bg-background/30 px-4 py-2 text-lightgray placeholder:text-lightgray focus:outline-none focus:ring-2 focus:ring-gold"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-gold bg-background/30 px-4 py-2 text-lightgray placeholder:text-lightgray focus:outline-none focus:ring-2 focus:ring-gold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold text-grey py-2 font-medium hover:bg-gold/80 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-400">
          Remember your password?{" "}
          <Link href="/sign-in" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-lightgray">Loading...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
