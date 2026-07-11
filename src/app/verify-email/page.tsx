"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

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

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] p-4">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">
            <ShieldIcon />
          </div>
          <h1 className="text-2xl font-bold text-white">Email Verified</h1>
          <p className="text-zinc-400">
            Your email has been verified. You can now sign in to your account.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-lg bg-[#D4AF37] px-6 py-2 font-medium text-[#18181b] hover:bg-[#D4AF37]/80"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const errorMessage =
    error === "missing_token"
      ? "No verification token provided."
      : error === "invalid_token"
        ? "Invalid verification token."
        : error === "token_expired"
          ? "Verification link has expired. Please sign up again."
          : "Something went wrong.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08080c] p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <span className="text-3xl text-red-400">&#10007;</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
        <p className="text-zinc-400">{errorMessage}</p>
        <Link
          href="/sign-up"
          className="inline-block rounded-lg bg-[#D4AF37] px-6 py-2 font-medium text-[#18181b] hover:bg-[#D4AF37]/80"
        >
          Back to Sign Up
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
