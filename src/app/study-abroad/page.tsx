import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

export default function StudyAbroadPage() {
  return (
    <div className="animate-fadeUp max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Module 02 · Study Abroad"
        icon="doc"
        title="Postgraduate Application"
        subtitle="Two functions for the same application — rehearse the admissions interview, and review the statement you send with it."
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Admissions interview — live */}
        <Link
          href="/study-abroad/interview"
          className="group relative overflow-hidden block h-full bg-white rounded-2xl border border-navy-100 p-7 hover:shadow-cardHover hover:-translate-y-1 transition-all duration-300 no-underline"
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-11 h-11 rounded-xl bg-navy-800 text-cream flex items-center justify-center">
                <Icon name="mic" size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                Available
              </span>
            </div>
            <h2 className="font-display text-xl text-navy-900 mb-2">Admissions Interview</h2>
            <p className="text-sm text-navy-500 leading-relaxed">
              A mock interview built around your statement and your target
              programme: why this field, what you actually did, which programme
              and why, and how you handle a question you can't answer.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-navy-700 group-hover:gap-3 transition-all">
              Start interview
              <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Personal statement — live */}
        <Link
          href="/ps-review"
          className="group relative overflow-hidden block h-full bg-white rounded-2xl border border-navy-100 p-7 hover:shadow-cardHover hover:-translate-y-1 transition-all duration-300 no-underline"
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-11 h-11 rounded-xl bg-coral-500 text-white flex items-center justify-center">
                <Icon name="pen" size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral-100 text-coral-600 uppercase tracking-wider">
                Available
              </span>
            </div>
            <h2 className="font-display text-xl text-navy-900 mb-2">Personal Statement</h2>
            <p className="text-sm text-navy-500 leading-relaxed">
              Your draft scored against five admissions criteria, with
              line-level rewrite suggestions you can act on immediately.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-coral-600 group-hover:gap-3 transition-all">
              Start review
              <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      <p className="mt-10 text-center text-xs text-navy-400">
        Both functions share the same evaluation engine and growth profile as
        the technical interview.
      </p>
    </div>
  );
}
