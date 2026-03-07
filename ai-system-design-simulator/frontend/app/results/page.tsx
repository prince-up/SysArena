const insights = [
  {
    label: "Scalability",
    value: "Strong",
    detail: "Balanced read/write strategy with caches and queues.",
  },
  {
    label: "Database Design",
    value: "Needs work",
    detail: "Consider sharding strategy and multi-region replication.",
  },
  {
    label: "Caching",
    value: "Solid",
    detail: "Good use of TTLs for hot conversations.",
  },
  {
    label: "Fault Tolerance",
    value: "Moderate",
    detail: "Add circuit breakers and graceful degradation paths.",
  },
];

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Results
          </p>
          <h1 className="font-display text-4xl text-white">
            Interview summary
          </h1>
          <p className="max-w-2xl text-slate-300">
            Here is a snapshot of your latest interview performance.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {insights.map((item) => (
            <article
              className="rounded-3xl border border-white/10 bg-[#101826] p-6 shadow-[0_20px_80px_-60px_rgba(59,91,255,0.6)]"
              key={item.label}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {item.label}
                </h2>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300">
                  {item.value}
                </span>
              </div>
              <p className="mt-3 text-slate-300">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0b1220] p-8 shadow-[0_20px_80px_-60px_rgba(255,107,74,0.6)]">
          <h2 className="text-xl font-semibold text-white">Next focus area</h2>
          <p className="mt-3 text-slate-300">
            Improve your data modeling answers by practicing partitioning and
            secondary indexing patterns.
          </p>
          <button className="mt-6 rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ff6b4a]/30">
            Start another interview
          </button>
        </section>
      </main>
    </div>
  );
}
