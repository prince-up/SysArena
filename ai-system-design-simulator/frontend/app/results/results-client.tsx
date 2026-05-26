"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Activity, Target, GitCompare, Download, FileText, Medal } from "lucide-react";

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

  const scoreEntries = useMemo(() => {
    return scores ? Object.entries(scores) : [];
  }, [scores]);

  const averageScore = useMemo(() => {
    if (!scoreEntries.length) {
      return 0;
    }
    const total = scoreEntries.reduce((sum, [, detail]) => sum + detail.score, 0);
    return Math.round((total / scoreEntries.length) * 10) / 10;
  }, [scoreEntries]);

  const topCategory = useMemo(() => {
    if (!scoreEntries.length) {
      return "-";
    }
    const best = [...scoreEntries].sort((a, b) => b[1].score - a[1].score)[0];
    return best[0].replace("_", " ");
  }, [scoreEntries]);

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
    <div className="min-h-screen text-slate-100 bg-transparent">
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 text-[#ff6b4a]">
            <BarChart3 className="w-6 h-6" />
            <p className="text-xs uppercase tracking-[0.4em] font-bold">
              Results & Analytics
            </p>
          </div>
          <h1 className="font-display text-5xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Interview summary
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Review your latest sessions, compare attempts, and export summaries.
          </p>
        </motion.header>

        {isLoading ? <p className="text-slate-400">Loading...</p> : null}
        {error ? <p className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">{error}</p> : null}

        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b5bff]">
                Average score
              </p>
              <Activity className="w-5 h-5 text-[#3b5bff]/50" />
            </div>
            <p className="text-5xl font-bold text-white">
              {averageScore || "-"}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff6b4a]">
                Top category
              </p>
              <Medal className="w-5 h-5 text-[#ff6b4a]/50" />
            </div>
            <p className="text-3xl font-bold text-white capitalize leading-tight">
              {topCategory}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Sessions
              </p>
              <Target className="w-5 h-5 text-emerald-400/50" />
            </div>
            <p className="text-5xl font-bold text-white">
              {sessions.length}
            </p>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 lg:grid-cols-[1fr_1.2fr]"
        >
          <div className="rounded-3xl border border-white/10 bg-[#101826]/80 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(59,91,255,0.15)] flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#3b5bff]" /> Session Scores</h2>
            <div className="mt-6 space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Select session
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none focus:border-[#3b5bff]/50 focus:ring-2 focus:ring-[#3b5bff]/20 transition-all"
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
            <div className="mt-8 grid gap-4 flex-1">
              {scoreEntries.length ? (
                scoreEntries.map(([key, detail], i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
                    key={key}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                        {key.replace("_", " ")}
                      </p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white group-hover:bg-[#ff6b4a] group-hover:shadow-[0_0_15px_rgba(255,107,74,0.5)] transition-all">
                        {detail.score}/5
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-950/80 overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(detail.score / 5) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${detail.score >= 4 ? 'bg-emerald-500' : detail.score >= 3 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                      />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{detail.notes}</p>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60 gap-4 min-h-[200px]">
                  <Activity className="w-12 h-12" />
                  <p className="text-sm">No scores found for this session.</p>
                </div>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-white/10">
              <button
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,107,74,0.3)] transition-transform hover:scale-105"
                type="button"
                onClick={() => handleExport("md")}
              >
                <FileText className="w-4 h-4" /> Markdown
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
                type="button"
                onClick={() => handleExport("pdf")}
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 via-[#0f172a]/80 to-[#0b1220]/80 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(255,107,74,0.15)] flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><GitCompare className="w-5 h-5 text-[#ff6b4a]" /> Compare Attempts</h2>
            <div className="mt-6 grid gap-4">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                First session
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none focus:border-[#ff6b4a]/50 focus:ring-2 focus:ring-[#ff6b4a]/20 transition-all"
                value={compareLeft ?? ""}
                onChange={(event) => setCompareLeft(event.target.value)}
              >
                {sessionOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
                Second session
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none focus:border-[#ff6b4a]/50 focus:ring-2 focus:ring-[#ff6b4a]/20 transition-all"
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
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3b5bff] to-[#5d7bff] px-6 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,91,255,0.3)] transition-transform hover:scale-105"
                type="button"
                onClick={handleCompare}
              >
                <GitCompare className="w-4 h-4" /> Run Comparison
              </button>
            </div>
            
            <div className="mt-8 flex-1 flex flex-col min-h-[300px]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b5bff] mb-3">Analysis Result</p>
              <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-300 shadow-inner custom-scrollbar">
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                  {diff ?? "Select two sessions and run a comparison to see AI analysis of your improvements."}
                </pre>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
