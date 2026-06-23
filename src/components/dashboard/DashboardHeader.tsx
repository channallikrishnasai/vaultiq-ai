"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Shield,
  Settings,
  X,
  Sun,
  Moon,
  Monitor,
  Globe,
  Coins,
  FlaskConical,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
} from "lucide-react";

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

type Theme = "dark" | "light" | "system";
type Language = "en" | "hi" | "kn" | "te" | "ta";
type Currency = "INR" | "USD" | "EUR";

const languages: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
];

const currencies: { code: Currency; label: string; symbol: string }[] = [
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
];

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [demoMode, setDemoMode] = useState(false);
  const router = useRouter();
  const { setTheme: setAppTheme } = useTheme();

  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  }

 async function loadDemoData() {
  const res = await fetch("/api/demo/load", {
    method: "POST",
  });

  const data = await res.json();

  if (data.success) {
    setDemoMode(true);
    window.location.reload();
  } else {
    console.error(data.error);
  }
}

async function clearDemoData() {
  const res = await fetch("/api/demo/clear", {
    method: "POST",
  });

  const data = await res.json();

  if (data.success) {
    setDemoMode(false);
    window.location.reload();
  } else {
    console.error(data.error);
  }
}

  return (
    <>
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10">
              <Shield className="h-5 w-5 text-teal-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-50">
              VaultIQ AI
            </span>
          </Link>

          {/* Right: Avatar + Settings */}
          <div className="flex items-center gap-3">
            {/* Settings Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/60 bg-zinc-900/50 text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800/50"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-800/60 bg-zinc-900/50">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold uppercase text-zinc-400">
                  {displayName.slice(0, 2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm transform border-l border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-50">Settings</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="h-[calc(100%-65px)] overflow-y-auto px-6 py-6">
          <div className="space-y-8">
                      {/* Appearance */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Sun className="h-3.5 w-3.5" />
                Appearance
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "dark", icon: Moon, label: "Dark" },
                  { value: "light", icon: Sun, label: "Light" },
                  { value: "system", icon: Monitor, label: "System" },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
  setTheme(t.value);
  setAppTheme(t.value);
}}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all ${
                      theme === t.value
                        ? "border-teal-500/40 bg-teal-500/10 text-teal-400"
                        : "border-zinc-800/60 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Language */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Globe className="h-3.5 w-3.5" />
                Language
              </h3>
              <div className="space-y-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 transition-all ${
                      language === lang.code
                        ? "border-teal-500/30 bg-teal-500/5 text-zinc-100"
                        : "border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{lang.label}</span>
                      <span className="text-xs text-zinc-600">{lang.native}</span>
                    </div>
                    {language === lang.code && (
                      <Check className="h-4 w-4 text-teal-400" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Currency */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Coins className="h-3.5 w-3.5" />
                Currency
              </h3>
              <div className="space-y-1">
                {currencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => setCurrency(curr.code)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 transition-all ${
                      currency === curr.code
                        ? "border-teal-500/30 bg-teal-500/5 text-zinc-100"
                        : "border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{curr.label}</span>
                      <span className="text-xs text-zinc-600">{curr.symbol}</span>
                    </div>
                    {currency === curr.code && (
                      <Check className="h-4 w-4 text-teal-400" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Demo Mode */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <FlaskConical className="h-3.5 w-3.5" />
                Demo Mode
              </h3>
              <div className="space-y-2">
                <button
                  onClick={loadDemoData}
                  disabled={demoMode}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300 transition-all hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-teal-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Load Demo Data</span>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </button>
                <button
                  onClick={clearDemoData}
                  disabled={!demoMode}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300 transition-all hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Clear Demo Data</span>
                  <Trash2 className="h-4 w-4 text-zinc-600" />
                </button>
              </div>
            </section>

            {/* Account */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <LogOut className="h-3.5 w-3.5" />
                Account
              </h3>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}