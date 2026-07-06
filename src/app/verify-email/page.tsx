"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState, useCallback } from "react";

/* ──────────────────────────────────────────────────────────────────────────────
   Production safety: Dev mode is ONLY active when the URL contains ?dev=true
   AND the environment is not production. This guard is enforced both here
   (client-side rendering) and in the API routes (server-side).
   ────────────────────────────────────────────────────────────────────────────── */

function isDevEnvironment() {
  if (typeof window === "undefined") return false;
  // In Next.js, __NEXT_DATA__ is available on the client
  // We also check the build manifest to be safe
  try {
    const nextData = (window as any).__NEXT_DATA__;
    if (nextData?.buildId === "development") return true;
  } catch {
    // ignore
  }
  // Fallback: dev mode is only truly safe in development builds
  return process.env.NODE_ENV !== "production";
}

function getVerificationUrl(token: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/verify-email?token=${token}`;
}

/* ── SVG Icons ──────────────────────────────────────────────────────────────── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
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
      <rect
        x="5"
        y="5"
        width="8"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3 11V3.5C3 3.224 3.224 3 3.5 3H11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3H3.5A1.5 1.5 0 002 4.5v8A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5V10M9 2h5M12 2v5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2.5 8a5.5 5.5 0 019.768-3.427M13.5 8a5.5 5.5 0 01-9.768 3.427"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M12.5 1.5v3h-3M3.5 14.5v-3h3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="30" stroke="url(#goldGrad)" strokeWidth="2" />
      <path
        d="M20 32l8 8 16-16"
        stroke="url(#goldGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="checkmark-path"
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

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2L3 5.5v4.5c0 4.418 2.987 8.524 7 9.5 4.013-.976 7-5.082 7-9.5V5.5L10 2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

/* ── Main Component ─────────────────────────────────────────────────────────── */

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const dev = searchParams.get("dev");
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [verifying, setVerifying] = useState(false);
  const [devResult, setDevResult] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "unknown" | "pending" | "verified"
  >("pending");

  const isDevMode = dev === "true" && token && isDevEnvironment();
  const verificationUrl = token ? getVerificationUrl(token) : "";

  // Check verification status on mount and after actions
  const checkStatus = useCallback(async () => {
    if (!emailParam) return;
    try {
      const res = await fetch("/api/auth/email-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam }),
      });
      const data = await res.json();
      setVerificationStatus(data.verified ? "verified" : "pending");
    } catch {
      setVerificationStatus("unknown");
    }
  }, [emailParam]);

  useEffect(() => {
    if (isDevMode) {
      checkStatus();
    }
  }, [isDevMode, checkStatus]);

  // Auto-redirect after successful verification
  useEffect(() => {
    if (devResult === "success") {
      const timer = setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [devResult, router]);

  async function handleDevVerify() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/auth/verify-email?token=${token}`);
      if (res.redirected || res.ok) {
        setDevResult("success");
        setVerificationStatus("verified");
      } else {
        setDevResult("error");
      }
    } catch {
      setDevResult("error");
    } finally {
      setVerifying(false);
    }
  }

  async function handleCopyLink() {
    if (!verificationUrl) return;
    await navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenLink() {
    if (verificationUrl) {
      window.open(verificationUrl, "_blank");
    }
  }

  async function handleResend() {
    if (!emailParam) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam }),
      });
      const data = await res.json();
      if (data.success) {
        setResent(true);
        // If dev mode returned a new token, update the URL
        if (data.data?.devMode && data.data?.token) {
          const newUrl = `/verify-email?dev=true&token=${data.data.token}&email=${encodeURIComponent(emailParam)}`;
          window.history.replaceState({}, "", newUrl);
          // Force re-render with new token
          window.location.reload();
          return;
        }
        setTimeout(() => setResent(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setResending(false);
    }
  }

  /* ── Dev Mode: Success Animation ────────────────────────────────────────── */

  if (isDevMode && devResult === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="dev-success-container w-full max-w-lg space-y-8 glass-gold rounded-2xl p-10 text-center">
          <div className="success-checkmark mx-auto">
            <CheckCircleIcon />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gold text-glow-gold">
              Email Verified Successfully
            </h1>
            <p className="text-lightgray text-lg">
              Your account is now verified and ready to use.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gold/60">
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.3"
              />
              <path
                d="M7 1.5a5.5 5.5 0 015.5 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>Redirecting to Sign In...</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Dev Mode: Error State ─────────────────────────────────────────────── */

  if (isDevMode && devResult === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-8 glass rounded-2xl p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
            <span className="text-3xl text-red-400">&#10007;</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-lightgray">
              Something went wrong. The token may be invalid or expired.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDevVerify}
              className="rounded-xl bg-gold text-grey px-6 py-3 font-medium hover:bg-gold/80 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/sign-up"
              className="text-sm text-lightgray hover:text-gold transition-colors"
            >
              Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Dev Mode: Main Developer Panel ─────────────────────────────────────── */

  if (isDevMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="dev-main-container w-full max-w-lg space-y-6">
          {/* Premium Developer Banner */}
          <div className="glass-gold rounded-2xl p-6 text-center space-y-3 dev-banner-glow">
            <div className="flex items-center justify-center gap-2 text-gold">
              <DevBoltIcon />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase">
                Development Mode
              </span>
            </div>
            <p className="text-lightgray text-sm leading-relaxed">
              Email delivery is disabled. This simulates the production
              verification flow.
            </p>
          </div>

          {/* Main Verification Card */}
          <div className="glass rounded-2xl p-8 space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 border border-gold/20">
                <ShieldIcon />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Verify Your Email
              </h1>
              <p className="text-lightgray text-sm">
                {emailParam
                  ? `Verification for ${emailParam}`
                  : "Complete your email verification"}
              </p>
            </div>

            {/* Collapsible Developer Info Panel */}
            <div className="rounded-xl border border-gold/15 bg-background/40 overflow-hidden">
              <button
                onClick={() => setPanelOpen(!panelOpen)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gold/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M2 4l4 4-4 4M8 4l4 4-4 4"
                        stroke="#D4AF37"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gold">
                    Developer Information
                  </span>
                </div>
                <ChevronIcon open={panelOpen} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  panelOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-4 px-5 pb-5 border-t border-gold/10 pt-4">
                  {/* Registered Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-wider uppercase text-gold/60">
                      Registered Email
                    </label>
                    <div className="rounded-lg border border-gold/10 bg-background/50 px-4 py-2.5">
                      <span className="text-sm text-lightgray font-mono">
                        {emailParam || "Not provided"}
                      </span>
                    </div>
                  </div>

                  {/* Verification Token */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-wider uppercase text-gold/60">
                      Verification Token
                    </label>
                    <div className="rounded-lg border border-gold/10 bg-background/50 px-4 py-2.5">
                      <span className="text-xs text-lightgray font-mono break-all leading-relaxed">
                        {token}
                      </span>
                    </div>
                  </div>

                  {/* Verification URL */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-wider uppercase text-gold/60">
                      Verification URL
                    </label>
                    <div className="rounded-lg border border-gold/10 bg-background/50 px-4 py-2.5">
                      <span className="text-xs text-lightgray font-mono break-all leading-relaxed">
                        {verificationUrl}
                      </span>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-wider uppercase text-gold/60">
                      Verification Status
                    </label>
                    <div className="rounded-lg border border-gold/10 bg-background/50 px-4 py-2.5 flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          verificationStatus === "verified"
                            ? "bg-emerald-400"
                            : verificationStatus === "pending"
                              ? "bg-yellow-400"
                              : "bg-zinc-500"
                        }`}
                      />
                      <span className="text-sm text-lightgray capitalize">
                        {verificationStatus === "verified"
                          ? "Verified"
                          : verificationStatus === "pending"
                            ? "Pending Verification"
                            : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary: Verify Email Now */}
              <button
                onClick={handleDevVerify}
                disabled={verifying}
                className="w-full rounded-xl bg-gold text-grey py-3.5 font-semibold text-sm tracking-wide hover:bg-gold/80 disabled:opacity-50 transition-all duration-200 active:scale-[0.98] btn-premium-glow"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        opacity="0.3"
                      />
                      <path
                        d="M8 2a6 6 0 016 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify Email Now"
                )}
              </button>

              {/* Secondary Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopyLink}
                  className="rounded-xl border border-gold/20 bg-background/40 text-lightgray px-4 py-3 text-sm font-medium hover:bg-gold/5 hover:border-gold/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <CopyIcon />
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                <button
                  onClick={handleOpenLink}
                  className="rounded-xl border border-gold/20 bg-background/40 text-lightgray px-4 py-3 text-sm font-medium hover:bg-gold/5 hover:border-gold/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ExternalLinkIcon />
                  Open Link
                </button>
              </div>

              {/* Resend Verification */}
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full rounded-xl border border-gold/20 bg-background/40 text-lightgray px-4 py-3 text-sm font-medium hover:bg-gold/5 hover:border-gold/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ResendIcon />
                {resending
                  ? "Sending..."
                  : resent
                    ? "Verification Resent!"
                    : "Resend Verification"}
              </button>

              {/* Back to Sign Up */}
              <Link
                href="/sign-up"
                className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm text-lightgray/60 hover:text-lightgray transition-colors duration-200"
              >
                <ArrowLeftIcon />
                Back to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Production: Success State ───────────────────────────────────────────── */

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 glass rounded-xl p-8 text-center">
          <div className="text-4xl text-gold">&#10003;</div>
          <h1 className="text-2xl font-bold">Email Verified</h1>
          <p className="text-lightgray">
            Your email has been verified. You can now sign in to your account.
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

  /* ── Production: Error State ─────────────────────────────────────────────── */

  const errorMessage =
    error === "missing_token"
      ? "No verification token provided."
      : error === "invalid_token"
        ? "Invalid verification token."
        : error === "token_expired"
          ? "Verification link has expired. Please sign up again."
          : "Something went wrong.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 glass rounded-xl p-8 text-center">
        <div className="text-4xl text-red-400">&#10007;</div>
        <h1 className="text-2xl font-bold">Verification Failed</h1>
        <p className="text-lightgray">{errorMessage}</p>
        <Link
          href="/sign-in"
          className="inline-block rounded-xl bg-gold text-grey px-6 py-2 font-medium hover:bg-gold/80"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <p className="text-lightgray text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
