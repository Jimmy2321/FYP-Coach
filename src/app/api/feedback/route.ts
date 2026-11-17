import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/evaluation";
import type { QuestionScore } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const score = body.score as QuestionScore | undefined;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "question and answer are required" },
        { status: 400 }
      );
    }
    if (!score || typeof score !== "object" || !score.dimensions) {
      return NextResponse.json(
        { error: "score is required — call /api/evaluate first" },
        { status: 400 }
      );
    }

    const feedback = await generateFeedback({ question, answer, score });
    return NextResponse.json(feedback);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Feedback failed. ${msg}` }, { status: 502 });
  }
}
