import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const session = await getServerSession(authOptions);
  const response = await fetch(`${apiBaseUrl}/questions`, {
    headers: {
      "X-User-Email": session?.user?.email ?? "",
    },
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const payload = await request.json();
  const response = await fetch(`${apiBaseUrl}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": session?.user?.email ?? "",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const payload = await request.json();
  const { id, ...rest } = payload as { id: number } & Record<string, unknown>;
  const response = await fetch(`${apiBaseUrl}/questions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": session?.user?.email ?? "",
    },
    body: JSON.stringify(rest),
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const response = await fetch(`${apiBaseUrl}/questions/${id}`, {
    method: "DELETE",
    headers: {
      "X-User-Email": session?.user?.email ?? "",
    },
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
