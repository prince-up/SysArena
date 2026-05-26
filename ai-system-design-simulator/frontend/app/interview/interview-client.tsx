"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Send, X, Code, Lightbulb, Activity, Brain } from "lucide-react";

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
    <div className="min-h-screen text-slate-100 bg-transparent">
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-12">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-3 text-[#3b5bff]">
            <Terminal className="w-5 h-5" />
            <p className="text-xs uppercase tracking-[0.4em] font-bold">
              Interview Console
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {questionTitle}
            </h1>
            <button
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition-all hover:bg-white/10 hover:border-white/40 disabled:opacity-60"
              type="button"
              onClick={handleClearSession}
              disabled={isClearing}
            >
              <X className="w-4 h-4" />
              {isClearing ? "Clearing..." : "Clear session"}
            </button>
          </div>
          <p className="max-w-2xl text-slate-300">
            System Design AI Interviewer is ready.
          </p>
        </motion.header>

        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid gap-6 rounded-3xl border border-white/10 bg-[#0f172a]/70 backdrop-blur-xl p-6 shadow-[0_0_50px_rgba(59,91,255,0.15)] lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="flex min-h-[600px] flex-1 flex-col gap-4 relative">
            {toast ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-2 left-1/2 -translate-x-1/2 z-20 rounded-full border border-amber-400/30 bg-amber-500/20 backdrop-blur-md px-6 py-2 text-xs font-bold text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                {toast}
              </motion.div>
            ) : null}
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-[#3b5bff]">
              <span className="flex items-center gap-2"><Code className="w-4 h-4"/> Console Output</span>
              <span className="flex items-center gap-2">
                {isStreaming ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b4a] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff6b4a]"></span>
                    </span>
                    AI is typing
                  </>
                ) : (
                  <>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    Ready
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-6 overflow-auto rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-inner custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] rounded-3xl px-6 py-4 text-sm leading-relaxed shadow-lg ${
                      message.role === "ai"
                        ? "self-start border border-[#3b5bff]/30 bg-gradient-to-br from-[#3b5bff]/10 to-transparent text-slate-100 rounded-tl-sm backdrop-blur-sm"
                        : "self-end bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] text-white rounded-tr-sm shadow-[0_0_20px_rgba(255,107,74,0.3)]"
                    }`}
                    key={`${message.role}-${index}`}
                  >
                    <div className="whitespace-pre-wrap">{message.text}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={endRef} />
            </div>
            <form
              className="flex flex-col gap-3 pt-2 sm:flex-row relative"
              onSubmit={handleSubmit}
            >
              <input
                className="flex-1 rounded-full border border-white/10 bg-slate-950/80 px-6 py-4 text-sm text-slate-100 outline-none focus:border-[#3b5bff]/50 focus:ring-2 focus:ring-[#3b5bff]/20 transition-all placeholder:text-slate-500 shadow-inner"
                placeholder="Type your architectural decision..."
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isSending || isHydrating || isStreaming || !sessionId}
              />
              <button
                className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-8 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,107,74,0.3)] disabled:opacity-60 transition-all hover:scale-105"
                type="submit"
                disabled={isSending || isHydrating || isStreaming || !sessionId}
              >
                {isSending || isStreaming ? "Wait..." : <><Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Send</>}
              </button>
              {isStreaming && (
                <button
                  className="rounded-full border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
                  type="button"
                  onClick={handleCancel}
                >
                  Stop
                </button>
              )}
            </form>
            {error ? <p className="text-sm text-rose-400 font-medium px-4">{error}</p> : null}
          </div>
          <aside className="flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-[#ff6b4a]/20 bg-[#ff6b4a]/5 backdrop-blur-md p-6 text-sm text-slate-200 shadow-[0_0_30px_rgba(255,107,74,0.05)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[#ff6b4a]" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff6b4a]">
                  Suggestions
                </p>
              </div>
              {suggestions.length ? (
                <ul className="space-y-3 text-slate-300">
                  {suggestions.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2">
                      <span className="text-[#ff6b4a] font-bold">•</span> {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-xs italic">
                  Follow-up suggestions will appear after your first answer.
                </p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-[#3b5bff]/20 bg-[#3b5bff]/5 backdrop-blur-md p-6 text-sm text-slate-200 shadow-[0_0_30px_rgba(59,91,255,0.05)] flex-1"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#3b5bff]" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b5bff]">
                  Live Scoring
                </p>
              </div>
              {scores ? (
                <div className="grid gap-4">
                  {Object.entries(scores).map(([key, detail]) => (
                    <div
                      className="group rounded-2xl border border-white/5 bg-slate-950/50 p-4 transition-all hover:border-[#3b5bff]/30 hover:bg-slate-950/80"
                      key={key}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          {key.replace("_", " ")}
                        </p>
                        <span className="text-[#3b5bff] font-bold bg-[#3b5bff]/10 px-2 py-0.5 rounded text-xs">{detail.score}/5</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(detail.score / 5) * 100}%` }}
                          className={`h-1.5 rounded-full ${detail.score >= 4 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : detail.score >= 3 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                        />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{detail.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3 opacity-50">
                  <Brain className="w-10 h-10" />
                  <p className="text-xs font-medium text-center px-4">
                    Scores will dynamically generate after the AI responds.
                  </p>
                </div>
              )}
            </motion.div>
          </aside>
        </motion.section>
      </main>
    </div>
  );
}
