"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import {
  BANDS,
  DIMENSIONS,
  type Band,
  type ContestResult,
  type Dimension,
  type ReportResult,
  type ScoredQuestion,
  type SessionIndexEntry,
  type SessionReportInput,
  type Trend,
} from "@/lib/types";

const DIMENSION_LABELS: Record<Dimension, string> = {
  correctness: "Correctness",
  relevance: "Relevance",
  depth: "Depth",
  articulation: "Articulation",
};

const DIMENSION_HINTS: Record<Dimension, string> = {
  correctness: "Accuracy against the standard for this interview track.",
  relevance: "Whether the answer addresses the question that was asked.",
  depth: "Whether the reasoning is unfolded beyond the conclusion.",
  articulation: "Whether the answer is structured and easy to follow.",
};

const BAND_STYLES: Record<Band, string> = {
  Strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Solid: "bg-navy-50 text-navy-700 border-navy-200",
  Developing: "bg-amber-50 text-amber-700 border-amber-200",
  Weak: "bg-coral-50 text-coral-700 border-coral-200",
};

const TREND_STYLES: Record<Trend, string> = {
  improving: "bg-emerald-50 text-emerald-700 border-emerald-200",
  stable: "bg-navy-50 text-navy-700 border-navy-200",
  declining: "bg-coral-50 text-coral-700 border-coral-200",
};

const TREND_LABELS: Record<Trend, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
};

function ContestView({ result }: { result: ContestResult }) {
  return (
    <div className="mt-3 rounded-lg border border-navy-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] tracking-wider uppercase text-navy-400">Challenge</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${BAND_STYLES[result.anchor_after]}`}>
          {result.anchor_before} → {result.anchor_after}
        </span>
      </div>
      <p className="text-[12px] text-navy-700 leading-relaxed">{result.basis}</p>
      <p className="text-[11px] text-navy-500 mt-1.5 leading-relaxed">“{result.quotation}”</p>
      <p className="text-[11px] text-navy-400 mt-1.5 leading-relaxed">{result.change_condition}</p>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params?.sessionId) ? params.sessionId[0] : params?.sessionId;

  const [input, setInput] = useState<SessionReportInput | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [contests, setContests] = useState<Record<string, ContestResult>>({});
  const [contestOpen, setContestOpen] = useState<string | null>(null);
  const [contestNote, setContestNote] = useState("");
  const [contestBusy, setContestBusy] = useState<string | null>(null);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || startedRef.current) return;
    startedRef.current = true;

    let payload: SessionReportInput | null = null;
    try {
      const raw = sessionStorage.getItem(`report_${sessionId}`);
      if (raw) payload = JSON.parse(raw) as SessionReportInput;
    } catch { /* ignore */ }

    if (!payload || !Array.isArray(payload.responses) || payload.responses.length === 0) {
      setMissing(true);
      return;
    }

    setInput(payload);

    (async () => {
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track: payload!.track, responses: payload!.responses }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        const report = data as ReportResult;
        setResult(report);
        setOpenId(report.results?.[0]?.question_id ?? null);

        // 把档位汇总回写到索引，历史页可以直接展示
        try {
          const rawIndex = sessionStorage.getItem("report_index");
          if (rawIndex) {
            const index = JSON.parse(rawIndex) as SessionIndexEntry[];
            if (Array.isArray(index)) {
              const next = index.map((entry) =>
                entry.session_id === payload!.session_id
                  ? { ...entry, summary: report.summary }
                  : entry
              );
              sessionStorage.setItem("report_index", JSON.stringify(next));
            }
          }
        } catch { /* 索引不可用时忽略 */ }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    })();
  }, [sessionId]);

  const submitContest = async (item: ScoredQuestion, dimension: Dimension) => {
    const key = `${item.question_id}-${dimension}`;
    setContestBusy(key);
    try {
      const res = await fetch("/api/feedback/contest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: item.question_id,
          question: item.question,
          answer: item.answer,
          dimension,
          anchor: item.score.dimensions[dimension].anchor,
          note: contestNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setContests((prev) => ({ ...prev, [key]: data as ContestResult }));
      setContestOpen(null);
      setContestNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setContestBusy(null);
    }
  };

  const backHref = input?.track === "admissions" ? "/study-abroad/interview" : "/resume";
  const backLabel = input?.track === "admissions" ? "Practise another statement" : "Practise another résumé";

  return (
    <div className="animate-fadeUp max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Score Report"
        icon="chart"
        title="Interview report"
        subtitle={
          input
            ? `${input.track === "admissions" ? "Admissions" : "Technical"} interview · ${input.responses.length} questions · ${new Date(input.completed_at).toLocaleString()}`
            : "Every answer is scored on four dimensions, with the exact wording that decided each band."
        }
      />

      {error && (
        <div className="mb-6 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          <Icon name="alert" size={14} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-amber-600 hover:text-amber-900 font-medium">×</button>
        </div>
      )}

      {missing && (
        <div className="bg-white rounded-2xl border border-navy-100 p-8 text-center shadow-card">
          <div className="w-12 h-12 mx-auto rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-600 mb-4">
            <Icon name="doc" size={22} />
          </div>
          <div className="font-display text-xl text-navy-900 mb-2">This report isn&apos;t available</div>
          <p className="text-sm text-navy-500 mb-6 max-w-md mx-auto">
            Reports live in this browser&apos;s session storage. If you opened this link on another device, or
            cleared site data, the transcript is gone.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-navy-800 text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-900 transition-colors"
          >
            Back to start
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      )}

      {!missing && !result && !error && (
        <div className="bg-white rounded-2xl border border-navy-100 p-12 text-center shadow-card">
          <div className="w-12 h-12 mx-auto rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center mb-4">
            <span className="w-5 h-5 rounded-full border-2 border-navy-200 border-t-navy-700 animate-spin" />
          </div>
          <div className="font-medium text-navy-800 text-sm mb-1">Scoring your answers…</div>
          <p className="text-xs text-navy-400 max-w-sm mx-auto">
            Each answer is scored on four dimensions and matched to its evidence. This can take a minute.
          </p>
        </div>
      )}

      {result && (
        <>
          {result.failed > 0 && (
            <div className="mb-5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              {result.failed} answer{result.failed === 1 ? "" : "s"} could not be scored and {result.failed === 1 ? "is" : "are"} not shown.
            </div>
          )}

          {/* 会话级：只给档位分布，不做平均分 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {DIMENSIONS.map((dim) => {
              const summary = result.summary[dim];
              return (
                <div key={dim} className="bg-white rounded-2xl border border-navy-100 p-4 shadow-card">
                  <div className="text-[10px] tracking-wider uppercase text-navy-400 mb-1.5">
                    {DIMENSION_LABELS[dim]}
                  </div>
                  <span className={`inline-block text-sm font-medium px-2.5 py-1 rounded-lg border ${BAND_STYLES[summary.band]}`}>
                    {summary.band}
                  </span>
                  <div className="mt-2 text-[10px] text-navy-400 leading-relaxed">
                    {BANDS.filter((b) => summary.counts[b] > 0)
                      .map((b) => `${b} ×${summary.counts[b]}`)
                      .join(" · ") || "No scored answers"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* v3 2.5.3：最弱两项与趋势，只显示标签 */}
          <div className="flex flex-wrap items-center gap-2 mb-8 -mt-4">
            <span className="text-[10px] tracking-wider uppercase text-navy-400">
              Weakest
            </span>
            {result.overview.weakest.map((dim) => (
              <span
                key={dim}
                className="text-[11px] px-2 py-0.5 rounded-full border border-navy-200 bg-white text-navy-600"
              >
                {DIMENSION_LABELS[dim]}
              </span>
            ))}
            {result.overview.trend && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${TREND_STYLES[result.overview.trend]}`}
              >
                Trend · {TREND_LABELS[result.overview.trend]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 -mt-3 mb-6">
            {result.overview.weakest.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase text-navy-400">Weakest</span>
                {result.overview.weakest.map((dim) => (
                  <span
                    key={dim}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-navy-200 bg-white text-navy-700"
                  >
                    {DIMENSION_LABELS[dim]}
                  </span>
                ))}
              </div>
            )}
            {result.overview.trend && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase text-navy-400">Trend</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${TREND_STYLES[result.overview.trend]}`}
                >
                  {TREND_LABELS[result.overview.trend]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {result.results.map((item, index) => {
              const isOpen = openId === item.question_id;
              return (
                <div key={item.question_id} className="bg-white rounded-2xl border border-navy-100 shadow-card overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.question_id)}
                    className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-navy-50/40 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-navy-400 mt-1 shrink-0">
                      Q{String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-navy-900 leading-snug">{item.question}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {DIMENSIONS.map((dim) => (
                          <span
                            key={dim}
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${BAND_STYLES[item.score.dimensions[dim].anchor]}`}
                          >
                            {DIMENSION_LABELS[dim]} · {item.score.dimensions[dim].anchor}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`text-navy-400 mt-1 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}>
                      <Icon name="arrowRight" size={15} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-4 border-t border-navy-50 space-y-4">
                      <div>
                        <div className="text-[10px] tracking-wider uppercase text-navy-400 mb-1.5">
                          Your response
                        </div>
                        <p className="text-[13px] text-navy-700 whitespace-pre-wrap leading-relaxed">
                          {item.answer}
                        </p>
                      </div>

                      {DIMENSIONS.map((dim) => {
                        const score = item.score.dimensions[dim];
                        const feedback = item.feedback?.per_dimension.find((f) => f.dimension === dim);
                        const key = `${item.question_id}-${dim}`;

                        return (
                          <div key={dim} className="rounded-xl border border-navy-100 p-4">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-navy-900">{DIMENSION_LABELS[dim]}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${BAND_STYLES[score.anchor]}`}>
                                  {score.anchor}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setContestOpen(contestOpen === key ? null : key);
                                  setContestNote("");
                                }}
                                className="text-[11px] text-navy-400 hover:text-navy-800 transition-colors"
                              >
                                {contestOpen === key ? "Cancel" : "Challenge this band"}
                              </button>
                            </div>
                            <p className="text-[11px] text-navy-400 mb-3">{DIMENSION_HINTS[dim]}</p>

                            {score.evidence.length > 0 ? (
                              <ul className="space-y-2">
                                {score.evidence.map((evidence, i) => (
                                  <li key={i} className="text-[12px] leading-relaxed">
                                    <span className={evidence.stance === "positive" ? "text-emerald-600" : "text-coral-600"}>
                                      {evidence.stance === "positive" ? "+" : "−"}
                                    </span>{" "}
                                    <span className="text-navy-700">“{evidence.quote}”</span>
                                    {evidence.why && <span className="text-navy-400"> — {evidence.why}</span>}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-navy-400">No wording could be quoted from this answer.</p>
                            )}

                            {score.anchor !== "Strong" && score.improvement && (
                              <p className="mt-3 text-[12px] text-navy-600 leading-relaxed">
                                <span className="font-medium">To move up:</span> {score.improvement}
                              </p>
                            )}

                            {feedback?.feed_up.criteria.length ? (
                              <p className="mt-2 text-[11px] text-navy-500 leading-relaxed">
                                <span className="font-medium">{feedback.feed_up.anchor} requires:</span>{" "}
                                {feedback.feed_up.criteria.join("; ")}
                              </p>
                            ) : null}

                            {feedback?.feed_forward?.action_items.length ? (
                              <p className="mt-1.5 text-[11px] text-navy-500 leading-relaxed">
                                <span className="font-medium">Next attempt:</span>{" "}
                                {feedback.feed_forward.action_items.join("; ")}
                              </p>
                            ) : null}

                            {contestOpen === key && (
                              <div className="mt-3 rounded-lg bg-navy-50 p-3">
                                <textarea
                                  value={contestNote}
                                  onChange={(e) => setContestNote(e.target.value)}
                                  rows={2}
                                  placeholder="What did the band miss? (optional)"
                                  className="w-full text-[12px] rounded-lg border border-navy-200 bg-white px-3 py-2 outline-none focus:border-navy-500 resize-none"
                                />
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => submitContest(item, dim)}
                                    disabled={contestBusy === key}
                                    className="text-[11px] px-3 py-1.5 rounded-lg bg-navy-800 text-cream font-medium hover:bg-navy-900 transition-colors disabled:opacity-50"
                                  >
                                    {contestBusy === key ? "Checking…" : "Submit challenge"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {contests[key] && <ContestView result={contests[key]} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 bg-navy-800 text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-900 transition-colors"
            >
              {backLabel}
              <Icon name="arrowRight" size={14} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-navy-700 px-5 py-2.5 rounded-xl text-sm font-medium border border-navy-200 hover:border-navy-400 transition-colors"
            >
              Home
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
