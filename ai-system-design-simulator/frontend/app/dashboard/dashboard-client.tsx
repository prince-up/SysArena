"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-14">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Dashboard
          </p>
          <h1 className="text-4xl font-semibold">Available interviews</h1>
          <p className="max-w-2xl text-slate-600">
            Pick a prompt and start the AI-led interview flow.
          </p>
        </header>

        {isLoading ? (
          <p className="text-slate-500">Loading questions...</p>
        ) : error ? (
          <p className="text-rose-500">{error}</p>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {questions.map((item) => (
              <article
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                key={item.id}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {item.difficulty}
                  </span>
                </div>
                <p className="mt-3 text-slate-600">{item.description}</p>
                <button
                  className="mt-6 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
