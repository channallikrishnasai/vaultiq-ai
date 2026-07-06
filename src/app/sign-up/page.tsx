"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!data.success) {
      setError(data.error?.message ?? "Registration failed");
      setLoading(false);
      return;
    }

    setLoading(false);

    // In dev mode, redirect to verify-email with the token so the user can
    // complete verification without relying on email delivery.
    if (data.data?.devMode && data.data?.token) {
      router.push(
        `/verify-email?dev=true&token=${encodeURIComponent(data.data.token)}&email=${encodeURIComponent(data.data.email)}`,
      );
      return;
    }

    setRegistered(true);
  }

  if (registered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <div className="text-4xl">&#9993;</div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-zinc-400">
            We sent a verification link to <span className="text-white">{email}</span>.
            Please verify your email before signing in.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-lg bg-white px-6 py-2 font-medium text-zinc-900 hover:bg-zinc-200"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-zinc-400">Join VaultIQ AI today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder:text-zinc-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder:text-zinc-500"
            required
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder:text-zinc-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2 font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
