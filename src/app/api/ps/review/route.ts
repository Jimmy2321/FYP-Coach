import { NextResponse } from "next/server";
import { reviewPersonalStatement } from "@/lib/evaluation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const draft = typeof body?.draft === "string" ? body.draft.trim() : "";
    const targetProgram =
      typeof body?.target_program === "string" ? body.target_program.trim() : "";

    if (draft.length < 50) {
      return NextResponse.json(
        { error: "Paste at least a few sentences so there is something to review." },
        { status: 400 }
      );
    }

    const result = await reviewPersonalStatement({ draft, targetProgram });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Review failed. ${msg}` }, { status: 502 });
  }
}
