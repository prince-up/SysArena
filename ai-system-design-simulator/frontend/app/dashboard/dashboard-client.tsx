"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const handleStart = (title: string) => {
    localStorage.setItem("selectedQuestionTitle", title);
    router.push("/interview");
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Dashboard
          </p>
          <h1 className="font-display text-4xl text-white">
            Available interviews
          </h1>
          <p className="max-w-2xl text-slate-300">
            Pick a prompt and start the AI-led interview flow.
          </p>
        </header>

        {isLoading ? (
          <p className="text-slate-400">Loading questions...</p>
        ) : error ? (
          <p className="text-rose-300">{error}</p>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {questions.map((item) => (
              <article
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0b1220] p-6 shadow-[0_20px_80px_-60px_rgba(59,91,255,0.6)]"
                key={item.id}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    {item.title}
                  </h2>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300">
                    {item.difficulty}
                  </span>
                </div>
                <p className="mt-3 text-slate-300">{item.description}</p>
                {item.tags && item.tags.length ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {item.tags.join(", ")}
                  </p>
                ) : null}
                <button
                  className="mt-6 rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ff6b4a]/30"
                  type="button"
                  onClick={() => handleStart(item.title)}
                >
                  Start interview
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
