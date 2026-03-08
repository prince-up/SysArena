"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f1a] text-slate-100">
      <div className="pointer-events-none absolute -top-32 left-10 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(255,107,74,0.35),transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(59,91,255,0.35),transparent_65%)] blur-3xl" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-between gap-10 px-6 py-16">
        <div className="hidden flex-1 flex-col gap-6 md:flex">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Login
          </p>
          <h1 className="font-display text-4xl text-white">
            Welcome back. Ready for the next interview?
          </h1>
          <p className="max-w-md text-slate-300">
            Continue your system design prep with real-world prompts and
            instant AI feedback.
          </p>
        </div>
        <form
          className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_-60px_rgba(59,91,255,0.7)]"
          onSubmit={handleSubmit}
        >
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
              placeholder="••••••••"
              type="password"
            />
          </div>
          <button
            className="w-full rounded-2xl bg-gradient-to-r from-[#ff6b4a] to-[#ff4d2d] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff6b4a]/30"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <p className="text-center text-sm text-slate-400">
            New here?{" "}
            <Link className="text-white underline" href="/signup">
              Create your account
            </Link>
            .
          </p>
        </form>
      </main>
    </div>
  );
}
