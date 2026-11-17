"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import {
  BANDS,
  DIMENSIONS,
  type Band,
  type Dimension,
  type SessionIndexEntry,
} from "@/lib/types";

const DIMENSION_LABELS: Record<Dimension, string> = {
  correctness: "Correctness",
  relevance: "Relevance",
  depth: "Depth",
  articulation: "Articulation",
};

const BAND_BADGE: Record<Band, string> = {
  Strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Solid: "bg-navy-50 text-navy-700 border-navy-200",
  Developing: "bg-amber-50 text-amber-700 border-amber-200",
  Weak: "bg-coral-50 text-coral-700 border-coral-200",
};

const BAND_FILL: Record<Band, string> = {
  Strong: "bg-emerald-400",
  Solid: "bg-navy-500",
  Developing: "bg-amber-400",
  Weak: "bg-coral-400",
};

const PERSONA_LABELS: Record<string, string> = {
  supportive: "Supportive",
  poker: "Poker Face",
  challenger: "Challenger",
};

/** 众数；票数相同时取更低的一档，与报告页的会话汇总保持一致 */
function majority(counts: Record<Band, number>): Band {
  let band: Band = "Weak";
  let best = -1;
  for (const candidate of BANDS) {
    if (counts[candidate] >= best) {
      best = counts[candidate];
      band = candidate;
    }
  }
  return band;
}

function describe(session: SessionIndexEntry): string {
  const track = session.track === "admissions" ? "Admissions" : "Technical";
  const persona = PERSONA_LABELS[session.persona] ?? session.persona;
  return `${track} interview · ${persona} · ${session.total_questions} questions`;
}

export default function ProfilePage() {
  const [sessions, setSessions] = useState<SessionIndexEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("report_index");
      const parsed = raw ? (JSON.parse(raw) as SessionIndexEntry[]) : [];
      setSessions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSessions([]);
    }
    setLoaded(true);
  }, []);

  const scored = useMemo(() => sessions.filter((s) => s.summary), [sessions]);

  const aggregate = useMemo(() => {
    const totals = {} as Record<Dimension, Record<Band, number>>;
    for (const dim of DIMENSIONS) {
      totals[dim] = { Strong: 0, Solid: 0, Developing: 0, Weak: 0 };
    }
    for (const session of scored) {
      if (!session.summary) continue;
      for (const dim of DIMENSIONS) {
        for (const band of BANDS) {
          totals[dim][band] += session.summary[dim].counts[band];
        }
      }
    }
    return totals;
  }, [scored]);

  const answered = useMemo(
    () => scored.reduce((sum, s) => sum + s.total_questions, 0),
    [scored]
  );

  return (
    <div className="animate-fadeUp">
      <PageHeader
        eyebrow={
          loaded
            ? `Session History · ${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`
            : "Session History"
        }
        icon="trend"
        title="Your Growth Profile"
        subtitle="Bands from every completed interview in this browser, aggregated as distributions rather than averaged into a score."
      />
      <div className="flex justify-center -mt-6 mb-10">
        <Link
          href="/resume"
          className="inline-flex items-center gap-2 text-sm bg-navy-800 text-cream px-6 py-2.5 rounded-xl hover:bg-navy-900 transition-colors shadow-card"
        >
          Start a new session
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      {!loaded ? (
        <div className="bg-white rounded-2xl border border-navy-100 p-12 text-center shadow-card">
          <span className="inline-block w-5 h-5 rounded-full border-2 border-navy-200 border-t-navy-700 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-100 p-8 text-center shadow-card">
          <div className="w-12 h-12 mx-auto rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-600 mb-4">
            <Icon name="trend" size={22} />
          </div>
          <div className="font-display text-xl text-navy-900 mb-2">No sessions yet</div>
          <p className="text-sm text-navy-500 max-w-md mx-auto mb-6">
            Finish an interview and its band distribution will appear here. Sessions are kept in this
            browser only.
          </p>
          <Link
            href="/resume"
            className="inline-flex items-center gap-2 bg-navy-800 text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-900 transition-colors"
          >
            Start a session
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      ) : (
        <>
          {scored.length > 0 ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h2 className="font-display text-xl text-navy-900">Band distribution</h2>
                <span className="text-[11px] text-navy-400">
                  {answered} scored answers · {scored.length} of {sessions.length} sessions scored
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                {DIMENSIONS.map((dim) => {
                  const counts = aggregate[dim];
                  const band = majority(counts);
                  return (
                    <div key={dim} className="bg-white rounded-2xl border border-navy-100 p-4 shadow-card">
                      <div className="text-[10px] tracking-wider uppercase text-navy-400 mb-1.5">
                        {DIMENSION_LABELS[dim]}
                      </div>
                      <span
                        className={`inline-block text-sm font-medium px-2.5 py-1 rounded-lg border ${BAND_BADGE[band]}`}
                      >
                        {band}
                      </span>
                      <div className="flex gap-1 mt-3" aria-hidden>
                        {BANDS.map((b) => (
                          <span
                            key={b}
                            className={`h-1.5 flex-1 rounded-full ${
                              b === band ? BAND_FILL[b] : "bg-navy-100"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] text-navy-400 leading-relaxed">
                        {BANDS.filter((b) => counts[b] > 0)
                          .map((b) => `${b} ×${counts[b]}`)
                          .join(" · ")}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-navy-400 mb-8">
                Each card shows the majority band across scored answers; the bar runs Strong → Weak.
              </p>
            </>
          ) : (
            <div className="mb-8 rounded-xl border border-navy-100 bg-white px-5 py-4 text-xs text-navy-500">
              None of these sessions has been scored yet. Open a session below to generate its
              band distribution.
            </div>
          )}

          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 className="font-display text-xl text-navy-900">Past sessions</h2>
            <span className="text-[11px] text-navy-400">Stored in this browser only</span>
          </div>

          <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden shadow-card divide-y divide-navy-50">
            {sessions.map((session) => (
              <Link
                key={session.session_id}
                href={`/report/${session.session_id}`}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-6 py-4 hover:bg-navy-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                    <Icon name="doc" size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-navy-900 truncate">
                      {describe(session)}
                    </div>
                    <div className="text-xs text-navy-400">
                      {new Date(session.completed_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  {session.summary ? (
                    <div className="flex flex-wrap gap-1.5">
                      {DIMENSIONS.map((dim) => {
                        const band = session.summary![dim].band;
                        return (
                          <span
                            key={dim}
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${BAND_BADGE[band]}`}
                          >
                            {DIMENSION_LABELS[dim]} · {band}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-navy-400">Not scored yet · open to generate</span>
                  )}
                  <span className="text-navy-300">
                    <Icon name="arrowRight" size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
