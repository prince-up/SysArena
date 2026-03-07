import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const interviews = [
  {
    title: "Design WhatsApp",
    description: "Build a global, real-time messaging platform.",
    difficulty: "Medium",
  },
  {
    title: "Design Instagram",
    description: "Photo sharing with feeds, storage, and CDN.",
    difficulty: "Medium",
  },
  {
    title: "Design Uber",
    description: "Dispatch, location tracking, and surge pricing.",
    difficulty: "Hard",
  },
];

export default function DashboardPage() {
  const cookieStore = cookies();
  const isAuthed = cookieStore.get("mockAuth")?.value === "true";

  if (!isAuthed) {
    redirect("/login");
  }

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

        <section className="grid gap-6 md:grid-cols-2">
          {interviews.map((item) => (
            <article
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              key={item.title}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {item.difficulty}
                </span>
              </div>
              <p className="mt-3 text-slate-600">{item.description}</p>
              <button className="mt-6 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Start interview
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
