import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/llm";
import { readRubricSection } from "@/lib/rubrics";
import type { ClaimDocument, InterviewQuestion } from "@/lib/types";
import {
  cleanGeneratedQuestions,
  flattenPredicates,
} from "@/lib/question-generation";
import { pickProgressive, type BankQuestion } from "@/lib/question-bank";
import {
  ADMISSIONS_WARMUP,
  ADMISSIONS_LITERACY,
  ADMISSIONS_FIT_TEMPLATES,
  ADMISSIONS_WRAPUP,
} from "@/lib/admissions-bank";

export const runtime = "nodejs";

const PERSONAS = new Set(["supportive", "poker", "challenger"]);
// rubric 要求每份文档 5–12 道命题派生题；这里把上限定在 6 以控制整场时长
const MIN_PHASE2 = 5;
const MAX_PHASE2 = 6;

type TargetCount = {
  phase1: number;
  phase2: number;
  phase3: number;
  phase4: number;
  phase5: number;
};

function targetCounts(
  sessionLength: "short" | "standard",
  predicateCount: number
): TargetCount {
  const phase1 = sessionLength === "short" ? 1 : 2;
  const phase3 = sessionLength === "short" ? 2 : 3;
  const phase4 = 1;
  const phase5 = 1;

  const phase2 = Math.min(Math.max(predicateCount, MIN_PHASE2), MAX_PHASE2);
  return { phase1, phase2, phase3, phase4, phase5 };
}

// 固定题库在代码层选好，避免 LLM 随机挑到过难的题
function pickBank(sessionLength: "short" | "standard") {
  const counts = targetCounts(sessionLength, 100);
  return {
    phase1: pickProgressive(ADMISSIONS_WARMUP, counts.phase1),
    phase3: pickProgressive(ADMISSIONS_LITERACY, counts.phase3),
    phase4: pickProgressive(ADMISSIONS_FIT_TEMPLATES, 1)[0],
    phase5: pickProgressive(ADMISSIONS_WRAPUP, 1)[0],
  };
}

function adaptationMap(raw: unknown): Map<string, string> {
  const map = new Map<string, string>();
  const list =
    raw && typeof raw === "object" && Array.isArray((raw as { bank_adaptations?: unknown }).bank_adaptations)
      ? ((raw as { bank_adaptations: unknown[] }).bank_adaptations)
      : [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const entry = item as { question_id?: unknown; question_text?: unknown };
    if (
      typeof entry.question_id === "string" &&
      typeof entry.question_text === "string" &&
      entry.question_text.trim().length > 0
    ) {
      map.set(entry.question_id, entry.question_text.replace(/\s+/g, " ").trim());
    }
  }
  return map;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const persona: string = PERSONAS.has(body.persona) ? body.persona : "poker";
    const sessionLength: "short" | "standard" =
      body.session_length === "short" ? "short" : "standard";

    const document: ClaimDocument | undefined = body.document;
    if (!document || !Array.isArray(document.claims) || document.claims.length === 0) {
      return NextResponse.json(
        { error: "document.claims must be a non-empty array" },
        { status: 400 }
      );
    }

    const predicates = flattenPredicates(document);
    if (predicates.length === 0) {
      return NextResponse.json({ error: "No usable propositions" }, { status: 400 });
    }

    // 目标项目 = 留学侧的「JD」。缺失时退化为泛化提问，绝不让模型编造项目名/导师名
    const program = body.target_program ?? {};
    const targetProgram = {
      school: typeof program.school === "string" ? program.school.trim() : "",
      program: typeof program.program === "string" ? program.program.trim() : "",
      field: typeof program.field === "string" ? program.field.trim() : "",
      supervisor:
        typeof program.supervisor === "string" ? program.supervisor.trim() : "",
    };
    const hasProgram = !!(targetProgram.school || targetProgram.program);

    const counts = targetCounts(sessionLength, predicates.length);
    const bank = pickBank(sessionLength);

    const rubric = readRubricSection("question_generate_v2");

    const system = [
      rubric,
      "",
      "This call also adapts a fixed question bank, which is outside the rubric above.",
      "- The `questions` array is governed by the rubric and keeps the output format stated there.",
      "- Bank items are not derived from a proposition, so none of the proposition fields apply to them. Return their persona-adapted wording in `bank_adaptations`, one entry per question_id, without changing intent.",
      "- Return one JSON object with both keys and nothing else.",
    ].join("\n");

    const bankItem = (q: BankQuestion, questionId: string) => ({
      question_id: questionId,
      base_question: q.base_question,
      category: q.category,
      intent: q.intent,
    });

    const user = [
      `Interviewer persona: ${persona}`,
      `Session length: ${sessionLength}`,
      "",
      `// Target program (this track's "job description")`,
      JSON.stringify(targetProgram, null, 2),
      hasProgram
        ? `Use it in Phase ④.`
        : `Not provided: keep Phase ④ generic and invent nothing.`,
      "",
      `// Propositions (JSON) — every entry in \`questions\` targets exactly one of these`,
      JSON.stringify(
        predicates.map((p) => ({
          predicate_id: p.predicate_id,
          predicate_text: p.predicate_text,
          source_quote: p.source_quote,
          check_worthiness: p.check_worthiness,
          probe_types: p.probe_types,
          claim_id: p.claim_id,
        })),
        null,
        2
      ),
      "",
      `Target: ${counts.phase2} questions in \`questions\` (1–3 per proposition, no more than 12 total). Cover the high check_worthiness propositions before the rest.`,
      "",
      `// Fixed bank — Phase ① Motivation & Background`,
      JSON.stringify(
        bank.phase1.map((q) => bankItem(q, `bank:a1:${q.category.replace(/\s+/g, "-")}`)),
        null,
        2
      ),
      "",
      `// Fixed bank — Phase ③ Field & Research Literacy`,
      JSON.stringify(
        bank.phase3.map((q) => bankItem(q, `bank:a3:${q.category.replace(/\s+/g, "-")}`)),
        null,
        2
      ),
      "",
      `// Fixed bank — Phase ④ Program Fit template. Replace [PROGRAM] with the target programme above.`,
      JSON.stringify(
        {
          ...bankItem(bank.phase4, `bank:a4:${bank.phase4.category.replace(/\s+/g, "-")}`),
          variation_hint: bank.phase4.variation_hint,
        },
        null,
        2
      ),
      "",
      `// Fixed bank — Phase ⑤ Wrap-up`,
      JSON.stringify(
        bankItem(bank.phase5, `bank:a5:${bank.phase5.category.replace(/\s+/g, "-")}`),
        null,
        2
      ),
    ].join("\n");

    const out = await chatJSON<{ questions?: unknown; bank_adaptations?: unknown }>({
      system,
      user,
      maxTokens: 3000,
    });

    const generated = cleanGeneratedQuestions(out, predicates, counts.phase2);
    if (generated.length === 0) {
      throw new Error("No proposition-based question survived validation");
    }

    const adapted = adaptationMap(out);
    const predById = new Map(predicates.map((p) => [p.predicate_id, p]));

    const phase2 = generated.map((q: InterviewQuestion) => {
      const pred = predById.get(q.target_predicate_id)!;
      return {
        question_id: q.question_id,
        claim_id: pred.claim_id,
        predicate_id: q.target_predicate_id,
        question: q.question_text,
        intent: pred.predicate_text,
        followup_focus: "",
        probe_type: q.probe_type,
        bloom_level: q.bloom_level,
        expected_depth: q.expected_depth,
        source_quote: q.source_quote,
        is_resume_customized: true,
      };
    });

    const fromBank = (q: BankQuestion, questionId: string) => ({
      question_id: questionId,
      claim_id: null,
      predicate_id: null,
      question: adapted.get(questionId) ?? q.base_question,
      intent: q.intent,
      followup_focus: q.followup_focus,
      probe_type: null,
      bloom_level: null,
      expected_depth: null,
      source_quote: null,
      is_resume_customized: false,
    });

    const phase4Id = `bank:a4:${bank.phase4.category.replace(/\s+/g, "-")}`;
    const phase4Question = (adapted.get(phase4Id) ?? bank.phase4.base_question).replace(
      /\[PROGRAM\]/g,
      targetProgram.program || "the programme you are applying to"
    );

    const phases = [
      {
        phase: 1,
        name: "Motivation & Background",
        transition_in: null,
        transition_out: null,
        source: "bank",
        questions: bank.phase1.map((q) =>
          fromBank(q, `bank:a1:${q.category.replace(/\s+/g, "-")}`)
        ),
      },
      {
        phase: 2,
        name: "Statement Deep Dive",
        transition_in: null,
        transition_out: null,
        source: "ai_from_resume",
        questions: phase2,
      },
      {
        phase: 3,
        name: "Field & Research Literacy",
        transition_in: null,
        transition_out: null,
        source: "bank",
        questions: bank.phase3.map((q) =>
          fromBank(q, `bank:a3:${q.category.replace(/\s+/g, "-")}`)
        ),
      },
      {
        phase: 4,
        name: "Program Fit & Future Plan",
        transition_in: null,
        transition_out: null,
        source: "bank",
        questions: [{ ...fromBank(bank.phase4, phase4Id), question: phase4Question }],
      },
      {
        phase: 5,
        name: "Wrap-up",
        transition_in: null,
        transition_out: null,
        source: "bank",
        questions: [fromBank(bank.phase5, `bank:a5:${bank.phase5.category.replace(/\s+/g, "-")}`)],
      },
    ];

    const totalQ = phases.reduce((sum, p) => sum + p.questions.length, 0);

    return NextResponse.json({
      session: {
        track: "admissions",
        persona,
        session_length: sessionLength,
        total_questions: totalQ,
        target_program: targetProgram,
      },
      phases,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Question generation failed. ${msg}` },
      { status: 502 }
    );
  }
}
