import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/llm";
import { readRubricSection } from "@/lib/rubrics";
import { normalizeExtraction } from "@/lib/extraction";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { statement_text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const statementText = body.statement_text?.trim();
  if (!statementText || statementText.length < 200) {
    return NextResponse.json(
      { error: "Statement text too short (min 200 characters)" },
      { status: 400 }
    );
  }
  if (statementText.length > 12000) {
    return NextResponse.json(
      { error: "Statement text too long (max 12,000 characters)" },
      { status: 400 }
    );
  }

  const rubric = readRubricSection("extract_v2");

  try {
    const result = await chatJSON<{ claims?: unknown }>({
      system: `You are a personal statement proposition extractor for an admissions interview rehearsal product. Follow the rubric exactly and output valid JSON only.\n\n${rubric}`,
      user: `Decompose this personal statement into minimal propositions:\n"""\n${statementText}\n"""`,
    });

    // 代码层校验：逐字引用、命题数量、追问方向都在这里兜底
    const document = normalizeExtraction(result, statementText, "personal_statement");
    return NextResponse.json(document);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Extraction failed. ${msg}` }, { status: 502 });
  }
}
