"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ──────────────────────────────────────────────────────────────────────────────
   Verification page — works in both dev and production.
   Token is fetched from the dev-verification API endpoint.
   ────────────────────────────────────────────────────────────────────────────── */

/* ── SVG Icons ──────────────────────────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L3 6.5v5.5c0 5.3 3.8 10.2 9 11.5 5.2-1.3 9-6.2 9-11.5V6.5L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 11V3.5C3 3.224 3.224 3 3.5 3H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        stroke="url(#goldGrad)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.path
        d="M20 32l8 8 16-16"
        stroke="url(#goldGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F5D060" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DevBoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M11 1L3 11h6l-1 8 8-10h-6l1-8z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

function DevVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [tokenVisible, setTokenVisible] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Fetch token from dev-only endpoint
  const fetchToken = useCallback(async () => {
    if (!emailParam) {
      setError("No email provided");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/dev-verification?email=${encodeURIComponent(emailParam)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load verification data");
        setLoading(false);
        return;
      }

      setToken(data.token);
      setVerificationUrl(data.verificationUrl);
    } catch {
      setError("Failed to load verification data");
    } finally {
      setLoading(false);
    }
  }, [emailParam]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Copy URL to clipboard
  async function handleCopyUrl() {
    await navigator.clipboard.writeText(verificationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  // Copy token to clipboard
  async function handleCopyToken() {
    await navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  // Verify email using the REAL production endpoint
  async function handleVerify() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/auth/verify-email?token=${token}`);
      if (res.redirected || res.ok) {
        setVerified(true);
      } else {
        setError("Verification failed. The token may be invalid or expired.");
        setVerifying(false);
      }
    } catch {
      setError("Verification failed. Please try again.");
      setVerifying(false);
    }
  }

  // Auto-redirect after successful verification
  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verified, router]);

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
          <p className="text-zinc-400 text-sm">Loading verification data...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────

  if (error && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] p-4">
        <div className="w-full max-w-lg space-y-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
            <span className="text-3xl text-red-400">&#10007;</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Verification Unavailable</h1>
            <p className="text-zinc-400">{error}</p>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-2.5 font-medium text-[#18181b] hover:bg-[#D4AF37]/80 transition-colors"
          >
            <ArrowLeftIcon />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Verified Success State ───────────────────────────────────────────────

  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-8 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-b from-[#D4AF37]/5 to-transparent p-10 text-center"
        >
          <div className="mx-auto">
            <CheckIcon />
          </div>
          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-[#D4AF37]"
            >
              Email Verified Successfully
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-zinc-400 text-lg"
            >
              Your account is now verified and ready to use.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-sm text-[#D4AF37]/60"
          >
            <SpinnerIcon />
            <span>Redirecting to Sign In...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Main Dev Verification Page ───────────────────────────────────────────

  const maskedToken = tokenVisible ? token : `${token.slice(0, 8)}${"•".repeat(48)}${token.slice(-8)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08080c] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Header Banner */}
        <div className="rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-b from-[#D4AF37]/5 to-transparent p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[#D4AF37] mb-3">
            <DevBoltIcon />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">
              Development Mode
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Development Verification
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Email delivery is disabled in development.
            <br />
            Use the generated verification token below.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">
              <ShieldIcon />
            </div>
          </div>

          {/* Registered Email */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
              Registered Email
            </label>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 px-4 py-3">
              <span className="text-sm text-white font-mono">{emailParam}</span>
            </div>
          </div>

          {/* Verification URL */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
              Verification URL
            </label>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 px-4 py-3">
              <span className="text-xs text-zinc-300 font-mono break-all leading-relaxed">
                {verificationUrl}
              </span>
            </div>
          </div>

          {/* Verification Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
                Verification Token
              </label>
              <button
                onClick={() => setTokenVisible(!tokenVisible)}
                className="flex items-center gap-1.5 text-[11px] text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
              >
                {tokenVisible ? <EyeOffIcon /> : <EyeIcon />}
                {tokenVisible ? "Hide" : "Show"}
              </button>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 px-4 py-3">
              <span className="text-xs text-zinc-300 font-mono break-all leading-relaxed">
                {maskedToken}
              </span>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && token && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary: Verify Email */}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full rounded-xl bg-[#D4AF37] py-3.5 font-semibold text-sm text-[#18181b] tracking-wide hover:bg-[#D4AF37]/80 disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  Verifying...
                </span>
              ) : (
                "Verify Email"
              )}
            </button>

            {/* Secondary: Copy URL + Copy Token */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyUrl}
                className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CopyIcon />
                {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
              <button
                onClick={handleCopyToken}
                className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CopyIcon />
                {copiedToken ? "Copied!" : "Copy Token"}
              </button>
            </div>

            {/* Back to Sign In */}
            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
            >
              <ArrowLeftIcon />
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DevVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08080c]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
            <p className="text-zinc-400 text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <DevVerifyContent />
    </Suspense>
  );
}
