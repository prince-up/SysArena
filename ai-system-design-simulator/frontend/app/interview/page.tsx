import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InterviewClient from "./interview-client";

export default function InterviewPage() {
  const cookieStore = cookies();
  const isAuthed = cookieStore.get("mockAuth")?.value === "true";

  if (!isAuthed) {
    redirect("/login");
  }

  return <InterviewClient />;
}
