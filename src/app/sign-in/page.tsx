"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 glass rounded-xl p-8">
        <div>
          <h1 className="text-2xl font-bold ">Sign in to VaultIQ</h1>
          <p className="mt-1 text-sm text-lightgray">Your AI-powered finance platform</p>
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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gold bg-background/30 px-4 py-2 text-lightgray placeholder:text-lightgray focus:outline-none focus:ring-2 focus:ring-gold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold text-grey py-2 font-medium hover:bg-gold/80 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full rounded-xl border border-gold bg-background/30 text-lightgray py-2 hover:bg-background/50 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          Continue with Google
        </button>
        <p className="text-center text-sm text-zinc-400">
          No account?{" "}
          <Link href="/sign-up" className="text-white hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
