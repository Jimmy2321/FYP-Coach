import { NextRequest, NextResponse } from "next/server";
import { contestBand } from "@/lib/evaluation";
import { BANDS, DIMENSIONS, type Band, type Dimension } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const dimension = body.dimension;
    const anchor = body.anchor;
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!question || !answer) {
      return NextResponse.json(
        { error: "question and answer are required" },
        { status: 400 }
      );
    }
    if (
      typeof dimension !== "string" ||
      !(DIMENSIONS as readonly string[]).includes(dimension)
    ) {
      return NextResponse.json({ error: "Unknown dimension" }, { status: 400 });
    }
    if (typeof anchor !== "string" || !(BANDS as readonly string[]).includes(anchor)) {
      return NextResponse.json({ error: "Unknown band" }, { status: 400 });
    }

    const result = await contestBand({
      questionId:
        typeof body.question_id === "string" && body.question_id.length > 0
          ? body.question_id
          : "Q1",
      question,
      answer,
      dimension: dimension as Dimension,
      anchor: anchor as Band,
      note,
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Challenge failed. ${msg}` }, { status: 502 });
  }
}
