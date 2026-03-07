"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "ai" | "user";
  text: string;
};

const defaultQuestionTitle = "Design WhatsApp";
const apiBaseUrl = "/api";

const buildSeedMessages = (title: string): Message[] => [
  {
    role: "ai",
    text: `${title}. Start with a high-level architecture.`,
  },
];

export default function InterviewClient() {
  const [messages, setMessages] = useState<Message[]>(
    buildSeedMessages(defaultQuestionTitle)
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionTitle, setQuestionTitle] = useState(defaultQuestionTitle);
  const endRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const senderIdRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sender-${Date.now()}`
  );

  useEffect(() => {
    if (sessionId) {
      return;
    }

    const storedTitle = localStorage.getItem("selectedQuestionTitle");
    if (storedTitle) {
      setQuestionTitle(storedTitle);
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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel("sysarena-interview");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const payload = event.data as
        | {
            type: "user-message" | "ai-message" | "clear-session";
            sessionId: string;
            text?: string;
            senderId: string;
          }
        | undefined;

      if (!payload || payload.senderId === senderIdRef.current) {
        return;
      }

      if (!sessionId || payload.sessionId !== sessionId) {
        return;
      }

      if (payload.type === "clear-session") {
        setMessages(buildSeedMessages(questionTitle));
        return;
      }

      if (payload.type === "user-message" && payload.text) {
        setMessages((prev) => [...prev, { role: "user", text: payload.text }]);
        return;
      }

      if (payload.type === "ai-message" && payload.text) {
        streamReply(payload.text);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [questionTitle, sessionId]);

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
        setMessages(data.length ? data : buildSeedMessages(questionTitle));
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
  }, [questionTitle, sessionId]);

  const streamReply = (fullText: string) => {
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "ai", text: "" }]);

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setMessages((prev) => {
        if (!prev.length) {
          return prev;
        }
        const next = [...prev];
        const lastIndex = next.length - 1;
        const last = next[lastIndex];
        if (last.role !== "ai") {
          return next;
        }
        next[lastIndex] = {
          ...last,
          text: fullText.slice(0, index),
        };
        return next;
      });

      if (index >= fullText.length) {
        window.clearInterval(interval);
        setIsStreaming(false);
      }
    }, 18);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending || isStreaming || !sessionId) {
      return;
    }

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    channelRef.current?.postMessage({
      type: "user-message",
      sessionId,
      text: trimmed,
      senderId: senderIdRef.current,
    });
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

      streamReply(reply);
      channelRef.current?.postMessage({
        type: "ai-message",
        sessionId,
        text: reply,
        senderId: senderIdRef.current,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not reach the interviewer. Try again in a moment.";
      setError(message);
      streamReply("Sorry, I ran into an issue. Please resend your answer.");
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
      setMessages(buildSeedMessages(questionTitle));
      setInput("");
      channelRef.current?.postMessage({
        type: "clear-session",
        sessionId,
        senderId: senderIdRef.current,
      });
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
    <div className="min-h-screen bg-[#0b0f1a] text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Interview
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-3xl text-white">
              {questionTitle}
            </h1>
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition-colors hover:border-white/40 disabled:opacity-60"
              type="button"
              onClick={handleClearSession}
              disabled={isClearing}
            >
              {isClearing ? "Clearing" : "Clear session"}
            </button>
          </div>
          <p className="max-w-2xl text-slate-300">
            AI interviewer will guide you step by step.
          </p>
        </header>

        <section className="flex flex-1 flex-col gap-6 rounded-3xl border border-white/10 bg-[#0f172a]/80 p-6 shadow-[0_20px_80px_-60px_rgba(59,91,255,0.6)]">
          <div className="flex flex-1 flex-col gap-4 overflow-auto">
            {messages.map((message, index) => (
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "ai"
                    ? "self-start bg-white/10 text-slate-100"
                    : "self-end bg-white text-slate-900"
                }`}
                key={`${message.role}-${index}`}
              >
                {message.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-white/40"
              placeholder="Type your answer..."
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending || isHydrating || isStreaming || !sessionId}
            />
            <button
              className="rounded-2xl bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff6b4a]/30 disabled:opacity-60"
              type="submit"
              disabled={isSending || isHydrating || isStreaming || !sessionId}
            >
              {isSending || isStreaming ? "Sending..." : "Send"}
            </button>
          </form>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
