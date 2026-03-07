"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("mockAuth", "true");
      document.cookie = "mockAuth=true; path=/; max-age=2592000";
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-8 px-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Signup
          </p>
          <h1 className="text-3xl font-semibold">Create your account</h1>
          <p className="text-slate-400">
            Start practicing system design interviews in minutes.
          </p>
        </div>
        <form
          className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Name
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
              id="name"
              name="name"
              placeholder="Your name"
              type="text"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
              id="email"
              name="email"
              placeholder="you@company.com"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-300"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
              id="password"
              name="password"
              placeholder="Create a password"
              type="password"
            />
          </div>
          <button
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            type="submit"
          >
            Create account
          </button>
        </form>
      </main>
    </div>
  );
}
