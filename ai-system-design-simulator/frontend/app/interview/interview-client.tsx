"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

type Message = {
  role: "ai" | "user";
  text: string;
};

type ScoreDetail = {
  score: number;
  notes: string;
};

type ScoreMap = Record<string, ScoreDetail>;
type Suggestion = string;

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
  const [scores, setScores] = useState<ScoreMap | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionTitle, setQuestionTitle] = useState(defaultQuestionTitle);
  const endRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const streamTokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const { data: session } = useSession();
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
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current !== null) {
        window.clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    };
  }, []);

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
    if (streamIntervalRef.current !== null) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    setIsStreaming(true);
    const streamToken = streamTokenRef.current + 1;
    streamTokenRef.current = streamToken;
    setMessages((prev) => [...prev, { role: "ai", text: "" }]);

    let index = 0;
    streamIntervalRef.current = window.setInterval(() => {
      if (streamTokenRef.current !== streamToken) {
        if (streamIntervalRef.current !== null) {
          window.clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        return;
      }

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
        if (streamIntervalRef.current !== null) {
          window.clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        setIsStreaming(false);
      }
    }, 18);
  };

  const beginStreamMessage = (token: number) => {
    if (streamTokenRef.current !== token) {
      return;
    }
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "ai", text: "" }]);
  };

  const appendStreamDelta = (token: number, delta: string) => {
    if (!delta || streamTokenRef.current !== token) {
      return;
    }
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
        text: `${last.text}${delta}`,
      };
      return next;
    });
  };

  const finalizeStream = (
    token: number,
    fullText: string | null,
    nextScores: ScoreMap | null,
    nextSuggestions: Suggestion[] | null
  ) => {
    if (streamTokenRef.current !== token) {
      return;
    }
    if (fullText) {
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
          text: fullText,
        };
        return next;
      });
    }
    if (nextScores) {
      setScores(nextScores);
    }
    if (nextSuggestions) {
      setSuggestions(nextSuggestions);
    }
    setIsStreaming(false);
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setIsStreaming(false);
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

    const sendRequest = async (attempt: number) => {
      let timeoutId: number | null = null;
      try {
        const controller = new AbortController();
        abortRef.current = controller;
        timeoutId = window.setTimeout(() => controller.abort(), 45000);

        const response = await fetch(`${apiBaseUrl}/interview/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            session_id: sessionId,
            question_title: questionTitle,
            user_answer: trimmed,
            user_id: session?.user?.id ? Number(session.user.id) : null,
          }),
        });

        if (response.status === 429 && attempt < 1) {
          setToast("Rate limit hit. Retrying in 2 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return await sendRequest(attempt + 1);
        }

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { detail?: string }
            | null;
          throw new Error(data?.detail ?? "Request failed");
        }

        const contentType = response.headers.get("Content-Type") ?? "";
        if (!contentType.includes("text/event-stream") || !response.body) {
          const data = (await response.json()) as {
            ai_reply?: string;
            scores?: ScoreMap;
            suggestions?: Suggestion[];
          };
          const reply =
            data.ai_reply ??
            "Thanks. Can you share more details about storage and indexing?";
          if (data.scores) {
            setScores(data.scores);
          }
          if (data.suggestions) {
            setSuggestions(data.suggestions);
          }
          streamReply(reply);
          channelRef.current?.postMessage({
            type: "ai-message",
            sessionId,
            text: reply,
            senderId: senderIdRef.current,
          });
          return;
        }

      const streamToken = streamTokenRef.current + 1;
      streamTokenRef.current = streamToken;
      beginStreamMessage(streamToken);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

      const handleEvent = (rawEvent: string) => {
        const lines = rawEvent.split("\n");
        let eventName = "message";
        const dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }
        const dataText = dataLines.join("\n");
        if (!dataText) {
          return;
        }
        let payload:
          | {
              delta?: string;
              full_text?: string;
              scores?: ScoreMap;
              suggestions?: Suggestion[];
            }
          | null = null;
        try {
          payload = JSON.parse(dataText) as {
            delta?: string;
            full_text?: string;
            scores?: ScoreMap;
          };
        } catch {
          payload = { delta: dataText };
        }

        if (eventName === "chunk" && payload?.delta) {
          appendStreamDelta(streamToken, payload.delta);
        }

        if (eventName === "done") {
          finalizeStream(
            streamToken,
            payload?.full_text ?? null,
            payload?.scores ?? null,
            payload?.suggestions ?? null
          );
          if (payload?.full_text) {
            channelRef.current?.postMessage({
              type: "ai-message",
              sessionId,
              text: payload.full_text,
              senderId: senderIdRef.current,
            });
          }
        }
      };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            handleEvent(part);
          }
        }
      } finally {
        abortRef.current = null;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      }
    };

    try {
      await sendRequest(0);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out or was cancelled. Please resend your answer."
            : err.message
          : "Could not reach the interviewer. Try again in a moment.";
      setError(message);
      setToast(message);
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
          {toast ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
              {toast}
            </div>
          ) : null}
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
          {isStreaming ? (
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              AI is typing...
            </p>
          ) : null}
          {suggestions.length ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-200">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Follow-up suggestions
              </p>
              <ul className="mt-2 space-y-2 text-slate-300">
                {suggestions.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {scores ? (
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-200">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Latest scoring
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(scores).map(([key, detail]) => (
                  <div
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                    key={key}
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      {key.replace("_", " ")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {detail.score}/5
                    </p>
                    <p className="mt-1 text-slate-300">{detail.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
            <button
              className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-slate-100 disabled:opacity-60"
              type="button"
              onClick={handleCancel}
              disabled={!isStreaming}
            >
              Cancel
            </button>
          </form>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
