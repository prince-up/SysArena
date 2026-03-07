"use client";

import { useEffect, useState } from "react";

type Message = {
  role: "ai" | "user";
  text: string;
};

const questionTitle = "Design WhatsApp";
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const initialMessages: Message[] = [
  {
    role: "ai",
    text: "Design WhatsApp. Start with a high-level architecture.",
  },
];

export default function InterviewClient() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      return;
    }

    const existing = localStorage.getItem("interviewSessionId");
    if (existing) {
      setSessionId(existing);
      return;
    }

    const freshId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}`;
    localStorage.setItem("interviewSessionId", freshId);
    setSessionId(freshId);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const controller = new AbortController();
    const loadHistory = async () => {
      setIsHydrating(true);
      setError(null);
      try {
        const response = await fetch(
          `${apiBaseUrl}/interview/history/${sessionId}?question_title=${encodeURIComponent(
            questionTitle
          )}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { detail?: string }
            | null;
          throw new Error(data?.detail ?? "Unable to load chat history");
        }

        const data = (await response.json()) as Message[];
        setMessages(data.length ? data : initialMessages);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Unable to load chat history. Refresh to try again.");
        }
      } finally {
        setIsHydrating(false);
      }
    };

    void loadHistory();
    return () => controller.abort();
  }, [sessionId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending || !sessionId) {
      return;
    }

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setIsSending(true);

    try {
      const response = await fetch(`${apiBaseUrl}/interview/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          question_title: questionTitle,
          user_answer: trimmed,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;
        throw new Error(data?.detail ?? "Request failed");
      }

      const data = (await response.json()) as { ai_reply?: string };
      const reply =
        data.ai_reply ??
        "Thanks. Can you share more details about storage and indexing?";

      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not reach the interviewer. Try again in a moment.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Sorry, I ran into an issue. Please resend your answer.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearSession = async () => {
    if (!sessionId || isClearing) {
      return;
    }

    setIsClearing(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/interview/clear/${sessionId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;
        throw new Error(data?.detail ?? "Unable to clear session");
      }

      localStorage.removeItem("interviewSessionId");
      setSessionId(null);
      setMessages(initialMessages);
      setInput("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to clear session. Try again in a moment.";
      setError(message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Interview
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">{questionTitle}</h1>
            <button
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition-colors hover:text-white disabled:opacity-60"
              type="button"
              onClick={handleClearSession}
              disabled={isClearing}
            >
              {isClearing ? "Clearing" : "Clear session"}
            </button>
          </div>
          <p className="text-slate-400">
            AI interviewer will guide you step by step.
          </p>
        </header>

        <section className="flex flex-1 flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-1 flex-col gap-4 overflow-auto">
            {messages.map((message, index) => (
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "ai"
                    ? "self-start bg-slate-800 text-slate-100"
                    : "self-end bg-white text-slate-900"
                }`}
                key={`${message.role}-${index}`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <form
            className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <input
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-slate-500"
              placeholder="Type your answer..."
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending || isHydrating || !sessionId}
            />
            <button
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
              type="submit"
              disabled={isSending || isHydrating || !sessionId}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
