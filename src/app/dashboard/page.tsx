import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">VaultIQ Dashboard</h1>
          <p className="text-sm text-zinc-400">{session.user.email}</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-6 text-zinc-400">
          Welcome back, {session.user.name ?? "User"}. Your backend APIs are ready.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/api/dashboard/stats", label: "Dashboard Stats" },
            { href: "/api/chat", label: "AI Chat" },
            { href: "/api/fraud/reports", label: "Fraud Reports" },
            { href: "/api/expenses", label: "Expenses" },
            { href: "/api/finance/health-score", label: "Health Score" },
            { href: "/api/learning/courses", label: "Courses" },
            { href: "/api/trading/portfolio", label: "Trading Portfolio" },
            { href: "/api/financial-twin", label: "Financial Twin" },
            { href: "/api/roadmap", label: "Roadmaps" },
          ].map((item) => (
            <div
              key={item.href}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            >
              <p className="font-medium">{item.label}</p>
              <code className="mt-1 block text-xs text-zinc-500">{item.href}</code>
            </div>
          ))}
        </div>
        <form action="/api/auth/signout" method="POST" className="mt-8">
          <Link
            href="/api/auth/signout"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Sign out
          </Link>
        </form>
      </main>
    </div>
  );
}
