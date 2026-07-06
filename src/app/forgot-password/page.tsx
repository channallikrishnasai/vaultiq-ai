"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error?.message ?? "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 glass rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-lightgray">
            If an account with that email exists, we&apos;ve sent a password reset
            link. Please check your inbox.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-xl bg-gold text-grey px-6 py-2 font-medium hover:bg-gold/80"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 glass rounded-xl p-8">
        <div>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="mt-1 text-sm text-lightgray">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gold bg-background/30 px-4 py-2 text-lightgray placeholder:text-lightgray focus:outline-none focus:ring-2 focus:ring-gold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold text-grey py-2 font-medium hover:bg-gold/80 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
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
