from io import BytesIO
from typing import Iterable

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
except Exception:  # pragma: no cover - optional dependency
    canvas = None
    letter = None


def build_markdown(
    question_title: str,
    messages: Iterable[dict[str, str]],
    scores: dict[str, dict[str, str | int]] | None = None,
    suggestions: list[str] | None = None,
) -> str:
    lines = [f"# Interview Summary", "", f"## Question", question_title, ""]
    lines.append("## Conversation")
    for item in messages:
        role = item.get("role", "user").title()
        text = item.get("text", "")
        lines.append(f"**{role}:** {text}")
    lines.append("")

    if scores:
        lines.append("## Scores")
        for key, detail in scores.items():
            score = detail.get("score", "")
            notes = detail.get("notes", "")
            label = key.replace("_", " ").title()
            lines.append(f"- {label}: {score}/5 - {notes}")
        lines.append("")

    if suggestions:
        lines.append("## Follow-up Suggestions")
        for item in suggestions:
            lines.append(f"- {item}")
        lines.append("")

    return "\n".join(lines)


def build_pdf(markdown_text: str) -> bytes:
    if canvas is None or letter is None:
        return markdown_text.encode("utf-8")

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 48
    for line in markdown_text.splitlines():
        if not line:
            y -= 12
            continue
        if y < 48:
            pdf.showPage()
            y = height - 48
        pdf.drawString(48, y, line[:140])
        y -= 14
    pdf.save()
    return buffer.getvalue()
