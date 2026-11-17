import { NextRequest, NextResponse } from "next/server";
import { evaluatePair } from "@/lib/evaluation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const track = body.track === "admissions" ? "admissions" : "job";
    const questionId =
      typeof body.question_id === "string" && body.question_id.length > 0
        ? body.question_id
        : "Q1";

    if (!question || !answer) {
      return NextResponse.json(
        { error: "question and answer are required" },
        { status: 400 }
      );
    }

    const score = await evaluatePair({ questionId, question, answer, track });
    return NextResponse.json(score);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Evaluation failed. ${msg}` }, { status: 502 });
  }
}
