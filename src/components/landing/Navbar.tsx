"use client";

import Link from "next/link";
import { useState } from "react";
import { navLinks } from "@/lib/landing-data";
import { Menu, X, Shield } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800/60 bg-zinc-950/80 px-5 py-3 backdrop-blur-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20">
              <Shield className="h-4 w-4 text-teal-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-50">
              VaultIQ AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-teal-400"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mt-2 rounded-2xl border border-zinc-800/60 bg-zinc-950/95 p-5 backdrop-blur-md md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-base font-medium text-zinc-400 transition-colors hover:text-zinc-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-zinc-800" />
              <Link
                href="/sign-in"
                className="text-base font-medium text-zinc-400 transition-colors hover:text-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-xl bg-teal-500 px-5 py-3 text-center text-sm font-semibold text-zinc-950 transition-all hover:bg-teal-400"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}