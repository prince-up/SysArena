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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-14">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Results
          </p>
          <h1 className="text-4xl font-semibold">Interview summary</h1>
          <p className="max-w-2xl text-slate-600">
            Here is a snapshot of your latest interview performance.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {insights.map((item) => (
            <article
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              key={item.label}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{item.label}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {item.value}
                </span>
              </div>
              <p className="mt-3 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Next focus area</h2>
          <p className="mt-3 text-slate-600">
            Improve your data modeling answers by practicing partitioning and
            secondary indexing patterns.
          </p>
          <button className="mt-6 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Start another interview
          </button>
        </section>
      </main>
    </div>
  );
}
