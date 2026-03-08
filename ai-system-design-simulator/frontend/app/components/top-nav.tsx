"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/interview", label: "Interview" },
  { href: "/results", label: "Results" },
  { href: "/admin/questions", label: "Admin" },
];

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthed = Boolean(session?.user?.email);

  const handleLogout = () => {
    localStorage.removeItem("interviewSessionId");
    void signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link className="flex items-center gap-3 text-lg font-semibold text-white" href="/">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6b4a] to-[#3b5bff] text-sm font-bold text-white">
            SA
          </span>
          <span className="font-display text-xl">SysArena</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          {links.map((item) => (
            <Link
              className={`rounded-full px-4 py-2 transition-colors hover:text-white ${
                pathname === item.href
                  ? "bg-white/10 text-white"
                  : "text-slate-300"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isAuthed ? (
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/40"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <Link
              className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/40"
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
