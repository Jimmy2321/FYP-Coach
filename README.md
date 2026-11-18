# FYP Coach

Evidence-based interview rehearsal and personal-statement review, powered by a
verbatim-evidence rubric (v3). Résumé-driven interview, study-abroad interview,
and personal-statement review share the same extraction → question generation →
follow-up → scoring pipeline.

## What's inside

- **Extraction** — a résumé or personal statement is decomposed into minimal
  propositions, each with `check_worthiness` (`high`/`medium`/`low`) and the six
  probe angles it supports.
- **Question generation** — one to three questions per proposition, each tied to
  a single probe direction, Bloom level (`analyze`/`evaluate`), and expected
  answer depth (1/2/3).
- **Follow-up** — decides whether to probe further or move on. Answers that
  already cover the required depth short-circuit to termination; partial
  answers get exactly one follow-up turn.
- **Scoring** — four dimensions (`correctness`, `relevance`, `depth`,
  `articulation`), four bands (`Strong` / `Solid` / `Developing` / `Weak`),
  always anchored to verbatim quotations from the candidate's answer. No
  numeric scores anywhere in the UI.
- **Report** — per-question cards with positive and negative evidence,
  "To move up" next-step guidance, and a "Challenge this band" appeal that asks
  the model to re-anchor the decision with new evidence.
- **Personal-statement review** — four dimensions (`purpose_fit`,
  `evidence_specificity`, `narrative_coherence`, `language_clarity`), also
  evidence-tethered. Supplementary feature, not part of the interview pipeline.

## Stack

- Next.js 14 App Router, React 18, TypeScript
- Tailwind CSS
- DeepSeek API (chat completions)
- No database — transcripts live in `sessionStorage`, keyed by `report_<id>`.
  The report is generated fresh from a transcript whenever it is opened, so
  clearing site data in the browser loses both the transcript and the report.

## Run locally

Requires Node ≥ 18.17.

```bash
npm install
cp .env.example .env.local       # on Windows: copy .env.example .env.local
# then edit .env.local and paste your DEEPSEEK_API_KEY

npm run dev                       # http://localhost:3000
# or for a production build (what this repo was tested against):
npm run build && npm run start
```

## Project layout

```
src/
  app/
    resume/                       # résumé upload → extraction → pick propositions
    study-abroad/                 # personal statement + interview entry
    report/[sessionId]/           # per-session scored report
    profile/                      # history of past sessions
    ps-review/                    # personal statement review (supplementary)
    api/
      resume|admissions/extract   # document → ClaimDocument
      interview|admissions/generate  # propositions + persona → 5 phases of questions
      interview/followup          # single follow-up turn or termination
      evaluate                    # one question-answer pair → four dimensions
      feedback                    # next-step guidance for a scored answer
      feedback/contest            # band appeal
      report                      # batch evaluate + feedback an entire session
      ps/review                   # supplementary personal-statement review
  lib/
    rubrics.ts                    # reads markers from rubrics/rubrics_v2.md
    types.ts                      # domain types, band/dimension constants
    extraction.ts                 # post-LLM normalization & [code] enforcement
    question-generation.ts        # post-LLM normalization & similarity checks
    evaluation.ts                 # scoring, feedback, contest, session summary
rubrics/
  rubrics_v2.md                   # single source of truth, 8 <!-- marker --> sections
public/
  samples/                        # test résumé and personal statement
```

## Rubric markers consumed at runtime

| Marker | Stage |
|---|---|
| `extract_v2` | résumé / personal-statement extraction |
| `question_generate_v2` | interview question generation |
| `followup_engine_v3` | follow-up decisions |
| `scoring_v2` | shared scoring section |
| `correctness_job_v2` | job-track correctness (appended after `scoring_v2`) |
| `correctness_admissions_v2` | admissions-track correctness |
| `feedback_v2` | per-question next-step guidance |
| `contest_v2` | band appeal |
| `ps_review_v1` | supplementary personal-statement review |

Everything between `<!-- BEGIN: marker -->` and `<!-- END: marker -->` is sent to
the model verbatim; everything outside is documentation and is never sent.

## Deploy

Any platform that runs a standard Next.js 14 app works. Vercel is the easiest
— just connect this repo and set `DEEPSEEK_API_KEY` in the project env vars.
