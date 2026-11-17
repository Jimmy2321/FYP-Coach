"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

const HERO_IMAGE = "/images/hero.jpg";

export default function HomePage() {
  const [choosing, setChoosing] = useState(false);

  return (
    <div className="animate-fadeUp">
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-10 md:gap-14 items-center pt-8 pb-16">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-10 bg-navy-200" />
            <span className="eyebrow">For Graduating Students</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-navy-950 text-balance leading-[1.08]">
            Rehearse every answer{" "}
            <span className="italic text-navy-700">before it counts.</span>
          </h1>
          <p className="mt-6 text-navy-500 leading-relaxed max-w-md">
            Technical interview or postgraduate admissions — practice with
            follow-ups, then score what you said on correctness, structure,
            and communication.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setChoosing(true)}
              className="gradient-border-coral-navy inline-flex items-center gap-2 text-cream px-6 py-3 rounded-xl font-medium text-sm hover:bg-navy-900 transition-colors shadow-card"
            >
              Start rehearsal
              <Icon name="arrowRight" size={15} />
            </button>
            <Link
              href="/ps-review"
              className="inline-flex items-center gap-2 bg-white text-navy-800 px-6 py-3 rounded-xl font-medium text-sm border border-navy-200 hover:border-navy-400 transition-colors"
            >
              Review my statement
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-5 texture-dots rounded-3xl" aria-hidden />
          <img
            src={HERO_IMAGE}
            alt="Illustration of an interview rehearsal session"
            className="relative rounded-2xl border border-navy-100 shadow-card w-full object-cover aspect-[4/3]"
          />
        </div>
      </section>

      {/* Editorial rule between sections */}
      <div className="editorial-rule" aria-hidden>
        <span className="dot" />
      </div>

      {/* Two Modules */}
      <section>
        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          {/* Job Seeking */}
          <Link
            href="/resume"
            className="group relative overflow-hidden card-halo-navy block bg-white rounded-2xl border border-navy-100 p-8 hover:shadow-cardHover hover:-translate-y-1 transition-all duration-300 no-underline animate-fadeUp"
            style={{ animationDelay: "100ms" }}
          >
            <div aria-hidden className="ghost-number absolute -top-6 -right-2 text-[120px] leading-none">
              01
            </div>
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-navy-800 text-cream flex items-center justify-center shrink-0">
                  <Icon name="chat" size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl text-navy-900 mb-2">
                    Technical Interview
                  </h3>
                  <p className="text-sm text-navy-500 leading-relaxed">
                    Paste your resume. Questions come from it, follow-ups dig
                    into your answers, and the session ends with a score.
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium text-navy-800 flex items-center gap-2 mt-6 group-hover:gap-3 transition-all">
                Start practicing
                <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Study Abroad — two functions */}
          <div
            className="relative overflow-hidden card-halo-coral bg-white rounded-2xl border border-navy-100 p-8 shadow-card animate-fadeUp"
            style={{ animationDelay: "200ms" }}
          >
            <div aria-hidden className="ghost-number absolute -top-6 -right-2 text-[120px] leading-none">
              02
            </div>
            <div className="relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-coral-500 text-white flex items-center justify-center shrink-0">
                  <Icon name="doc" size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl text-navy-900 mb-2">
                    Postgraduate Application
                  </h3>
                  <p className="text-sm text-navy-500 leading-relaxed">
                    Both parts of the same application — rehearse the interview,
                    review the statement you send with it.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Admissions Interview — live */}
                <Link
                  href="/study-abroad/interview"
                  className="group flex items-start gap-3 rounded-xl border border-navy-200 bg-navy-50/50 p-4 hover:border-navy-400 hover:bg-white transition-colors no-underline"
                >
                  <div className="w-9 h-9 rounded-lg bg-navy-800 text-cream flex items-center justify-center shrink-0">
                    <Icon name="mic" size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy-900">Admissions Interview</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        Available
                      </span>
                    </div>
                    <p className="text-xs text-navy-500 mt-1 leading-relaxed">
                      Questions come from your personal statement and target programme.
                    </p>
                  </div>
                  <Icon
                    name="arrowRight"
                    size={15}
                    className="shrink-0 mt-1 text-navy-400 transition-transform group-hover:translate-x-1"
                  />
                </Link>

                {/* Personal Statement — live */}
                <Link
                  href="/ps-review"
                  className="group flex items-start gap-3 rounded-xl border border-coral-200 bg-coral-50/70 p-4 hover:border-coral-400 hover:bg-coral-50 transition-colors no-underline"
                >
                  <div className="w-9 h-9 rounded-lg bg-coral-500 text-white flex items-center justify-center shrink-0">
                    <Icon name="pen" size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy-900">Personal Statement</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral-100 text-coral-600 uppercase tracking-wider">
                        Available
                      </span>
                    </div>
                    <p className="text-xs text-navy-500 mt-1 leading-relaxed">
                      Five-criterion feedback with line-level rewrite suggestions.
                    </p>
                  </div>
                  <Icon
                    name="arrowRight"
                    size={15}
                    className="shrink-0 mt-1 text-coral-500 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Track Modal */}
      {choosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/30 backdrop-blur-sm animate-fadeUp">
          <div className="bg-white rounded-2xl border border-navy-100 shadow-card p-6 w-full max-w-md animate-fadeUp">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg text-navy-900">What are you preparing for?</h3>
              <button
                onClick={() => setChoosing(false)}
                className="text-navy-400 hover:text-navy-700 font-medium"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <Link
                href="/resume"
                onClick={() => setChoosing(false)}
                className="group flex items-start gap-3 rounded-xl border border-navy-200 bg-white p-4 hover:border-navy-400 hover:bg-navy-50/50 transition-colors no-underline"
              >
                <div className="w-9 h-9 rounded-lg bg-navy-800 text-cream flex items-center justify-center shrink-0">
                  <Icon name="chat" size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-navy-900">Technical Interview</span>
                  <p className="text-xs text-navy-500 mt-0.5 leading-relaxed">
                    Paste your resume → questions built from it → score at the end.
                  </p>
                </div>
                <Icon
                  name="arrowRight"
                  size={15}
                  className="shrink-0 mt-1 text-navy-400 transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/study-abroad/interview"
                onClick={() => setChoosing(false)}
                className="group flex items-start gap-3 rounded-xl border border-navy-200 bg-white p-4 hover:border-navy-400 hover:bg-navy-50/50 transition-colors no-underline"
              >
                <div className="w-9 h-9 rounded-lg bg-coral-500 text-white flex items-center justify-center shrink-0">
                  <Icon name="mic" size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-navy-900">Admissions Interview</span>
                  <p className="text-xs text-navy-500 mt-0.5 leading-relaxed">
                    Paste your statement + target programme → score at the end.
                  </p>
                </div>
                <Icon
                  name="arrowRight"
                  size={15}
                  className="shrink-0 mt-1 text-navy-400 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Features Strip */}
      <div className="ornament mt-24">
        <span className="text-xs">✦</span>
      </div>
      <section className="mt-12">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              title: "Source-driven questions",
              desc: "The interviewer reads your resume or statement and asks from there — not from a generic question bank.",
            },
            {
              title: "Follow-ups you can't rehearse",
              desc: "Every answer gets pushed 3 levels deep on the same topic, then the interviewer moves on.",
            },
            {
              title: "Score against the rubric",
              desc: "Three dimensions — correctness, structure, communication — quoted from what you actually said.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="animate-fadeUp border-t border-navy-200 pt-6"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="ghost-number text-4xl block mb-3" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg text-navy-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-navy-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
