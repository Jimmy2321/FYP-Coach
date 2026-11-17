import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/llm";
import { readRubricSection } from "@/lib/rubrics";
import { normalizeExtraction } from "@/lib/extraction";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { resume_text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const resumeText = body.resume_text?.trim();
  if (!resumeText || resumeText.length < 50) {
    return NextResponse.json(
      { error: "Resume text too short (min 50 characters)" },
      { status: 400 }
    );
  }
  if (resumeText.length > 12000) {
    return NextResponse.json(
      { error: "Resume text too long (max 12,000 characters)" },
      { status: 400 }
    );
  }

  const rubric = readRubricSection("extract_v2");

  try {
    const result = await chatJSON<{ claims?: unknown }>({
      system: `You are a resume proposition extractor for a technical interview rehearsal product. Follow the rubric exactly and output valid JSON only.\n\n${rubric}`,
      user: `Decompose this resume into minimal propositions:\n"""\n${resumeText}\n"""`,
    });

    // 代码层校验：逐字引用、命题数量、追问方向都在这里兜底
    const document = normalizeExtraction(result, resumeText, "resume");
    return NextResponse.json(document);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Extraction failed. ${msg}` }, { status: 502 });
  }
}
