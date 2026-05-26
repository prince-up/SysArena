"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Search, Filter, Play, Tag, Loader2, Code2 } from "lucide-react";

type Question = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  tags?: string[];
};

const apiBaseUrl = "/api";

export default function DashboardClient() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [lastTitle, setLastTitle] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/questions`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { detail?: string }
            | null;
          throw new Error(data?.detail ?? "Unable to load questions");
        }

        const data = (await response.json()) as Question[];
        setQuestions(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Unable to load questions. Refresh to try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    void loadQuestions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const storedTitle = localStorage.getItem("selectedQuestionTitle");
    setLastTitle(storedTitle);
  }, []);

  const handleStart = (title: string) => {
    localStorage.setItem("selectedQuestionTitle", title);
    router.push("/interview");
  };

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    questions.forEach((item) => {
      (item.tags ?? []).forEach((tag) => tags.add(tag));
    });
    return ["All", ...Array.from(tags).sort()];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());
      const matchesDifficulty =
        difficulty === "All" || item.difficulty === difficulty;
      const matchesTag =
        tagFilter === "All" || (item.tags ?? []).includes(tagFilter);
      return matchesQuery && matchesDifficulty && matchesTag;
    });
  }, [questions, query, difficulty, tagFilter]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-transparent">
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 pb-24">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 text-[#3b5bff]">
            <Code2 className="w-6 h-6" />
            <p className="text-xs font-bold uppercase tracking-[0.4em]">
              Dashboard
            </p>
          </div>
          <h1 className="font-display text-5xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Available interviews
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Pick a prompt and start the AI-led interview flow.
          </p>
        </motion.header>

        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#3b5bff] transition-colors" />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-4 py-3 text-sm text-slate-100 outline-none focus:border-[#3b5bff]/50 focus:ring-2 focus:ring-[#3b5bff]/20 transition-all"
                  placeholder="Search prompts..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff6b4a] transition-colors" />
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-10 py-3 text-sm text-slate-100 outline-none focus:border-[#ff6b4a]/50 focus:ring-2 focus:ring-[#ff6b4a]/20 appearance-none transition-all"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                >
                  {"All,Easy,Medium,Hard".split(",").map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#3b5bff] transition-colors" />
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-10 py-3 text-sm text-slate-100 outline-none focus:border-[#3b5bff]/50 focus:ring-2 focus:ring-[#3b5bff]/20 appearance-none transition-all"
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                >
                  {tagOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {lastTitle ? (
              <button
                className="group flex items-center gap-2 rounded-full border border-[#ff6b4a]/30 bg-[#ff6b4a]/10 px-6 py-3 text-sm font-bold text-[#ff6b4a] hover:bg-[#ff6b4a]/20 transition-all"
                type="button"
                onClick={() => handleStart(lastTitle)}
              >
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Continue {lastTitle}
              </button>
            ) : null}
          </div>
        </motion.section>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#3b5bff]">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300 backdrop-blur-md">
            {error}
          </div>
        ) : (
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredQuestions.map((item) => (
              <motion.article
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#101826]/80 via-[#0f172a]/80 to-[#141a2d]/80 p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:border-[#3b5bff]/30 hover:shadow-[0_0_40px_rgba(59,91,255,0.2)]"
                key={item.id}
              >
                <div>
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {item.title}
                    </h2>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                      item.difficulty === 'Hard' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                      item.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                      'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    }`}>
                      {item.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{item.description}</p>
                </div>
                
                <div className="mt-6 space-y-6">
                  {item.tags && item.tags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : <div className="h-6" />}
                  
                  <button
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-bold text-white transition-all group-hover:bg-gradient-to-r group-hover:from-[#ff6b4a] group-hover:to-[#ff4d2d] group-hover:border-transparent group-hover:shadow-[0_0_20px_rgba(255,107,74,0.4)]"
                    type="button"
                    onClick={() => handleStart(item.title)}
                  >
                    Start Interview
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </motion.article>
            ))}
            {!filteredQuestions.length ? (
              <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
                <p className="text-lg text-slate-400">No prompts match your filters.</p>
              </div>
            ) : null}
          </motion.section>
        )}
      </main>
    </div>
  );
}
