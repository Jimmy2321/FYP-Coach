"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import type { Claim, ClaimDocument } from "@/lib/types";

const WORTHINESS_STYLES: Record<string, string> = {
  high: "bg-coral-100 text-coral-700 border-coral-300",
  medium: "bg-navy-50 text-navy-700 border-navy-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function ResumePage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastExtractCount, setLastExtractCount] = useState<number | null>(null);

  const analyze = async (overrideText?: string) => {
    setError(null);
    const text = (overrideText ?? resumeText).trim();
    if (text.length < 50) {
      setError("Please paste at least 50 characters of resume text.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/resume/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const doc: ClaimDocument = {
        source_type: data.source_type,
        claims: data.claims,
      };
      setClaims(doc.claims);
      setLastExtractCount(doc.claims.length);
      // 全选 → 存 sessionStorage → 直接进面试，零中间步骤
      sessionStorage.setItem("ir_selected_claims", JSON.stringify(doc));
      router.push("/interview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = async () => {
    setError(null);
    setResumeText(SAMPLE_RESUME);
    setFileName("built-in sample resume");
    await analyze(SAMPLE_RESUME);
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setError(null);
    if (f.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB).");
      return;
    }
    if (f.name.toLowerCase().endsWith(".txt") || f.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = () => {
        setResumeText(String(reader.result || ""));
        setFileName(f.name);
      };
      reader.readAsText(f);
    } else {
      setError("PDF / Word parsing isn't wired up yet — please paste the resume text below.");
    }
  };

  const predicateCount = claims.reduce((n, c) => n + c.predicates.length, 0);

  return (
    <div className="animate-fadeUp max-w-2xl mx-auto">
      <PageHeader
        eyebrow="Job Seeking · Technical Interview"
        icon="upload"
        title="Upload your resume"
        subtitle="Paste the text below — we'll extract what matters and start interviewing right away."
      />

      {/* 上次提取的折叠预览（可选确认，默认收起） */}
      {lastExtractCount !== null && claims.length > 0 && (
        <div className="mb-5 bg-white border border-navy-100 rounded-2xl shadow-card overflow-hidden animate-fadeUp">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-navy-50/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Icon name="check" size={13} strokeWidth={3} />
              </span>
              <div>
                <span className="text-sm font-medium text-navy-800">
                  Last extract found {claims.length} sentence{claims.length === 1 ? "" : "s"} · {predicateCount} proposition{predicateCount === 1 ? "" : "s"}
                </span>
                <span className="text-[11px] text-navy-400 ml-2">from your resume</span>
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-navy-400 transition-transform ${showPreview ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            ><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {showPreview && (
            <div className="border-t border-navy-50 px-5 py-4 space-y-2 max-h-80 overflow-y-auto bg-navy-50/30">
              {claims.map((c) => (
                <div key={c.claim_id} className="py-2 border-b border-navy-50 last:border-0">
                  <p className="text-[12px] text-navy-700 leading-snug mb-1.5">{c.original_text}</p>
                  <div className="space-y-1">
                    {c.predicates.map((p) => (
                      <div key={p.predicate_id} className="flex items-start gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${WORTHINESS_STYLES[p.check_worthiness] || WORTHINESS_STYLES.medium}`}>
                          {p.check_worthiness}
                        </span>
                        <span className="text-[11px] text-navy-500 leading-snug">{p.predicate_text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <label
        className="block border-2 border-dashed border-navy-200 rounded-2xl p-8 text-center bg-white/60 hover:border-navy-400 hover:bg-white transition-all cursor-pointer group mb-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div className="w-12 h-12 mx-auto rounded-full bg-white border border-navy-100 shadow-card flex items-center justify-center text-navy-700 mb-3 group-hover:scale-105 transition-transform">
          <Icon name="doc" size={22} strokeWidth={1.5} />
        </div>
        <div className="font-medium text-navy-800 mb-1 text-sm">
          {fileName ? `Loaded: ${fileName}` : "Click to upload or drag & drop a .txt file"}
        </div>
        <div className="text-xs text-navy-400">
          .txt supported now · for PDF / Word, paste the text below
        </div>
      </label>

      <textarea
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        placeholder={"Paste your resume text here…\n\ne.g. education, projects, internships, skills — plain text is fine."}
        rows={10}
        className="w-full bg-white border border-navy-200 rounded-2xl px-5 py-4 text-sm leading-relaxed focus:outline-none focus:border-navy-400 resize-none shadow-card"
      />
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-navy-400">
        <span>{resumeText.length > 0 ? `${resumeText.length} characters` : " "}</span>
        <span>Min 50 · Max 12,000 characters</span>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 bg-coral-50 border border-coral-200 rounded-xl px-4 py-3 text-sm text-coral-700 animate-fadeUp">
          <Icon name="alert" size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={() => analyze()}
        disabled={loading}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-coral-500 text-white px-6 py-3.5 rounded-xl font-medium text-sm hover:bg-coral-600 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Analyzing your resume…
          </>
        ) : (
          <>
            Analyze and start interview
            <Icon name="arrowRight" size={15} />
          </>
        )}
      </button>

      <div className="mt-4 text-center">
        <button
          onClick={loadSample}
          disabled={loading}
          className="text-sm text-navy-500 hover:text-navy-800 underline underline-offset-4 disabled:opacity-50"
        >
          No resume handy? Analyze a sample resume →
        </button>
      </div>
    </div>
  );
}
