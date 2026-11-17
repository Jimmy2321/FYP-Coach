"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import type { ClaimDocument } from "@/lib/types";

type TargetProgram = {
  school: string;
  program: string;
  field: string;
  supervisor: string;
};

const EMPTY_PROGRAM: TargetProgram = { school: "", program: "", field: "", supervisor: "" };

const SCHOOL_OPTIONS = [
  "University of Edinburgh",
  "University of Cambridge",
  "University of Oxford",
  "Imperial College London",
  "University College London",
  "University of Manchester",
  "Carnegie Mellon University",
  "Massachusetts Institute of Technology",
  "Stanford University",
  "University of California, Berkeley",
  "Columbia University",
  "University of Toronto",
  "National University of Singapore",
  "Nanyang Technological University",
  "University of Hong Kong",
  "University of Melbourne",
  "ETH Zurich",
  "Technical University of Munich",
];

const PROGRAMME_OPTIONS = [
  "MSc Computer Science",
  "MSc Artificial Intelligence",
  "MSc Machine Learning",
  "MSc Data Science",
  "MSc Speech and Language Processing",
  "MSc Natural Language Processing",
  "MSc Human-Computer Interaction",
  "MSc Software Engineering",
  "MSc Robotics",
  "MSc Computational Biology",
  "MRes Computer Science",
  "PhD Computer Science",
];

const FIELD_OPTIONS = [
  "Natural Language Processing",
  "Speech Processing",
  "Machine Learning",
  "Computer Vision",
  "Human-Computer Interaction",
  "Data Science",
  "Distributed Systems",
  "Software Engineering",
  "Security and Privacy",
  "Robotics",
  "Computational Biology",
];

export default function AdmissionsInterviewSetupPage() {
  const router = useRouter();
  const [statement, setStatement] = useState("");
  const [program, setProgram] = useState<TargetProgram>(EMPTY_PROGRAM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof TargetProgram, value: string) =>
    setProgram((prev) => ({ ...prev, [key]: value }));

  const start = async () => {
    setError(null);
    const text = statement.trim();
    if (text.length < 200) {
      setError("Please paste at least 200 characters of your personal statement.");
      return;
    }
    if (!program.school.trim() || !program.program.trim()) {
      setError("Please name the school and the programme you're applying to.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admissions/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement_text: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      const doc: ClaimDocument = {
        source_type: data.source_type,
        claims: data.claims,
      };
      sessionStorage.setItem("sa_selected_claims", JSON.stringify(doc));
      sessionStorage.setItem(
        "sa_target_program",
        JSON.stringify({
          school: program.school.trim(),
          program: program.program.trim(),
          field: program.field.trim(),
          supervisor: program.supervisor.trim(),
        })
      );
      router.push("/study-abroad/interview/session");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeUp max-w-2xl mx-auto">
      <PageHeader
        eyebrow="Study Abroad · Admissions Interview"
        icon="mic"
        title="Set up your admissions interview"
        subtitle="Paste the statement you're sending, and tell us where it's going. The interview questions come from both."
      />

      <div className="bg-white border border-navy-200 rounded-2xl shadow-card p-5 mb-4">
        <label className="text-xs font-medium text-navy-700 mb-2 block">Your personal statement</label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder={"Paste your draft here…\n\nWe read it for claims an interviewer would push back on: why this field, what you actually did, which programme and why."}
          rows={10}
          className="w-full bg-cream border border-navy-100 rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-navy-400 resize-none"
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-navy-400">
          <span>{statement.length > 0 ? `${statement.length} characters` : " "}</span>
          <span>Min 200 · Max 12,000 characters</span>
        </div>
      </div>

      <div className="bg-white border border-navy-200 rounded-2xl shadow-card p-5 mb-4">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xs font-medium text-navy-700">Target programme</span>
          <span className="text-[10px] text-navy-400">Pick from the list or type your own</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-navy-500 mb-1 block">School / university</label>
            <input
              value={program.school}
              onChange={(e) => setField("school", e.target.value)}
              placeholder="e.g. University of Edinburgh"
              list="school-options"
              className="w-full bg-cream border border-navy-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-navy-400"
            />
            <datalist id="school-options">
              {SCHOOL_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-[11px] text-navy-500 mb-1 block">Programme</label>
            <input
              value={program.program}
              onChange={(e) => setField("program", e.target.value)}
              placeholder="e.g. MSc Computer Science"
              list="programme-options"
              className="w-full bg-cream border border-navy-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-navy-400"
            />
            <datalist id="programme-options">
              {PROGRAMME_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-[11px] text-navy-500 mb-1 block">Field</label>
            <input
              value={program.field}
              onChange={(e) => setField("field", e.target.value)}
              placeholder="e.g. NLP / HCI"
              list="field-options"
              className="w-full bg-cream border border-navy-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-navy-400"
            />
            <datalist id="field-options">
              {FIELD_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-[11px] text-navy-500 mb-1 block">Supervisor or lab (optional)</label>
            <input
              value={program.supervisor}
              onChange={(e) => setField("supervisor", e.target.value)}
              placeholder="e.g. Prof. X's NLP group"
              className="w-full bg-cream border border-navy-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-navy-400"
            />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-navy-400 leading-relaxed">
          Only what you type here is used — the interview never invents a professor, a paper, or a course.
        </p>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 bg-coral-50 border border-coral-200 rounded-xl px-4 py-3 text-sm text-coral-700 animate-fadeUp">
          <Icon name="alert" size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={start}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-coral-500 text-white px-6 py-3.5 rounded-xl font-medium text-sm hover:bg-coral-600 transition-colors shadow-card disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Reading your statement…
          </>
        ) : (
          <>
            Extract and start interview
            <Icon name="arrowRight" size={15} />
          </>
        )}
      </button>
    </div>
  );
}
