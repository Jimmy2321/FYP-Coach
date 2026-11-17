import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/llm";
import { readRubricSection } from "@/lib/rubrics";
import { PROBE_TYPES, type FollowupResult, type Predicate, type ProbeType, type QAExchange } from "@/lib/types";
import { similarity } from "@/lib/question-generation";

export const runtime = "nodejs";

// 硬约束（代码强制）：单条话题追问深度上限
const MAX_DEPTH = 3;
const PERSONAS = new Set(["supportive", "poker", "challenger"]);

// 达到深度上限/Phase ⑤ 时的强制收尾话术（按人格区分）
const FORCED_MOVE_ON_ACK: Record<string, string> = {
  supportive: "That's a thoughtful answer — let's move on.",
  poker: "OK. Next.",
  challenger: "Fair enough. Let's try something else.",
};

const WRAPUP_PHASE_CLOSING: Record<string, string> = {
  supportive: "Thanks for your answers — good luck today!",
  poker: "Alright, I think that's a wrap.",
  challenger: "We're done here.",
};

// 候选人反问时，先给答复再收尾；与上一组一样保持在 10 词以内
const WRAPUP_ANSWER_CLOSING: Record<string, string> = {
  supportive: "Good question — that's covered at offer stage. Good luck!",
  poker: "That's covered at the offer stage. We're done.",
  challenger: "It's on the job page. We're done here.",
};

// termination_reason 的三种合法形式
const TERMINATION_TURN_CAP = "The turn cap is reached.";
const TERMINATION_COVERED = "Every declared direction for the proposition is covered.";
const TERMINATION_CANNOT_ANSWER =
  "The candidate cannot answer and prompting does not help.";

/** 硬规则 4：只放行三种合法形式，模型换说法时归一到最接近的一种 */
function normalizeTermination(reason: string): string {
  const value = reason.trim();
  if (
    value === TERMINATION_TURN_CAP ||
    value === TERMINATION_COVERED ||
    value === TERMINATION_CANNOT_ANSWER
  ) {
    return value;
  }

  const lower = value.toLowerCase();
  if (lower.includes("turn cap") || lower.includes("cap reached") || lower.includes("maximum")) {
    return TERMINATION_TURN_CAP;
  }
  if (
    lower.includes("cannot answer") ||
    lower.includes("can't answer") ||
    lower.includes("unable to answer") ||
    lower.includes("cannot respond")
  ) {
    return TERMINATION_CANNOT_ANSWER;
  }
  return TERMINATION_COVERED;
}

// 两条 track 共用同一个追问引擎（同一份 rubric、同一个深度上限），
// 只有 Phase 语义和取证对象不同 —— 这是 job / admissions 共享评估逻辑的入口
const PHASE_NAMES: Record<string, string[]> = {
  job: ["Warmup", "Resume Deep Dive", "Core Fundamentals", "System Design", "Wrap-up"],
  admissions: [
    "Motivation & Background",
    "Statement Deep Dive",
    "Field & Research Literacy",
    "Program Fit & Future Plan",
    "Wrap-up",
  ],
};

function limitWords(text: string, max: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return words.slice(0, max).join(" ");
}

function limitQuestion(text: string): string {
  const question = text.replace(/\s+/g, " ").trim();
  if (question.length <= 150) return question;
  const cut = question.slice(0, 150);
  const lastSpace = cut.lastIndexOf(" ");
  const body = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,.!?;:]+$/, "");
  return `${body}?`;
}

/** 一个追问只保留一个问句：多余的问号或 ", and what/how…" 并列的第二问一律丢弃 */
function singleQuestion(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();

  const firstMark = compact.indexOf("?");
  if (firstMark >= 0 && compact.indexOf("?", firstMark + 1) >= 0) {
    return compact.slice(0, firstMark + 1);
  }

  const joined = compact.match(
    /^(.*?),?\s+and\s+(?:what|how|why|which|when|where|who|do|does|did|is|are|was|were|can|could|would|should)\b/i
  );
  if (joined) {
    return `${joined[1].replace(/[,.!?;:]+$/, "")}?`;
  }

  return compact;
}

function readPredicate(raw: unknown): Predicate | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.predicate_id !== "string" || p.predicate_id.length === 0) return null;

  const probeTypes = Array.isArray(p.probe_types)
    ? (p.probe_types.filter(
        (t): t is ProbeType =>
          typeof t === "string" && (PROBE_TYPES as readonly string[]).includes(t)
      ) as ProbeType[])
    : [];

  return {
    predicate_id: p.predicate_id,
    predicate_text: typeof p.predicate_text === "string" ? p.predicate_text : "",
    source_quote: typeof p.source_quote === "string" ? p.source_quote : "",
    check_worthiness:
      p.check_worthiness === "high" || p.check_worthiness === "low"
        ? p.check_worthiness
        : "medium",
    probe_types: probeTypes,
  };
}

function terminate(
  preview: string,
  terminationReason: string,
  predicate: Predicate | null
) {
  return NextResponse.json({
    trigger_reason: "",
    response_preview: limitWords(preview, 10),
    transition: "",
    followup_question: "",
    justification: predicate
      ? `No further probe on ${predicate.predicate_id}.`
      : "No further probe on this question.",
    is_termination: true,
    termination_reason: terminationReason,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { current_question, answer } = body;
    const depth = Number.isInteger(body.depth) ? body.depth : 0;
    const persona: string = PERSONAS.has(body.persona) ? body.persona : "poker";
    const track: string = body.track === "admissions" ? "admissions" : "job";
    const predicate = readPredicate(body.predicate);

    const history: QAExchange[] = Array.isArray(body.history)
      ? body.history.filter(
          (h: QAExchange) =>
            h && typeof h.question === "string" && typeof h.answer === "string"
        )
      : [];

    const phase =
      typeof body.phase === "number" && body.phase >= 1 && body.phase <= 5
        ? body.phase
        : 2;
    const followup_focus: string =
      typeof body.followup_focus === "string" && body.followup_focus.trim().length > 0
        ? body.followup_focus.trim()
        : "";

    // 上一题已经探过的方向：追问必须落到没探过的层级
    const probedDirection =
      typeof body.probe_type === "string" &&
      (PROBE_TYPES as readonly string[]).includes(body.probe_type)
        ? (body.probe_type as ProbeType)
        : null;
    const expectedDepth =
      body.expected_depth === 1 || body.expected_depth === 2 || body.expected_depth === 3
        ? body.expected_depth
        : null;

    if (typeof answer !== "string" || answer.trim().length === 0) {
      return NextResponse.json({ error: "answer is required" }, { status: 400 });
    }

    // Phase ⑤ Wrap-up：候选人反问 → 简短答复后收尾；说没了 → 直接收尾
    if (phase === 5) {
      const hasCandidateQuestion =
        /\?|what about you|do (you|they)|is there|how does/i.test(answer);

      if (hasCandidateQuestion) {
        return terminate(WRAPUP_ANSWER_CLOSING[persona], TERMINATION_TURN_CAP, predicate);
      }
      return terminate(WRAPUP_PHASE_CLOSING[persona], TERMINATION_TURN_CAP, predicate);
    }

    // 深度上限：不问模型，直接强制换题，避免流程死锁
    if (depth >= MAX_DEPTH) {
      return terminate(FORCED_MOVE_ON_ACK[persona], TERMINATION_TURN_CAP, predicate);
    }

    const rubric = readRubricSection("followup_engine_v3");
    const system = `${rubric}\n\nFollow the rubric exactly and output valid JSON only.`;

    const user = [
      `Interviewer persona: ${persona}`,
      `Current phase: Phase ${phase} — ${PHASE_NAMES[track][phase - 1]}`,
      `Follow-ups already asked on this topic: ${depth} (max ${MAX_DEPTH})`,
      probedDirection
        ? `Direction already probed by that question: ${probedDirection}${
            expectedDepth ? ` (expected_depth ${expectedDepth})` : ""
          }`
        : "",
      "",
      predicate
        ? `Proposition under discussion (JSON):\n${JSON.stringify(
            {
              predicate_id: predicate.predicate_id,
              predicate_text: predicate.predicate_text,
              source_quote: predicate.source_quote,
              probe_types: predicate.probe_types,
              check_worthiness: predicate.check_worthiness,
            },
            null,
            2
          )}`
        : "No proposition — this is a fixed-bank question.",
      followup_focus ? `\nExplicit followup_focus from question bank:\n${followup_focus}` : "",
      `\nQuestion the candidate just answered:\n"""\n${current_question || ""}\n"""`,
      "",
      `Previous Q&A on this topic (JSON):\n${JSON.stringify(history, null, 2)}`,
      "",
      `Candidate's latest answer:\n"""\n${answer}\n"""`,
    ].join("\n");

    const out = await chatJSON<Partial<FollowupResult>>({ system, user, maxTokens: 1024 });

    if (out.is_termination === true) {
      const reason =
        typeof out.termination_reason === "string" && out.termination_reason.trim().length > 0
          ? normalizeTermination(out.termination_reason)
          : TERMINATION_COVERED;
      const preview =
        typeof out.response_preview === "string" && out.response_preview.trim().length > 0
          ? out.response_preview.trim()
          : FORCED_MOVE_ON_ACK[persona];
      return terminate(preview, reason, predicate);
    }

    const question =
      typeof out.followup_question === "string" ? out.followup_question.trim() : "";
    if (!question) {
      return terminate(FORCED_MOVE_ON_ACK[persona], TERMINATION_COVERED, predicate);
    }

    // 硬规则 5：与同一条链上问过的问题相似度过高，等于重复提问，直接收尾
    const earlier = [current_question, ...history.map((h) => h.question)].filter(
      (q): q is string => typeof q === "string" && q.length > 0
    );
    if (earlier.some((q) => similarity(q, question) >= 0.8)) {
      return terminate(FORCED_MOVE_ON_ACK[persona], TERMINATION_COVERED, predicate);
    }

    // 硬规则 3：justification 必须点明所服务的命题
    let justification =
      typeof out.justification === "string" ? out.justification.trim() : "";
    if (predicate && !justification.includes(predicate.predicate_id)) {
      justification = justification
        ? `${justification} Probes ${predicate.predicate_id}.`
        : `Probes ${predicate.predicate_id}.`;
    }

    const preview =
      typeof out.response_preview === "string" && out.response_preview.trim().length > 0
        ? out.response_preview.trim()
        : "I see.";

    return NextResponse.json({
      trigger_reason:
        typeof out.trigger_reason === "string" ? out.trigger_reason.trim() : "",
      response_preview: limitWords(preview, 10),
      transition: typeof out.transition === "string" ? out.transition.trim() : "",
      followup_question: limitQuestion(singleQuestion(question)),
      justification,
      is_termination: false,
      termination_reason: "",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Follow-up generation failed. ${msg}` },
      { status: 502 }
    );
  }
}
