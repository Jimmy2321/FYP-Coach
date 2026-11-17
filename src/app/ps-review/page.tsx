"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import {
  PS_DIMENSIONS,
  type Band,
  type PSDimension,
  type PSReviewResult,
} from "@/lib/types";

const PROGRAMS = [
  { value: "cs_masters", label: "Computer Science · Master's" },
  { value: "cs_phd", label: "Computer Science · PhD" },
  { value: "eecs_masters", label: "EECS · Master's" },
  { value: "hci_masters", label: "HCI · Master's" },
  { value: "ml_masters", label: "ML / AI · Master's" },
  { value: "other", label: "Other" },
];

const PS_META: Record<PSDimension, { label: string; hint: string }> = {
  purpose_fit: {
    label: "Purpose Fit",
    hint: "Whether the reasons for this programme are specific and tied to your direction.",
  },
  evidence_specificity: {
    label: "Evidence Specificity",
    hint: "Whether each experience claim names an object, an action and a result.",
  },
  narrative_coherence: {
    label: "Narrative Coherence",
    hint: "Whether experience, direction and programme form one thread.",
  },
  language_clarity: {
    label: "Language Clarity",
    hint: "Whether a reader can follow without re-reading.",
  },
};

const BAND_STYLES: Record<Band, string> = {
  Strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Solid: "bg-navy-50 text-navy-700 border-navy-200",
  Developing: "bg-amber-50 text-amber-700 border-amber-200",
  Weak: "bg-coral-50 text-coral-700 border-coral-200",
};

const MIN_LENGTH = 50;

export default function PsReviewPage() {
  const [program, setProgram] = useState("cs_masters");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PSReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const programLabel = PROGRAMS.find((p) => p.value === program)?.label ?? program;

  const submit = async () => {
    const text = draft.trim();
    if (text.length < MIN_LENGTH) {
      setError("Paste at least a few sentences so there is something to review.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ps/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: text, target_program: programLabel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data as PSReviewResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="animate-fadeUp">
        <PageHeader
          eyebrow={`Personal Statement · ${programLabel}`}
          icon="doc"
          title="Review report"
          subtitle="Four dimensions, band names only. Every band quotes the draft verbatim."
        />

        <div className="mb-6 flex items-center justify-center">
          <span className="text-[11px] text-navy-400 bg-navy-50 border border-navy-100 rounded-full px-3 py-1">
            Supplementary review · not part of the interview score
          </span>
        </div>

        <div className="space-y-4">
          {PS_DIMENSIONS.map((dim, index) => {
            const item = result[dim];
            const meta = PS_META[dim];
            return (
              <div
                key={dim}
                className="bg-white rounded-2xl border border-navy-100 p-5 shadow-card animate-fadeUp"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-navy-900">{meta.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${BAND_STYLES[item.anchor]}`}
                    >
                      {item.anchor}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-navy-400 mb-3">{meta.hint}</p>

                {item.evidence.length > 0 ? (
                  <ul className="space-y-2">
                    {item.evidence.map((evidence, i) => (
                      <li key={i} className="text-[12px] leading-relaxed">
                        <span
                          className={
                            evidence.stance === "positive" ? "text-emerald-600" : "text-coral-600"
                          }
                        >
                          {evidence.stance === "positive" ? "+" : "−"}
                        </span>{" "}
                        <span className="text-navy-700">“{evidence.quote}”</span>
                        {evidence.why && <span className="text-navy-400"> — {evidence.why}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-navy-400">
                    No wording could be quoted from the draft for this dimension.
                  </p>
                )}

                {item.anchor !== "Strong" && item.improvement && (
                  <p className="mt-3 text-[12px] text-navy-600 leading-relaxed">
                    <span className="font-medium">To move up:</span> {item.improvement}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            className="inline-flex items-center gap-2 bg-navy-800 text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-900 transition-colors"
          >
            ← Back to edit
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-navy-700 px-5 py-2.5 rounded-xl text-sm font-medium border border-navy-200 hover:border-navy-400 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Study Abroad · Personal Statement"
        icon="pen"
        title="Review your personal statement"
        subtitle="Bands on four dimensions, each tied to the wording that decided it. Supplementary to the interview."
      />

      <div className="bg-white rounded-2xl border border-navy-100 p-6 mb-6 shadow-card">
        <label className="text-xs font-medium text-navy-700 mb-2 block">Target program type</label>
        <select
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          className="w-full border border-navy-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy-400"
        >
          {PROGRAMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-card mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-xs font-medium text-navy-700">Your draft</label>
          <span className="text-[11px] text-navy-400">{draft.trim().length} characters</span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste your personal statement draft…"
          rows={16}
          className="w-full bg-cream border border-navy-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy-400 resize-none"
        />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          <Icon name="alert" size={14} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-amber-600 hover:text-amber-900 font-medium">
            ×
          </button>
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-navy-800 text-cream px-6 py-3.5 rounded-xl font-medium text-sm hover:bg-navy-900 transition-colors shadow-card disabled:opacity-50"
      >
        {loading ? "Reviewing…" : "Start review"}
        {!loading && <Icon name="arrowRight" size={15} />}
      </button>
    </div>
  );
}
