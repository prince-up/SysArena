import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,#e2e8f0)] text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-6">
          <span className="w-fit rounded-full border border-slate-300 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            MVP build
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            System design interviews that feel real.
          </h1>
          <p className="max-w-2xl text-lg text-slate-700">
            Practice with an AI interviewer, get instant feedback, and track your
            progress over time. This is the first working version with login,
            interview chat, and results.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Start an interview</h2>
            <p className="mt-3 text-slate-600">
              Choose a system design prompt and walk through the interview flow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
                href="/dashboard"
              >
                Go to dashboard
              </Link>
              <Link
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700"
                href="/login"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm">
            <h2 className="text-xl font-semibold">What you get</h2>
            <ul className="mt-4 space-y-3 text-slate-600">
              <li>AI-led questions, step by step.</li>
              <li>Instant feedback on architecture decisions.</li>
              <li>Results summary with strengths and gaps.</li>
            </ul>
            <Link
              className="mt-6 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm"
              href="/results"
            >
              View sample results
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
