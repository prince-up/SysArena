"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Plus, Edit2, Trash2, X, FileText, Tag, BarChart } from "lucide-react";

type Question = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
};

const emptyQuestion: Question = {
  id: 0,
  title: "",
  description: "",
  difficulty: "Medium",
  tags: [],
};

export default function AdminQuestionsClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draft, setDraft] = useState<Question>(emptyQuestion);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/questions");
      if (!response.ok) {
        throw new Error("Unable to load questions");
      }
      const data = (await response.json()) as Question[];
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    try {
      const payload = {
        title: draft.title,
        description: draft.description,
        difficulty: draft.difficulty,
        tags: draft.tags,
      };
      const response = await fetch("/api/admin/questions", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft.id ? { id: draft.id, ...payload } : payload),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;
        throw new Error(data?.detail ?? "Unable to save question");
      }
      setDraft(emptyQuestion);
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save question");
    }
  };

  const handleEdit = (item: Question) => {
    setDraft(item);
  };

  const handleClear = () => {
    setDraft(emptyQuestion);
  };

  const handleDelete = async (id: number) => {
    setError(null);
    const response = await fetch(`/api/admin/questions?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { detail?: string }
        | null;
      setError(data?.detail ?? "Unable to delete question");
      return;
    }
    await loadQuestions();
  };

  return (
    <div className="min-h-screen text-slate-100 bg-transparent">
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-14">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 text-emerald-400">
            <Database className="w-6 h-6" />
            <p className="text-xs uppercase tracking-[0.4em] font-bold">
              Admin Area
            </p>
          </div>
          <h1 className="font-display text-5xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Question Editor
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Create, edit, and tag system design prompts for the interview simulator.
          </p>
        </motion.header>

        {isLoading ? <p className="text-slate-400">Loading...</p> : null}
        {error ? <p className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">{error}</p> : null}

        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]"
        >
          <div className="rounded-3xl border border-white/10 bg-[#101826]/80 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                {draft.id ? "Edit Question" : "New Question"}
              </h2>
              <button
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all hover:scale-105"
                type="button"
                onClick={handleClear}
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>
            
            <div className="grid gap-5 flex-1">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Title
                </label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  placeholder="e.g. Design WhatsApp"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </label>
                <textarea
                  className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all resize-none custom-scrollbar"
                  placeholder="Provide context and requirements..."
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <BarChart className="w-4 h-4" /> Difficulty
                  </label>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                    value={draft.difficulty}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        difficulty: event.target.value,
                      }))
                    }
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Tags (csv)
                  </label>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                    placeholder="system, scalable, db"
                    value={draft.tags.join(", ")}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        tags: event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>
              </div>
              
              <div className="min-h-[40px] flex flex-wrap gap-2 pt-2">
                <AnimatePresence>
                  {draft.tags.map((tag) => (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="group flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                      type="button"
                      key={tag}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((item) => item !== tag),
                        }))
                      }
                    >
                      {tag} <X className="w-3 h-3 group-hover:scale-110" />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
              
              <button
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:scale-105 w-full"
                type="button"
                onClick={handleSubmit}
              >
                {draft.id ? "Update Question" : "Create Question"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/80 via-[#0f172a]/80 to-[#0b1220]/80 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
              <Database className="w-5 h-5 text-[#3b5bff]" /> Question Bank
            </h2>
            <div className="grid gap-4 max-h-[700px] overflow-auto custom-scrollbar pr-2">
              <AnimatePresence>
                {questions.length ? (
                  questions.map((item, i) => (
                    <motion.article
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group rounded-2xl border border-white/10 bg-slate-950/50 p-5 hover:bg-slate-950/80 hover:border-white/20 transition-all"
                      key={item.id}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          item.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(item.tags ?? []).map(tag => (
                          <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-[#3b5bff] bg-[#3b5bff]/10 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {(!item.tags || item.tags.length === 0) && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No tags</span>
                        )}
                      </div>
                      
                      <div className="mt-5 flex gap-3 pt-4 border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-colors"
                          type="button"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-400 transition-colors"
                          type="button"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </motion.article>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 opacity-60 gap-4">
                    <Database className="w-12 h-12" />
                    <p className="text-sm font-medium">No questions yet in the database.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
