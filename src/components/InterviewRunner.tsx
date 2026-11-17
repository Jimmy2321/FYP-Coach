"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import type {
  BloomLevel,
  ClaimDocument,
  ExpectedDepth,
  Predicate,
  ProbeType,
  QAExchange,
  SessionIndexEntry,
  SessionReportInput,
  SessionResponse,
} from "@/lib/types";
import {
  ADMISSIONS_WARMUP,
  ADMISSIONS_LITERACY,
  ADMISSIONS_FIT_TEMPLATES,
  ADMISSIONS_WRAPUP,
} from "@/lib/admissions-bank";

export type RunnerTrack = "job" | "admissions";

// ===== 共享数据结构（两条 track 的 generate API 输出完全一致） =====

export type PhaseQuestion = {
  question_id: string;
  claim_id: string | null;
  question: string;
  intent: string;
  followup_focus: string;
  is_resume_customized: boolean;
  // 命题派生题带以下字段；固定题库题没有对应命题，因此可以为空
  predicate_id?: string | null;
  probe_type?: ProbeType | null;
  bloom_level?: BloomLevel | null;
  expected_depth?: ExpectedDepth | null;
  source_quote?: string | null;
};

export type InterviewPhase = {
  phase: 1 | 2 | 3 | 4 | 5;
  name: string | null;
  transition_in: string | null;
  transition_out: string | null;
  source: "bank" | "ai_from_resume";
  questions: PhaseQuestion[];
};

type SessionMeta = {
  persona: string;
  session_length: "short" | "standard";
  total_questions: number;
  target_program?: {
    school: string;
    program: string;
    field: string;
    supervisor: string;
  };
};

type Turn = {
  id: string;
  role: "interviewer" | "candidate" | "system"; // system = phase transition / ack
  content: string;
  depth: number;
  phase: number;
  timestamp: number;
};

type Persona = "supportive" | "poker" | "challenger";

const PERSONA_META: Record<Persona, { label: string; desc: string; avatar: string }> = {
  supportive: { label: "Supportive", desc: "Warm and encouraging", avatar: "/images/persona-supportive-btn.jpg" },
  poker: { label: "Poker Face", desc: "Neutral, brisk, gives nothing away", avatar: "/images/persona-poker-btn.jpg" },
  challenger: { label: "Challenger", desc: "Prods every weak spot", avatar: "/images/persona-challenger-btn.jpg" },
};

// ===== 无 claims 时的兜底题库（job / admissions 各一套） =====

const JOB_FALLBACK: InterviewPhase[] = [
  {
    phase: 1,
    name: "Warmup & Behavioral",
    transition_in: null,
    transition_out: null,
    source: "bank",
    questions: [
      {
        question_id: "bank:p1:STAR",
        claim_id: null,
        question:
          "Walk me through a project or experience where you faced a genuinely difficult technical challenge. What was the situation, what did you do, and how did it turn out?",
        intent: "Assess STAR completeness",
        followup_focus: "STAR components missing: Situation / Task / Action (owned, not team) / Result (quantified) / Reflection",
        is_resume_customized: false,
      },
    ],
  },
  {
    phase: 2,
    name: "Resume Deep Dive",
    transition_in: null,
    transition_out: null,
    source: "ai_from_resume",
    questions: [
      {
        question_id: "fb:c1",
        claim_id: null,
        question:
          "You mentioned Redis — how have you actually used it? Walk me through a specific implementation.",
        intent: "Verify Redis practical experience",
        followup_focus: "Missing WHY — alternatives, trade-offs. Missing implementation details.",
        is_resume_customized: true,
      },
      {
        question_id: "fb:c2",
        claim_id: null,
        question:
          "Tell me about a time your API was slow and you fixed it — what was the root cause?",
        intent: "Assess debugging methodology",
        followup_focus: "Did they measure anything? What was the actual bottleneck? What tools did they use?",
        is_resume_customized: true,
      },
    ],
  },
  {
    phase: 3,
    name: "Core CS Fundamentals",
    transition_in: null,
    transition_out: null,
    source: "bank",
    questions: [
      {
        question_id: "bank:p3:concurrency",
        claim_id: null,
        question:
          "What's the difference between a thread, a process, and async code? When do you pick one over the other?",
        intent: "Assess concurrency fundamentals",
        followup_focus: "Can they explain the trade-off between shared-memory threads vs message-passing processes?",
        is_resume_customized: false,
      },
      {
        question_id: "bank:p3:database",
        claim_id: null,
        question:
          "Your query on a 10M-row table is taking 4 seconds — what's your debugging approach?",
        intent: "Assess query optimization methodology",
        followup_focus: "Do they start with EXPLAIN? Do they check for missing indexes or N+1 queries?",
        is_resume_customized: false,
      },
    ],
  },
  {
    phase: 4,
    name: "System Design",
    transition_in: null,
    transition_out: null,
    source: "bank",
    questions: [
      {
        question_id: "bank:p4:architecture",
        claim_id: null,
        question:
          "Suppose you're building a service that handles 10,000 concurrent users ordering food. Walk me through your architecture — components, bottlenecks, and how you'd scale if traffic doubled.",
        intent: "Assess architectural thinking under scale",
        followup_focus: "Can they identify the REAL bottleneck under 2x load? Do they describe failure modes?",
        is_resume_customized: false,
      },
    ],
  },
  {
    phase: 5,
    name: "Wrap-up",
    transition_in: null,
    transition_out: null,
    source: "bank",
    questions: [
      {
        question_id: "bank:p5:wrapup",
        claim_id: null,
        question: "Alright — do you have any questions for me?",
        intent: "Candidate turns the tables",
        followup_focus: "What questions do they ask? Do they show curiosity?",
        is_resume_customized: false,
      },
    ],
  },
];

function toPhase(
  phase: 1 | 3 | 4 | 5,
  name: string,
  questions: PhaseQuestion[]
): InterviewPhase {
  return { phase, name, transition_in: null, transition_out: null, source: "bank", questions };
}

const ADMISSIONS_FALLBACK: InterviewPhase[] = [
  toPhase(
    1,
    "Motivation & Background",
    ADMISSIONS_WARMUP.slice(0, 2).map((q) => ({
      question_id: `bank:a1:${q.category.replace(/\s+/g, "-")}`,
      claim_id: null,
      question: q.base_question,
      intent: q.intent,
      followup_focus: q.followup_focus,
      is_resume_customized: false,
    }))
  ),
  toPhase(
    3,
    "Field & Research Literacy",
    ADMISSIONS_LITERACY.slice(0, 2).map((q) => ({
      question_id: `bank:a3:${q.category.replace(/\s+/g, "-")}`,
      claim_id: null,
      question: q.base_question,
      intent: q.intent,
      followup_focus: q.followup_focus,
      is_resume_customized: false,
    }))
  ),
  toPhase(4, "Program Fit & Future Plan", [
    {
      question_id: "bank:a4:fallback",
      claim_id: null,
      question: ADMISSIONS_FIT_TEMPLATES[1].base_question.replace("[PROGRAM]", "this programme"),
      intent: ADMISSIONS_FIT_TEMPLATES[1].intent,
      followup_focus: ADMISSIONS_FIT_TEMPLATES[1].followup_focus,
      is_resume_customized: false,
    },
  ]),
  toPhase(5, "Wrap-up", [
    {
      question_id: `bank:a5:${ADMISSIONS_WRAPUP[0].category.replace(/\s+/g, "-")}`,
      claim_id: null,
      question: ADMISSIONS_WRAPUP[0].base_question,
      intent: ADMISSIONS_WRAPUP[0].intent,
      followup_focus: ADMISSIONS_WRAPUP[0].followup_focus,
      is_resume_customized: false,
    },
  ]),
];

// ===== 每条 track 只差数据来源与 API 前缀，状态机完全共用 =====

type TrackConfig = {
  title: string;
  loadingHint: string;
  generateUrl: string;
  claimsKey: string;
  programKey?: string;
  exitUrl: string;
  /** 无 sessionStorage 数据时的去向；有则用兜底题库继续 */
  setupUrl?: string;
  fallback: InterviewPhase[];
};

const TRACK_CONFIG: Record<RunnerTrack, TrackConfig> = {
  job: {
    title: "Technical Interview",
    loadingHint: "Warmup → Resume → Fundamentals → System Design → Wrap-up",
    generateUrl: "/api/interview/generate",
    claimsKey: "ir_selected_claims",
    exitUrl: "/",
    fallback: JOB_FALLBACK,
  },
  admissions: {
    title: "Admissions Interview",
    loadingHint: "Motivation → Statement → Research Literacy → Program Fit → Wrap-up",
    generateUrl: "/api/admissions/generate",
    claimsKey: "sa_selected_claims",
    programKey: "sa_target_program",
    exitUrl: "/study-abroad",
    setupUrl: "/study-abroad/interview",
    fallback: ADMISSIONS_FALLBACK,
  },
};

export default function InterviewRunner({ track }: { track: RunnerTrack }) {
  const config = TRACK_CONFIG[track];
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState<Persona>("poker");
  const [status, setStatus] = useState<"loading" | "idle" | "thinking" | "ended">("loading");
  const [phases, setPhases] = useState<InterviewPhase[]>([]);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [depth, setDepth] = useState(0);
  const [history, setHistory] = useState<QAExchange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"text" | "voice">("text");
  const [confirmExit, setConfirmExit] = useState(false);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const responsesRef = useRef<SessionResponse[]>([]);
  const reportSavedRef = useRef(false);
  const predicateMapRef = useRef<Map<string, Predicate>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // ===== 当前话题的便捷访问 =====
  const currentPhase = phases[phaseIdx];
  const currentQ = currentPhase?.questions[qIdx];
  const isLastQOfPhase = currentPhase ? qIdx === currentPhase.questions.length - 1 : false;
  const isLastPhase = phaseIdx === phases.length - 1;
  const totalQ = phases.reduce((sum, p) => sum + p.questions.length, 0);
  const absoluteQ = useMemo(
    () => phases.slice(0, phaseIdx).reduce((sum, p) => sum + p.questions.length, 0) + qIdx + 1,
    [phaseIdx, qIdx, phases]
  );

  // ===== 初始化 =====
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const push = (turn: Omit<Turn, "id" | "timestamp">) =>
      setTurns((prev) => [
        ...prev,
        { ...turn, id: `${turn.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
      ]);

    const initFromPhases = (ps: InterviewPhase[], personaUsed: string, totalQVal: number, meta?: Partial<SessionMeta>) => {
      setPhases(ps);
      setPhaseIdx(0);
      setQIdx(0);
      setDepth(0);
      setSessionMeta({ persona: personaUsed, session_length: "standard", total_questions: totalQVal, ...meta });
      // 直接出第一题，不加 transition_in 话术
      const firstPhase = ps[0];
      push({ role: "interviewer", content: firstPhase.questions[0].question, depth: 0, phase: firstPhase.phase });
      setStatus("idle");
    };

    const init = async () => {
      let doc: ClaimDocument | null = null;
      try {
        const raw = sessionStorage.getItem(config.claimsKey);
        if (raw) {
          const parsed = JSON.parse(raw) as ClaimDocument;
          if (parsed && Array.isArray(parsed.claims)) doc = parsed;
        }
      } catch { /* ignore */ }

      if (!doc || doc.claims.length === 0) {
        if (config.setupUrl) {
          router.replace(config.setupUrl);
          return;
        }
        initFromPhases(config.fallback, "poker", config.fallback.reduce((s, p) => s + p.questions.length, 0));
        return;
      }

      predicateMapRef.current = new Map(
        doc.claims.flatMap((c) =>
          c.predicates.map((p) => [p.predicate_id, p] as const)
        )
      );

      let targetProgram: SessionMeta["target_program"] | undefined;
      if (config.programKey) {
        try {
          const raw = sessionStorage.getItem(config.programKey);
          if (raw) targetProgram = JSON.parse(raw);
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch(config.generateUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: doc, persona: "poker", session_length: "standard", target_program: targetProgram }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        initFromPhases(
          data.phases,
          data.session?.persona || "poker",
          data.session?.total_questions || 0,
          data.session?.target_program ? { target_program: data.session.target_program } : undefined
        );
      } catch (e) {
        setError(`Couldn't generate questions — using built-in practice questions instead. (${e instanceof Error ? e.message : "unknown error"})`);
        initFromPhases(config.fallback, "poker", config.fallback.reduce((s, p) => s + p.questions.length, 0));
      }
    };
    init();
  }, [config, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, status]);

  // 面试结束 → 落盘本次会话，报告页从 sessionStorage 读取
  useEffect(() => {
    if (status !== "ended" || reportSavedRef.current || responsesRef.current.length === 0) {
      return;
    }
    reportSavedRef.current = true;

    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const payload: SessionReportInput = {
      session_id: id,
      track,
      persona: sessionMeta?.persona ?? persona,
      completed_at: new Date().toISOString(),
      session_length: sessionMeta?.session_length ?? "standard",
      total_questions: totalQ,
      responses: responsesRef.current,
    };

    try {
      sessionStorage.setItem(`report_${id}`, JSON.stringify(payload));

      // 索引供历史页读取；档位汇总在报告页完成评分后回写
      const entry: SessionIndexEntry = {
        session_id: id,
        track,
        persona: payload.persona,
        completed_at: payload.completed_at,
        total_questions: totalQ,
      };
      let index: SessionIndexEntry[] = [];
      try {
        const raw = sessionStorage.getItem("report_index");
        const parsed = raw ? (JSON.parse(raw) as SessionIndexEntry[]) : [];
        if (Array.isArray(parsed)) index = parsed;
      } catch { /* 索引损坏时重建 */ }
      const next = [entry, ...index.filter((e) => e.session_id !== id)].slice(0, 20);
      sessionStorage.setItem("report_index", JSON.stringify(next));

      setReportId(id);
    } catch {
      setError("Couldn't save this session, so the report is unavailable.");
    }
  }, [status, track, persona, sessionMeta, totalQ]);

  // ===== 换题逻辑（phase-aware） =====
  const moveToNext = (ackText: string) => {
    const push = (turn: Omit<Turn, "id" | "timestamp">) =>
      setTurns((prev) => [
        ...prev,
        { ...turn, id: `${turn.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
      ]);

    push({ role: "interviewer", content: ackText, depth: 0, phase: currentPhase?.phase ?? 1 });
    setHistory([]);
    setDepth(0);

    const isLast = isLastQOfPhase;
    if (!isLast) {
      // 当前 phase 还有下一题
      const nextQIdx = qIdx + 1;
      setQIdx(nextQIdx);
      setTimeout(() => {
        const nextQ = currentPhase!.questions[nextQIdx];
        push({ role: "interviewer", content: nextQ.question, depth: 0, phase: currentPhase!.phase });
        setStatus("idle");
      }, 800);
      return;
    }

    // 当前 phase 最后一题 → 看是不是整个 session 最后一题
    if (isLastPhase) {
      setStatus("ended");
      return;
    }

    // 切到下一个 phase（内部 phase 对用户透明）
    const nextPhaseIdx = phaseIdx + 1;
    const nextPhase = phases[nextPhaseIdx];
    setPhaseIdx(nextPhaseIdx);
    setQIdx(0);
    setTimeout(() => {
      push({ role: "interviewer", content: nextPhase.questions[0].question, depth: 0, phase: nextPhase.phase });
      setStatus("idle");
    }, 600);
  };

  // ===== 提交答案 =====
  const submitAnswer = async () => {
    if (!input.trim() || status !== "idle" || !currentQ) return;
    const answer = input.trim();
    const push = (turn: Omit<Turn, "id" | "timestamp">) =>
      setTurns((prev) => [
        ...prev,
        { ...turn, id: `${turn.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
      ]);

    push({ role: "candidate", content: answer, depth, phase: currentPhase?.phase ?? 1 });
    setInput("");
    setStatus("thinking");

    // 从 turns 里找最后一条 interviewer 消息作为 current_question
    let asked = "";
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].role === "interviewer") {
        asked = turns[i].content;
        break;
      }
    }
    if (!asked) asked = currentQ.question;

    // 记录作答：depth 0 是主题目，depth > 0 归入同一题目的追问
    if (depth === 0) {
      responsesRef.current.push({
        question_id: currentQ.question_id,
        question: currentQ.question,
        answer,
        followups: [],
        phase: currentPhase?.phase ?? 1,
        predicate_id: currentQ.predicate_id ?? null,
        probe_type: currentQ.probe_type ?? null,
        expected_depth: currentQ.expected_depth ?? null,
      });
    } else {
      const last = responsesRef.current[responsesRef.current.length - 1];
      if (last) last.followups.push({ question: asked, answer });
    }

    const predicate = currentQ.predicate_id
      ? predicateMapRef.current.get(currentQ.predicate_id)
      : undefined;

    try {
      const res = await fetch("/api/interview/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          phase: currentPhase?.phase ?? 2,
          predicate: predicate ?? null,
          probe_type: currentQ.probe_type ?? null,
          expected_depth: currentQ.expected_depth ?? null,
          followup_focus: currentQ.followup_focus || "",
          current_question: asked,
          answer,
          history,
          depth,
          persona,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      if (!data.is_termination && data.followup_question) {
        const content = data.response_preview
          ? `${data.response_preview} ${data.followup_question}`
          : data.followup_question;
        push({ role: "interviewer", content, depth: depth + 1, phase: currentPhase?.phase ?? 1 });
        setDepth((d) => d + 1);
        setHistory((h) => [...h, { question: asked, answer }]);
        setStatus("idle");
      } else {
        moveToNext(data.response_preview || "OK, let's move on.");
      }
    } catch (e) {
      setError(`Follow-up request failed (${e instanceof Error ? e.message : "unknown error"}) — moving on.`);
      moveToNext("Let's move on.");
    }
  };

  // ===== UI =====
  const interviewerAvatar = (
    <div className="avatar-gradient-ring shrink-0 self-start">
      <img src={PERSONA_META[persona].avatar} alt="" className="w-9 h-9 object-cover" />
    </div>
  );

  const targetProgram = sessionMeta?.target_program;
  const targetLabel = targetProgram
    ? [targetProgram.program, targetProgram.school].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="animate-fadeUp">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-navy-100">
        <div>
          <div className="eyebrow mb-1.5">Live Session</div>
          <h1 className="font-display text-3xl text-navy-950 mb-1">{config.title}</h1>
          <p className="text-sm text-navy-500">
            {phases.length > 0
              ? `${totalQ} questions · Question ${absoluteQ}/${totalQ} · Follow-up depth ${depth}/3`
              : "Preparing your interview…"}
          </p>
          {targetLabel && (
            <p className="text-xs text-navy-400 mt-1">Target: {targetLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(["supportive", "poker", "challenger"] as Persona[]).map((p) => (
            <button
              key={p}
              onClick={() => setPersona(p)}
              className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                persona === p
                  ? "bg-navy-800 text-cream border-navy-800"
                  : "bg-white text-navy-600 border-navy-200 hover:border-navy-400"
              }`}
              title={PERSONA_META[p].desc}
            >
              <img src={PERSONA_META[p].avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-navy-200" />
              {PERSONA_META[p].label}
            </button>
          ))}
          <div className="w-px h-7 bg-navy-100 mx-1" />
          <button
            onClick={() => setConfirmExit(true)}
            disabled={status === "loading" || status === "ended"}
            className="text-xs px-3 py-2 rounded-lg border border-coral-200 text-coral-600 bg-white hover:bg-coral-50 hover:border-coral-400 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Quit this interview session"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Exit
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 animate-fadeUp">
          <Icon name="alert" size={14} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-amber-600 hover:text-amber-900 font-medium">×</button>
        </div>
      )}

      {/* Chat Area */}
      <div ref={scrollRef} className="h-[480px] overflow-y-auto scrollbar-thin bg-white rounded-2xl border border-navy-100 p-6 mb-4">
        {status === "loading" && turns.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fadeUp">
            <div className="w-12 h-12 rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-600 mb-4">
              <span className="w-5 h-5 rounded-full border-2 border-navy-200 border-t-navy-700 animate-spin" />
            </div>
            <div className="font-medium text-navy-800 text-sm mb-1">Building your interview session…</div>
            <div className="text-xs text-navy-400">{config.loadingHint}</div>
          </div>
        )}

        {turns.filter((t) => t.role !== "system").map((t, i) => {
          return (
            <div key={t.id} className={`mb-5 flex items-start gap-3 ${t.role === "candidate" ? "flex-row-reverse" : ""} animate-fadeUp`} style={{ animationDelay: `${i * 20}ms` }}>
              {t.role === "interviewer" ? interviewerAvatar : (
                <div className="w-9 h-9 rounded-full bg-coral-500 text-white flex items-center justify-center shrink-0">
                  <Icon name="user" size={16} />
                </div>
              )}
              <div className={`max-w-[75%] ${t.role === "candidate" ? "text-right" : ""}`}>
                {t.role === "interviewer" && t.depth > 0 && (
                  <div className="text-[10px] tracking-wider uppercase text-navy-400 mb-1">
                    ↳ Follow-up · depth {t.depth}
                  </div>
                )}
                <div className={`inline-block text-left rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  t.role === "interviewer"
                    ? "bg-navy-50 text-navy-900 border border-navy-100 rounded-tl-sm"
                    : "bg-navy-800 text-cream rounded-tr-sm"
                }`}>
                  {t.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {status === "thinking" && (
          <div className="flex items-start gap-3 animate-fadeUp">
            {interviewerAvatar}
            <div className="bg-navy-50 border border-navy-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-navy-300 animate-pulseDot" style={{ animationDelay: "0s" }} />
              <span className="w-2 h-2 rounded-full bg-navy-300 animate-pulseDot" style={{ animationDelay: "0.2s" }} />
              <span className="w-2 h-2 rounded-full bg-navy-300 animate-pulseDot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}

        {/* Session Ended */}
        {status === "ended" && (
          <div className="text-center py-10 animate-fadeUp">
            <div className="w-14 h-14 mx-auto rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-700 mb-4">
              <Icon name="target" size={26} strokeWidth={1.5} />
            </div>
            <div className="font-display text-xl text-navy-900 mb-2">Interview complete</div>
            <div className="text-sm text-navy-500 mb-6">
              {totalQ} questions across {phases.length} phases · {turns.filter((t) => t.role === "candidate").length} answers
            </div>
            {reportId ? (
              <Link
                href={`/report/${reportId}`}
                className="inline-flex items-center gap-2 bg-navy-800 text-cream px-6 py-3 rounded-xl font-medium text-sm hover:bg-navy-900 transition-colors shadow-card"
              >
                View score report
                <Icon name="arrowRight" size={15} />
              </Link>
            ) : (
              <div className="text-xs text-navy-400">Preparing your report…</div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      {status !== "ended" && status !== "loading" && (
        <div className="bg-white rounded-2xl border border-navy-100 p-4 shadow-card">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              placeholder={
                status === "thinking"
                  ? "The interviewer is thinking…"
                  : "Type your answer — Enter to send, Shift+Enter for a new line"
              }
              disabled={status !== "idle"}
              rows={3}
              className="flex-1 resize-none text-sm bg-cream border border-navy-100 rounded-xl px-4 py-3 focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              onClick={submitAnswer}
              disabled={!input.trim() || status !== "idle"}
              className="px-5 py-3 bg-navy-800 text-cream rounded-xl text-sm font-medium hover:bg-navy-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              Send
              <Icon name="send" size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInputMethod(inputMethod === "text" ? "voice" : "text")}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  inputMethod === "voice"
                    ? "bg-coral-100 text-coral-700 border-coral-300"
                    : "bg-white text-navy-500 border-navy-200 hover:border-navy-400"
                }`}
              >
                <Icon name="mic" size={13} />
                Voice input
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {confirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/30 backdrop-blur-sm animate-fadeUp">
          <div className="bg-white rounded-2xl border border-navy-100 shadow-card p-6 w-full max-w-sm animate-fadeUp">
            <div className="w-10 h-10 rounded-full bg-coral-50 border border-coral-200 flex items-center justify-center text-coral-600 mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3 className="font-display text-lg text-navy-900 mb-1.5">Quit this interview?</h3>
            <p className="text-sm text-navy-500 leading-relaxed mb-5">
              {turns.filter((t) => t.role === "candidate").length > 0
                ? "You have answered some questions. Your progress will be lost — we'll start a fresh session."
                : "You haven't started yet. No progress will be lost."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmExit(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-navy-700 bg-white border border-navy-200 rounded-xl hover:border-navy-400 transition-all">
                Resume interview
              </button>
              <button
                onClick={() => {
                  setConfirmExit(false);
                  sessionStorage.removeItem(config.claimsKey);
                  if (config.programKey) sessionStorage.removeItem(config.programKey);
                  router.push(config.exitUrl);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-cream bg-coral-500 rounded-xl hover:bg-coral-600 transition-all"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
