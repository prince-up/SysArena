"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/interview", label: "Interview" },
  { href: "/results", label: "Results" },
];

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const hasLocalAuth = localStorage.getItem("mockAuth") === "true";
    const hasCookieAuth = document.cookie
      .split(";")
      .some((item) => item.trim().startsWith("mockAuth=true"));
    setIsAuthed(hasLocalAuth || hasCookieAuth);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("mockAuth");
    localStorage.removeItem("interviewSessionId");
    document.cookie = "mockAuth=; Max-Age=0; path=/";
    setIsAuthed(false);
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link className="text-lg font-semibold text-slate-900" href="/">
          SysArena
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600">
          {links.map((item) => (
            <Link
              className="transition-colors hover:text-slate-900"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isAuthed ? (
            <button
              className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition-colors hover:text-slate-900"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <Link
              className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition-colors hover:text-slate-900"
              href="/login"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
