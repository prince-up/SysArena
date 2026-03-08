"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type SessionSummary = {
  session_id: string;
  question_title?: string | null;
  created_at: string;
};

type ScoreDetail = {
  score: number;
  notes: string;
};

type ScoreMap = Record<string, ScoreDetail>;

type CompareResponse = {
  diff: string;
};

export default function ResultsClient() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [compareLeft, setCompareLeft] = useState<string | null>(null);
  const [compareRight, setCompareRight] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreMap | null>(null);
  const [diff, setDiff] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userId = session?.user?.id ? Number(session.user.id) : null;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/interview/sessions?user_id=${userId}`);
        if (!response.ok) {
          throw new Error("Unable to load sessions");
        }
        const data = (await response.json()) as SessionSummary[];
        setSessions(data);
        if (data.length) {
          setSelected(data[0].session_id);
          setCompareLeft(data[0].session_id);
          setCompareRight(data.length > 1 ? data[1].session_id : data[0].session_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load sessions");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSessions();
  }, [userId]);

  useEffect(() => {
    if (!selected) {
      setScores(null);
      return;
    }

    const loadScores = async () => {
      try {
        const response = await fetch(`/api/interview/sessions/${selected}/scores`);
        if (!response.ok) {
          throw new Error("Unable to load scores");
        }
        const data = (await response.json()) as ScoreMap;
        setScores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load scores");
      }
    };

    void loadScores();
  }, [selected]);

  const sessionOptions = useMemo(() => {
    return sessions.map((item) => ({
      value: item.session_id,
      label: `${item.question_title ?? "Interview"} • ${new Date(
        item.created_at
      ).toLocaleString()}`,
    }));
  }, [sessions]);

  const handleCompare = async () => {
    if (!compareLeft || !compareRight) {
      return;
    }
    setError(null);
    try {
      const response = await fetch("/api/interview/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          left_session_id: compareLeft,
          right_session_id: compareRight,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to compare sessions");
      }
      const data = (await response.json()) as CompareResponse;
      setDiff(data.diff || "No differences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to compare sessions");
    }
  };

  const handleExport = (format: "md" | "pdf") => {
    if (!selected) {
      return;
    }
    window.location.href = `/api/interview/export/${selected}?format=${format}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Results
          </p>
          <h1 className="font-display text-4xl text-white">Interview summary</h1>
          <p className="max-w-2xl text-slate-300">
            Review your latest sessions, compare attempts, and export summaries.
          </p>
        </header>

        {isLoading ? <p className="text-slate-400">Loading...</p> : null}
        {error ? <p className="text-rose-300">{error}</p> : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-[#101826] p-6 shadow-[0_20px_80px_-60px_rgba(59,91,255,0.6)]">
            <h2 className="text-lg font-semibold text-white">Session scores</h2>
            <div className="mt-4 space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Select session
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                value={selected ?? ""}
                onChange={(event) => setSelected(event.target.value)}
              >
                {sessionOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 grid gap-4">
              {scores && Object.keys(scores).length ? (
                Object.entries(scores).map(([key, detail]) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    key={key}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {key.replace("_", " ")}
                      </p>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300">
                        {detail.score}/5
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{detail.notes}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No scores yet.</p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ff6b4a]/30"
                type="button"
                onClick={() => handleExport("md")}
              >
                Export Markdown
              </button>
              <button
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white"
                type="button"
                onClick={() => handleExport("pdf")}
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0b1220] p-6 shadow-[0_20px_80px_-60px_rgba(255,107,74,0.6)]">
            <h2 className="text-lg font-semibold text-white">Compare attempts</h2>
            <div className="mt-4 grid gap-3">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                First session
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                value={compareLeft ?? ""}
                onChange={(event) => setCompareLeft(event.target.value)}
              >
                {sessionOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Second session
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                value={compareRight ?? ""}
                onChange={(event) => setCompareRight(event.target.value)}
              >
                {sessionOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                className="mt-2 rounded-full bg-gradient-to-r from-[#3b5bff] to-[#5d7bff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#3b5bff]/30"
                type="button"
                onClick={handleCompare}
              >
                Compare
              </button>
            </div>
            <div className="mt-6 max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs text-slate-300">
              <pre className="whitespace-pre-wrap">
                {diff ?? "Run a comparison to see changes."}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
