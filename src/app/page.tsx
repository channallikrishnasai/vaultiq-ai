import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">VaultIQ AI</h1>
        <p className="mt-4 max-w-lg text-zinc-400">
          Your intelligent financial companion for budgeting, fraud protection, investing, and more.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
