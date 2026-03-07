import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("mockAuth")?.value === "true";

  if (!isAuthed) {
    redirect("/login");
  }

  return <DashboardClient />;
}
