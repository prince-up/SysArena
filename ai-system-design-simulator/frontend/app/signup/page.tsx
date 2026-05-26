"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;
        setError(data?.detail ?? "Unable to create account.");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError("Account created, but sign-in failed.");
      }
    } catch {
      setError("Unable to sign up right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f1a] text-slate-100">
      <div className="pointer-events-none absolute -top-28 right-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(59,91,255,0.35),transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,107,74,0.35),transparent_65%)] blur-3xl" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-between gap-10 px-6 py-16">
        <div className="hidden flex-1 flex-col gap-6 md:flex">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Signup
          </p>
          <h1 className="font-display text-4xl text-white">
            Start training like you are already in the interview.
          </h1>
          <p className="max-w-md text-slate-300">
            Build your baseline, then sharpen your system design instincts with
            targeted prompts.
          </p>
        </div>
        <form
          className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_-60px_rgba(255,107,74,0.7)]"
          onSubmit={handleSubmit}
        >
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="name">
              Name
            </label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-white/40"
              id="name"
              name="name"
              placeholder="Your name"
              type="text"
              autoComplete="name"
              required
            />
            <p className="text-xs text-slate-500">
              This will be shown on your profile.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-white/40"
              id="email"
              name="email"
              placeholder="you@company.com"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-200"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-white/40"
              id="password"
              name="password"
              placeholder="Create a password"
              type="password"
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-slate-500">
              Use at least 8 characters.
            </p>
          </div>
          <button
            className="w-full rounded-2xl bg-gradient-to-r from-[#3b5bff] to-[#5d7bff] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3b5bff]/30"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
      </main>
    </div>
  );
}
