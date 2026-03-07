import { NextResponse } from "next/server";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const url = new URL(request.url);
  const questionTitle = url.searchParams.get("question_title");

  const response = await fetch(
    `${apiBaseUrl}/interview/history/${sessionId}?question_title=${encodeURIComponent(
      questionTitle ?? ""
    )}`
  );

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
