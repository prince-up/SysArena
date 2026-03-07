import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f1a] text-slate-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,91,255,0.4),transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-24 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,107,74,0.4),transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.8),transparent_45%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-14 px-6 py-20">
        <header className="flex flex-col gap-8 animate-fade-up">
          <span className="w-fit rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">
            MVP build
          </span>
          <h1 className="font-display text-4xl leading-tight sm:text-6xl">
            System design interviews built for real hiring loops.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Practice with an AI interviewer, get instant feedback, and track your
            progress. Clean prompts, real follow-ups, and a workflow that feels
            like the real thing.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              className="rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff6b4a]/30"
              href="/dashboard"
            >
              Start practicing
            </Link>
            <Link
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
              href="/login"
            >
              Login
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "AI-led interview flow",
              text: "Step-by-step questions that feel like a real onsite loop.",
            },
            {
              title: "Instant feedback",
              text: "Quick guidance on scalability, data modeling, and caching.",
            },
            {
              title: "Results snapshot",
              text: "Track strengths, weak spots, and focus areas per session.",
            },
          ].map((item) => (
            <div
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-40px_rgba(59,91,255,0.6)]"
              key={item.title}
            >
              <h2 className="text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-300">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="font-display text-2xl text-white">
              Turn prep into confident system design answers.
            </h3>
            <p className="mt-3 text-slate-300">
              Use targeted prompts, structured follow-ups, and feedback that
              tells you exactly what to improve.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span className="rounded-full border border-white/15 px-4 py-2">
                5 core prompts
              </span>
              <span className="rounded-full border border-white/15 px-4 py-2">
                Live chat feedback
              </span>
              <span className="rounded-full border border-white/15 px-4 py-2">
                Session history
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#101826] via-[#0f172a] to-[#141a2d] p-8 shadow-[0_20px_80px_-45px_rgba(255,107,74,0.6)]">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Sample results
            </p>
            <h3 className="mt-4 font-display text-3xl text-white">
              Score clarity, not fluff.
            </h3>
            <p className="mt-3 text-slate-300">
              See what you nailed and exactly where to tighten your design.
            </p>
            <Link
              className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white"
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
