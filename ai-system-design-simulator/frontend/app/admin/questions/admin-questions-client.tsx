"use client";

import { useEffect, useState } from "react";

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
    <div className="min-h-screen bg-[#0b0f1a] text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Admin
          </p>
          <h1 className="font-display text-4xl text-white">Question editor</h1>
          <p className="max-w-2xl text-slate-300">
            Create, edit, and tag system design prompts.
          </p>
        </header>

        {isLoading ? <p className="text-slate-400">Loading...</p> : null}
        {error ? <p className="text-rose-300">{error}</p> : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
          <div className="rounded-3xl border border-white/10 bg-[#101826] p-6">
            <h2 className="text-lg font-semibold text-white">Edit question</h2>
            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="Title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, title: event.target.value }))
                }
              />
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="Description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="Difficulty (Easy/Medium/Hard)"
                value={draft.difficulty}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    difficulty: event.target.value,
                  }))
                }
              />
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="Tags (comma separated)"
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
              <button
                className="rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-5 py-3 text-sm font-semibold text-white"
                type="button"
                onClick={handleSubmit}
              >
                {draft.id ? "Update" : "Create"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0b1220] p-6">
            <h2 className="text-lg font-semibold text-white">Questions</h2>
            <div className="mt-4 grid gap-4">
              {questions.length ? (
                questions.map((item) => (
                  <article
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    key={item.id}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-white">
                        {item.title}
                      </h3>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300">
                        {item.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {item.description}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {(item.tags ?? []).join(", ") || "No tags"}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white"
                        type="button"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white"
                        type="button"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-400">No questions yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
