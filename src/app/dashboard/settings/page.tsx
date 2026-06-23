export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-white">
          Settings
        </h1>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Appearance
          </h2>

          <div className="space-y-3">
            <button className="rounded-lg bg-zinc-800 px-4 py-2 text-white">
              Dark Mode
            </button>

            <button className="rounded-lg bg-zinc-800 px-4 py-2 text-white">
              Light Mode
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}