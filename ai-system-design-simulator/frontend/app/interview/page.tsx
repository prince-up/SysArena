import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InterviewClient from "./interview-client";

export default async function InterviewPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("mockAuth")?.value === "true";

  if (!isAuthed) {
    redirect("/login");
  }

  return <InterviewClient />;
}
