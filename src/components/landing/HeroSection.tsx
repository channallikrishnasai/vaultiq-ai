import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-zinc-950">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Eyebrow */}
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
          AI-Powered Financial Intelligence
        </p>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl">
          One App.{" "}
          <span className="bg-teal-400 bg-clip-text text-transparent">
            100
          </span>{" "}
          Financial Solutions
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Your intelligent financial companion for budgeting, investing, fraud
          protection, and financial growth.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="group flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-sm font-semibold text-zinc-950 transition-all hover:bg-teal-400"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-zinc-700 px-8 py-4 text-sm font-semibold text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-900"
          >
            Sign In
          </Link>
        </div>

        {/* Trust indicator */}
        <p className="mt-8 text-sm text-zinc-500">
          Trusted by 2.3M+ users across India
        </p>
      </div>
    </section>
  );
}