import { NextResponse } from "next/server";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "md";

  const response = await fetch(
    `${apiBaseUrl}/interview/export/${sessionId}?format=${format}`
  );

  const body = await response.arrayBuffer();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ??
        (format === "pdf" ? "application/pdf" : "text/markdown"),
      "Content-Disposition":
        response.headers.get("Content-Disposition") ??
        `attachment; filename=interview-${sessionId}.${format}`,
    },
  });
}
