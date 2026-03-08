import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AdminQuestionsClient from "./admin-questions-client";

export default async function AdminQuestionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return <AdminQuestionsClient />;
}
