# Rubric System — v1 (master file)

This is the single source of truth for every rule the AI must follow in this product. Runtime code reads the marked sections (`<!-- BEGIN: … -->`) and embeds them into prompts — edit the section here, nowhere else.

## How to read this file

| # | Section | What it does (plain words) | When it runs |
|---|---|---|---|
| 1 | Claim extraction specs | Tells the AI how to pull probe-able statements ("claims") out of a resume (1.1) or a personal statement (1.2). One claim = one thing a real interviewer could question. | Session setup — embedded in the extraction prompt |
| 2 | Question generation spec | Tells the AI how to turn each claim into exactly one opening interview question. | Right after extraction — embedded in the generation prompt |
| 3 | Pipeline evaluation | Judges whether stages 1–2 did a good job: 9 code checks first, then 4+4 quality dimensions scored 1–4 with quoted evidence. | Dev spot checks + the thesis evaluation chapter |
| 4 | Answer scoring rubric | Judges the candidate's own answers at the end of a session: 1–4 anchored levels, verbatim-quote evidence, anti-leniency guards. | End of session — feeds the report |
| 5 | Admissions interview orchestration | The admissions track's own session plan: 5 fixed phases, what each phase assesses, how questions are ordered, and the phase-structured JSON shape. | Admissions session start — embedded in the generation prompt |
| 6 | Job interview orchestration | The job track's equivalent session plan: the same 5 phases with technical content, claim-count-driven allocation, bank selection rules, and transitions. | Job session start — embedded in the generation prompt |
| 7 | Follow-up engine | Decides, after every answer, whether to probe deeper or move on — with phase-specific probing strategies, a hard depth cap of 3, and persona tone rules. | Every turn after the candidate answers |

How the pieces connect: **source → claims → questions → answers → scores** — every hop must stay verbatim-checkable against the previous one.

The rule that keeps this one system: stage differences are data (type tables, anchors), never a second copy of the logic.

---

## 1. Claim extraction specs

Both tracks share the same skeleton: verbatim quotes only, one category per claim, 5–15 claims, a `vague_point` per claim, one JSON output shape. What differs is the source document and the claim-type table. Each section below is self-contained (it is embedded into its prompt as-is).

### 1.1 Job track — resume → claims (`resume_extract_v1`)

<!-- BEGIN: resume_extract_v1 -->
## Task

Extract claims from a resume that a technical interviewer could **probe with follow-up questions**.
Extract ONLY explicitly stated facts. NEVER infer, embellish, or generalize.

## Claim Types (each claim MUST belong to exactly one)

| Type | Extract when | Example | Do NOT extract |
|------|--------------|---------|----------------|
| **Tech Choice** | A specific technology/tool/framework is named WITH its purpose | "Implemented Redis distributed locks for inventory deduction" | "Familiar with Java" (no purpose), "Knows Redis" (no scenario) |
| **Quantified Result** | A concrete number (%, x, absolute) is tied to an action or project | "Increased QPS from 500 to 3,000 under load testing" | "Greatly improved performance" (no number), "Excellent results" (subjective) |
| **Architecture** | A system structure or design decision is described WITH a technical rationale | "Adopted microservices to scale business modules independently" | "Participated in system architecture" (no specifics) |
| **Problem Solving** | A concrete problem is described WITH your solution | "Fixed API response timeouts by introducing a local cache" | "Responsible for solving technical issues" (no content) |
| **Role & Ownership** | Your specific role/responsibility in a team is described WITH an output | "Led the rewrite of the order module as backend owner" | "Participated in a team project" (no role) |

## Hard Rules

1. **Verbatim quotes only** — each `claim` MUST be a verbatim span from the resume (original language). Do not polish, translate, or summarize.
2. **Categorize every claim** into exactly one of the five types above, using the extraction conditions.
3. **Count constraint** — between 5 and 15 claims. If fewer than 5 qualify, re-check for missed ones. If more than 15, keep the most technically deep.
4. **vague_point** — for each claim, name the one detail an interviewer would most likely probe (e.g., "Lock implementation unspecified (Redlock? SETNX?)"). Write it in English.
5. **source_section** — the resume section where the claim appears (e.g., "Projects / Online Store"). If unclear, use "Resume".

## Output Format

Output a single valid JSON object (no markdown fences, no commentary):

```json
{
  "claims": [
    {
      "claim": "verbatim span from the resume",
      "category": "Tech Choice | Quantified Result | Architecture | Problem Solving | Role & Ownership",
      "source_section": "section path in the resume",
      "vague_point": "the most probe-worthy missing detail, in English"
    }
  ],
  "extract_count": 6,
  "rubric_version": "resume_extract_v1"
}
```
<!-- END: resume_extract_v1 -->

### 1.2 Admissions track — PS → claims (`ps_claims_v1`)

<!-- BEGIN: ps_claims_v1 -->
## Task

Extract claims from a personal statement draft that an **admissions interviewer** could probe.
This is the postgraduate-application counterpart of the job-track spec (§1.1): the statement replaces
the resume as the evidence document, and the target program replaces the job description.

Extract ONLY what is explicitly stated. NEVER infer, embellish, or invent a detail the writer did not write.

## Claim Types (each claim MUST belong to exactly one)

| Type | Extract when | Example | Do NOT extract |
|------|--------------|---------|----------------|
| **Research Interest** | A specific field, problem, or method is named WITH a reason it matters to the writer | "I want to work on low-resource machine translation because my hometown dialect has no written corpus" | "I am passionate about AI" (no problem, no reason) |
| **Academic Background** | A course, lab, project, thesis, or publication is described WITH enough specifics to question | "Built a CRF-based dialect segmenter for my undergraduate thesis, reaching 0.81 F1" | "Solid foundation in computer science" (no artifact) |
| **Motivation Origin** | A concrete experience is offered as the reason for pursuing the field | "Watching my mother's clinic lose patient records to a power cut is why I care about fault-tolerant systems" | "Since childhood I have loved computers" (no event) |
| **Program Fit** | A named program, professor, lab, or course is tied to a stated connection | "Prof. X's 2025 paper on retrieval evaluation matches the problem I hit in my thesis" | "This university is world-renowned" (no name, no link) |
| **Achievement** | A concrete, checkable result is stated (rank, award, number, acceptance) | "Ranked 3rd of 210 in the national contest" | "Won several awards" (unspecified) |
| **Career Plan** | A stated future direction or goal after the degree | "I intend to return and build clinical NLP tools for regional hospitals" | "I want to become a better engineer" (vacuous) |

## Hard Rules

1. **Verbatim quotes only** — each `claim` MUST be a verbatim span from the statement (original language). Do not polish or translate.
2. **Categorize every claim** into exactly one of the six types above.
3. **Count constraint** — between 5 and 15 claims. If fewer than 5 qualify, re-check for missed ones. If more than 15, keep the ones most likely to be probed in an interview.
4. **vague_point** — name the one detail an admissions interviewer would most likely press on. Half of these should be things the writer probably *cannot* fully answer, because that is what a real interview exposes. Write it in English.
5. **source_section** — where the claim sits in the statement (e.g. "Paragraph 2 / research experience"). If unclear, use "Statement".
6. **Never merge claims.** One claim = one probe-able assertion.

## Output Format

Output a single valid JSON object (no markdown fences, no commentary):

```json
{
  "claims": [
    {
      "claim": "verbatim span from the statement",
      "category": "Research Interest | Academic Background | Motivation Origin | Program Fit | Achievement | Career Plan",
      "source_section": "paragraph path in the statement",
      "vague_point": "the most probe-worthy missing or unproven detail, in English"
    }
  ],
  "extract_count": 7,
  "rubric_version": "ps_claims_v1"
}
```
<!-- END: ps_claims_v1 -->

---

## 2. Question generation spec (`question_generate_v1`)

One opening question per claim, grounded in the claim's specifics, leaving the `vague_point` for the follow-up engine. Works for both tracks — only the input claims differ.

> Positioning: this section is the quality bar for a single question. At runtime, questions are scheduled by §5 (admissions) and §6 (job); this section states what each question must satisfy. No code reads this section directly.

<!-- BEGIN: question_generate_v1 -->
You write the OPENING questions of a mock interview.
Each question is built from one claim extracted from the candidate's own resume or personal statement.

## Input

- A list of claims (JSON): each has `id`, `claim`, `category`, `source_section`, `vague_point`
- The interviewer persona

## Rules

1. Exactly ONE opening question per claim.
2. Reference the specifics of the claim — name the technology, the numbers — so the candidate knows exactly what you are asking about.
3. Open-ended: invite a story ("Walk me through…", "How did you…", "Why did you decide to…"). Never yes/no questions.
4. ONE ask per question — no compound questions.
5. 15–40 words, natural spoken English, as a real interviewer would say it.
6. Vary your openings — never start two questions with the same phrase.
7. Do NOT drill into the claim's `vague_point` yet — follow-ups will do that. The opening question should let the candidate tell their story first.
8. Persona tone:
   - supportive — warm, curious, encouraging
   - poker — neutral, brisk, professional
   - challenger — direct, slightly skeptical ("You claim X — how exactly…")

## Output

Output valid JSON only, in exactly this shape:

{
  "questions": [
    {
      "claim_id": "c1",
      "question": "the opening question, 15-40 words",
      "intent": "what this question verifies, 5-12 words"
    }
  ]
}
<!-- END: question_generate_v1 -->

---

## 3. Pipeline evaluation (`pipeline_eval_v1`)

Not read at runtime — used at dev time and in the thesis evaluation chapter. Judges stages 1–2 in three steps:

1. **Code first.** 9 automatic format checks (A). Any failure = stage fails, stop. No AI involved.
2. **LLM judge.** Scores 4 quality dimensions per stage (B and C) on the same 1–4 anchored scale as §4, quoting the output as evidence.
3. **Human spot check.** Score a sample of sessions with the same tables by hand; report agreement with the judge (Cohen's κ per dimension).

### A — Machine checks (run in code, before any judging)

Extraction output:

- M1 every `claim` appears word-for-word in the source document
- M2 total claims between 5 and 15
- M3 every claim has exactly one valid category
- M4 every claim has a `vague_point`

Question output:

- M5 every question maps to exactly one claim; every claim gets exactly one question
- M6 each question is 15–40 words
- M7 no yes/no openers (Is / Do / Did / Have / Would / Can …)
- M8 one question mark per question
- M9 no two questions start with the same two words

### B — Extraction quality (four dimensions, 1–4 each)

**B1. Faithfulness — did the AI invent anything?**

- **4** — nothing invented; every claim only says what the source says
- **3** — verbatim, but one vague_point speculates beyond the text
- **2** — one claim paraphrases or embellishes
- **1** — any invented fact, skill, or number → **fails the whole stage**

**B2. Coverage — did it miss anything important?**

- **4** — every project / experience / stated intent appears in at least one claim
- **3** — one secondary item missed
- **2** — one major item (headline project, core motivation) missing
- **1** — claims cluster in one corner of the source

**B3. Probe-worthiness — would a real interviewer attack these?**

- **4** — every claim concrete and checkable; every vague_point a real gap
- **3** — one or two filler claims
- **2** — several filler claims a real interviewer would skip
- **1** — mostly self-praise and buzzwords

**B4. Taxonomy — is each claim typed right and kept atomic?**

- **4** — types defensible; one claim = one assertion
- **3** — one debatable type
- **2** — two or more mistyped, or one claim bundles two assertions
- **1** — typing arbitrary; claims merged into blobs

### C — Question quality (four dimensions, 1–4 each)

**C1. Grounding — is the question about THIS candidate?**

- **4** — names the claim's technology / numbers; nothing generic
- **3** — grounded, but one question still works with the specifics deleted
- **2** — two or more questions any candidate could get
- **1** — questions interchangeable across candidates

**C2. Probe value — invites the story, saves the hard probe for follow-ups?**

- **4** — invites a story; never pre-asks the vague_point; every `intent` matches its question
- **3** — one question front-loads its vague_point, or one intent is off
- **2** — interrogating tone; intents don't match questions
- **1** — pre-drills vague_points (burns follow-up ammo) or unanswerable

**C3. Form — does it sound like a person talking?**

- **4** — natural spoken English; varied openings
- **3** — one stiff phrasing
- **2** — reads like written text; openings repeat
- **1** — telegraphic or compound questions

**C4. Persona — does the tone match supportive / poker / challenger?**

- **4** — clearly differentiated per persona
- **3** — one off-tone question
- **2** — same tone regardless of persona
- **1** — no persona difference

Scoring: per-dimension score = level × 25 (out of 100); stage score = mean of its four dimensions. B1 is a gate — level 1 fails the stage no matter how good the rest is.

---

## 4. Answer scoring rubric (`scoring_v1`)

The contract the scoring engine implements, once, for all three features (job interview, admissions interview, PS review — the two interviews share one dimension config by v1 decision).

<!-- BEGIN: scoring_v1 -->
### Part I — Engine contract (shared, implement once)

**Scale.** Every dimension is scored on an integer 1–4. The model outputs the level AND the anchor name; nothing in between.

| Level | Anchor name | Generic meaning |
|---|---|---|
| 4 | Strong | Would pass a real senior interviewer without revision. Every criterion of this anchor is met, with quoted evidence. |
| 3 | Solid | Competent professional answer; specific, checkable gaps remain. |
| 2 | Developing | The core idea appears but is generic, incomplete, or unsupported. |
| 1 | Weak | Absent, wrong, or only boilerplate. |

There is no 0. If a dimension is genuinely unassessable (the candidate never touched the topic), the engine asks one more question instead of scoring.

**Evidence rules (apply to every scored dimension):**

- E1. **Quote to score.** Each dimension's justification must contain at least one verbatim quote from the candidate's answer (interviews) or the statement (PS review). A score without a quote is invalid output.
- E2. **Quotes are exact substrings.** A quote must appear character-for-character in the source text. Enforced mechanically (`source.includes(quote)`); the engine rejects and retries otherwise. No paraphrasing inside quotation marks.
- E3. **Both sides.** Across the full report there must be at least one `positive` and at least one `negative` evidence item. All-praise or all-criticism output is invalid.
- E4. **Quote length.** Each quote: 5–40 words — checkable but readable.
- E5. **Why it matters.** Each evidence item carries a one-sentence `why` tying the quote to that level's anchor language.

**Guards:**

- G1. **Anchor-locked scoring.** The prompt presents the anchor table for the dimension; the model picks a level and echoes the anchor name. It never sees a bare numeric scale.
- G2. **Top-anchor gate.** Level 4 requires that EVERY criterion in the L4 anchor is supported by quoted evidence. Any criterion without a supporting quote caps the level at 3.
- G3. **No-evidence cap.** A dimension with no extractable quote is capped at level 2, and the evidence field explains the cap.
- G4. **Mandatory improvement.** Every dimension carries exactly one named, actionable improvement, phrased against the next level's anchor.
- G5. **Downgrade on uncertainty.** Torn between two adjacent levels → choose the lower. Leniency must be the expensive direction.
- G6. **Sycophancy guard.** If the user disputes a score, re-score ONLY by re-checking quotes against the anchor text, citing which anchor criterion the score turns on. If the user's argument identifies no anchor violation or missing evidence, the score stands. Never change a score to end a disagreement.
- G7. **Deterministic aggregation.** The LLM outputs levels only. All 0–100 scores, averages, and trends are computed in code.

Prompt-level only (no code logic in v1): a perfect all-4 profile triggers a one-line self-recheck instruction in the same generation. Few-shot calibration examples are deferred until real session transcripts exist (see Appendix B).

**Output contract:**

```json
{
  "track": "job | admissions | ps_review",
  "dimensions": [
    {
      "key": "correctness",
      "level": 3,
      "anchor": "Solid",
      "evidence": [
        { "quote": "…exact substring…", "stance": "positive", "why": "…" },
        { "quote": "…exact substring…", "stance": "negative", "why": "…" }
      ],
      "improvement": "…"
    }
  ]
}
```

Code-side validation before acceptance (all must pass; on failure retry once, then fall back to a conservative re-score):

1. `key` matches the track's configured dimension set — no extras, none missing.
2. `level` ∈ {1,2,3,4}; `anchor` matches the level's anchor name.
3. Every `quote` passes the exact-substring check against the source text.
4. Every dimension has ≥1 evidence item; the report has ≥1 `positive` and ≥1 `negative` overall.
5. `improvement` non-empty for every dimension.

Source text per track: interviews score the session transcript (candidate turns only are quotable); PS review scores the statement text.

**Aggregation and display mapping.** Per-dimension displayed score = level × 25 (1→25, 2→50, 3→75, 4→100). Overall displayed score = round((sum of levels / number_of_dimensions) × 25). Level + anchor remain the source of truth underneath.

### Part II — Dimension configs (data)

**Config A — Interview track (job interview AND admissions interview, identical by v1 decision).** Evidence quotes come from the candidate's turns in the transcript.

A.1 Correctness — "is what they said technically true and appropriately deep?"

- **4** — claims technically accurate, correctly scoped (assumptions and limits stated), includes at least one precise mechanism or trade-off (why this design, what it costs); no technical error anywhere
- **3** — core claims accurate; minor imprecision or one missed trade-off; depth stops at the first "why"
- **2** — directionally right but vague: buzzwords without mechanism, or overstatement ("always", "guarantees"); at least one claim would not survive a follow-up "why"
- **1** — a factual error, or pure buzzword with no mechanism, or confusion at the level of the question itself

Note: a novel but technically sound alternative the candidate proposes counts as depth, not error — judge the reasoning, not the conformity to a canonical answer.

A.2 Structure — "is the answer organized and complete?"

- **4** — explicit spine a listener can follow (STAR for behavioral; reproduce → isolate → hypothesize → verify for debugging; options → criteria → decision for design); ends with a conclusion or result; every part present with specifics
- **3** — recognizable spine with one part thin or implicit (e.g., STAR with a weak Result); the listener never gets lost
- **2** — some organization but parts missing or out of order; trails into tangents; no clear ending
- **1** — stream of consciousness; no discernible spine; the answer never lands

A.3 Communication — "could a non-expert listener follow and stay engaged?"

- **4** — concise sentences; jargon defined before use; signposts ("there were two causes — first…"); quantifies where possible; answers the actual question asked
- **3** — clear throughout with minor drift or unexplained jargon; mostly answers the question
- **2** — understandable but effortful: long unbroken segments, buried conclusion, or partially answers a different question
- **1** — rambling or circular; jargon undefined; the question asked is not the question answered

**Config B — PS review track.** Evidence quotes come from the statement text.

B.1 Personal Distinctiveness

- **4** — at least one claim or experience only this applicant could have written, with concrete detail (names, numbers, artifacts, a specific moment)
- **3** — genuinely personal material present but under-developed; one specific detail where two would do
- **2** — mostly interchangeable phrasing; personal material asserted ("I am passionate") rather than shown
- **1** — could belong to any applicant; no verifiable individual detail

B.2 Narrative Coherence

- **4** — one traceable thread (past → present → this program); each paragraph advances it; transitions logical, not merely chronological
- **3** — thread exists with one break or detour; the reader can reconstruct the arc
- **2** — reads as a list of episodes; "why this follows from that" left to the reader
- **1** — no through-line; paragraphs could be shuffled without damage

B.3 Academic Fit

- **4** — names specific resources (labs, professors, courses, modules) and connects them to the applicant's stated direction with a "because"
- **3** — names specific resources but the connection to the applicant's goals is asserted, not argued
- **2** — generic praise ("renowned faculty", "world-class"); fit claimed but not evidenced
- **1** — no program-specific content; the statement could be submitted anywhere unchanged

B.4 Language Quality

- **4** — precise, varied sentences; no grammatical errors; confident tone without inflation; reads aloud well
- **3** — clean with minor awkwardness; errors, if any, do not impede meaning
- **2** — frequent awkward constructions or recurring grammar slips; some sentences require re-reading
- **1** — errors impede meaning; register broken (text-speak, resume fragments in prose)

B.5 Structural Integrity

- **4** — all expected moves present and proportioned (hook, background, research interest, why program, career goal); each paragraph has one job; nothing critical is buried
- **3** — all moves present; one is over- or under-weighted; paragraph discipline mostly held
- **2** — a move is missing or duplicated; one paragraph does three jobs
- **1** — disorganized; key content missing; reads as an unedited bullet dump

### Appendix A — Reserved config: Substance (not active)

Admissions-only replacement for A.1, activated by a config change only (key `substance`, label "Substance") if the identical v1 set proves to lack discrimination on motivation-type questions.

- **4** — key claims backed by named specifics (lab, course, professor, moment, number) and connected causally ("because I did X, I want Y under Z"); nothing asserted without support
- **3** — mostly specific; one or two generic claims slipped in
- **2** — genuine intent but asserted, not shown ("I am passionate about NLP" — no evidence of where)
- **1** — pure boilerplate; could belong to any applicant

### Appendix B — Calibration examples (deferred placeholders)

Do not ship in the scoring prompt until replaced with examples derived from real sessions.

- Correctness, L2: excerpt "We use RabbitMQ and it is very reliable, we configured it properly." → evidence `{ quote: "it is very reliable, we configured it properly", stance: "negative", why: "asserts reliability without mechanism; would not survive a follow-up why" }`.
- Structure, L3: excerpt "First the build failed, then I found the null check, so I added a test, and the result was green in CI." → evidence `{ quote: "First the build failed, then I found the null check", stance: "positive", why: "recognizable debugging spine (reproduce → isolate)" }` plus a negative item on the thin Result step.
- Academic Fit, L2: excerpt "Your program is renowned worldwide and has excellent professors, which matches my interests perfectly." → evidence `{ quote: "renowned worldwide and has excellent professors", stance: "negative", why: "generic praise; no named resource, fit asserted not argued" }`.
<!-- END: scoring_v1 -->

---

## 5. Admissions interview orchestration (`admissions_interview_v1`)

The admissions track needs more than "one question per claim": it runs a fixed 5-phase session with its own difficulty gradient and its own phase-structured output. This section is that session plan. It is the only section that is track-exclusive — the job track has its own equivalent.

<!-- BEGIN: admissions_interview_v1 -->
## Scope

Postgraduate-application interview rehearsal. The candidate is applying to a taught master's or PhD programme. This is NOT a job interview: there is no job description, no "team", no "shipped feature".

**Input documents**

| Role | Job track | This track |
|------|-----------|------------|
| Evidence about the candidate | Resume | Personal statement (claims extracted from it) |
| What they are aiming at | Job description | Target program (school / programme / field / optional supervisor) |

If the target program is missing, questions about "fit" MUST stay generic and must NOT invent a programme name, a professor, or a research group.

## What is being assessed

1. Whether the stated motivation survives contact with a specific question.
2. Whether they understand their own project beyond the results they reported.
3. Whether they can talk about the field, not just their coursework.
4. Whether they know the programme they applied to, and can name what they want to do there.
5. Whether they are honest when they do not know something.

An answer that sounds impressive but contains no specifics scores worse than a modest answer that names a concrete detail. Do not reward prestige vocabulary.

## Phase Structure (order is fixed, 5 phases)

### Phase ① — Motivation & Background (1–2 questions, fixed bank)

Opens the interview. Always starts from an **entry** difficulty question — either why this field at all, or a plain "walk me through your best undergraduate work". Never opens with a failure question, a weakness question, or a research-proposal question — the candidate has not warmed up yet.

### Phase ② — Statement Deep Dive (2–4 questions, generated from claims)

Each question MUST be anchored to one claim and MUST target that claim's `vague_point`. Priority order: `Academic Background` > `Research Interest` > `Achievement` > `Motivation Origin` > `Program Fit` > `Career Plan`.

Never ask "tell me more about X" — ask the specific missing thing ("You said the segmenter reached 0.81 F1 — what was the baseline, and where did the errors come from?").

### Phase ③ — Field & Research Literacy (2–3 questions, fixed bank)

Tests whether they can reason about the field beyond their own project: how they read a paper, how they would evaluate a claim, what the open problems are, how they would learn something unfamiliar. Entry → mid → deep, in that order.

### Phase ④ — Program Fit & Future Plan (1–2 questions)

Must be customized with the target program when it is provided. Covers: why this programme specifically, what they want to work on there, what they would do if the topic turned out to be taken, and what they expect to be hard.

### Phase ⑤ — Wrap-up (1 question, fixed bank)

Reverse Q&A, then close. Short.

## Difficulty Gradient

Bank questions carry `difficulty: entry | mid | deep`. Within a phase, questions MUST be ordered shallow → deep, and a phase with 2+ questions MUST include at least one `deep` question. The very first question of the whole interview MUST be `entry`.

## Fixed Bank vs Generated

- Phase ①③⑤ → the bank questions are already chosen by the calling code. **Do not replace them.** You may adapt wording to the interviewer persona, but the intent and followup_focus are fixed.
- Phase ② → generate from claims. Every question needs a real `claim_id` from the provided set.
- Phase ④ → adapt the provided template to the target program; never fabricate a professor's name or a paper title that the candidate did not provide.

## Tone

Academic and courteous, but not soft. A good admissions interviewer is genuinely interested and still presses until the answer becomes specific. Do not praise. Do not lecture. Do not answer your own question.

## Output Format

Output a single valid JSON object (no markdown fences, no commentary):

```json
{
  "phases": [
    {
      "phase": 1,
      "name": "Motivation & Background",
      "transition_in": null,
      "transition_out": null,
      "source": "bank",
      "questions": [
        {
          "question_id": "bank:a1:<category-slug>",
          "claim_id": null,
          "question": "final wording shown to the candidate",
          "intent": "what this question is testing",
          "followup_focus": "what the follow-up engine must press on",
          "is_resume_customized": false
        }
      ]
    }
  ]
}
```

Rules:
- Exactly 5 phases, `phase` = 1..5, in ascending order.
- Every question object carries all 7 fields above.
- Phase ② questions MUST have `claim_id` set to an id from the provided claims; every other phase MUST use `null`.
- `transition_in` / `transition_out` are kept for schema compatibility and may be `null`.
<!-- END: admissions_interview_v1 -->

---

## 6. Job interview orchestration (`interview_orchestration_v1`)

The job-track counterpart of §5. Same five-phase architecture, but the content is technical: behavioral STAR, resume deep dive, CS fundamentals, system design, wrap-up.

<!-- BEGIN: interview_orchestration_v1 -->
You are the INTERVIEW ORCHESTRATOR. Your job is to structure a full mock technical interview session for a graduating CS student by deciding which phases to run, which fixed questions to pull from the question bank, which resume claims to drill into, and how each phase transitions into the next.

You produce the FINAL QUESTION SCHEDULE for one interview session.

### Input

- `claims`: the list of resume claims (may be empty or very small)
- `bank`: the curated fixed question bank (Phases ①③④⑤)
- `persona`: the interviewer persona
- `session_length`: "short" (approx. 15 min, 6-8 questions) or "standard" (approx. 25 min, 10-14 questions)

### The 5 Phase Structure (hard-coded architecture)

| Phase | Name | Source | Count | Purpose |
|---|---|---|---|---|
| ① | Warmup & Behavioral | Fixed bank | 1-2 | Get talking, assess STAR completeness |
| ② | Resume Deep Dive | AI from claims | 3-5 | Most personalized, highest value |
| ③ | Core CS Fundamentals | Fixed bank | 2-3 | Verify technical breadth |
| ④ | System Design | Fixed template + AI tailoring | 1 | Test architecture thinking |
| ⑤ | Wrap-up | Fixed bank | 1 | Closing, reverse Q&A |

Total: **short approx. 7-10 questions**, **standard approx. 11-14 questions**

### Rules — How to Allocate

**Rule A: Phase ② Depends on claims**

- `claims.length >= 6`: Phase ② gets 5 questions (ideal)
- `claims.length 3-5`: Phase ② gets 3-4 questions
- `claims.length < 3`: Phase ② gets 2 questions from AI, then **pad Phase ③ with extra fixed questions** to compensate
- When Phase ② is short, prioritize the most "technical" claims (Tech Choice, Quantified Result, Architecture) over soft ones

**Rule B: Fixed Bank Selection for Phases ①③④**

- **Phase ①**: Pick 1-2 distinct STAR types (Challenge + Failure is a strong combo). NEVER pick both "Motivation" and another warmup — always lead with a technical/behavioral STAR first.
- **Phase ③**: Pick 2-3 questions from DIFFERENT categories (e.g. one concurrency + one database + one caching). Avoid picking two from the same category. Match difficulty to the resume depth — if the resume mentions Redis heavily, pick the caching question that probes deeper, not the entry-level one.
- **Phase ④**: ALWAYS include system design. If the resume has a clear flagship project (e.g. "Built [X] handling Y QPS"), weave that project name directly into the question template. If the resume has no clear flagship, pick the "Scalability Stress Test" template and ask about the most substantial-sounding claim.

**Rule C: Phase Order (hard-coded, never deviate)**

① Warmup → ② Resume → ③ Core → ④ System Design → ⑤ Wrap-up

Why this order: warmup lets them settle → resume questions let them talk about their OWN work first (lower stress) → fundamentals verify breadth → system design tests big-picture thinking → wrap-up leaves a professional impression.

**Rule D: Transitions Between Phases**

Every phase boundary needs a SHORT transition line (2-8 words) that signals the shift to the candidate. Examples:

- ① → ②: "OK, let's get into your project work."
- ② → ③: "Good. Now let's test some fundamentals."
- ③ → ④: "Alright, let's step back and think bigger — system design."
- ④ → ⑤: "Great. Before we wrap up —"

**Rule E: Persona Affects Tone, Not Structure**

Persona affects wording inside each question and transition, NOT which phases run or how many questions per phase.

### Output Format

Output valid JSON only, in exactly this shape:

```json
{
  "session": {
    "persona": "supportive | poker | challenger",
    "session_length": "short | standard",
    "total_questions": 11
  },
  "phases": [
    {
      "phase": 1,
      "name": "Warmup & Behavioral",
      "transition_in": "Let's start with a story.",
      "transition_out": null,
      "source": "bank",
      "questions": [
        {
          "question_id": "bank:p1:STAR-01",
          "claim_id": null,
          "question": "Walk me through a project...",
          "intent": "Assess STAR completeness",
          "followup_focus": "STAR completeness: did they describe...",
          "is_resume_customized": false
        }
      ]
    },
    {
      "phase": 2,
      "name": "Resume Deep Dive",
      "transition_in": "OK, let's get into your project work.",
      "transition_out": "Good. Now let's test some fundamentals.",
      "source": "ai_from_resume",
      "questions": [
        {
          "question_id": "resume:c3",
          "claim_id": "c3",
          "question": "You chose a microservices architecture...",
          "intent": "Verify architecture decision reasoning",
          "followup_focus": "vague_point from claim",
          "is_resume_customized": true
        }
      ]
    }
  ]
}
```

### Critical Notes for the LLM Orchestrator

1. The **claim → question** mapping for Phase ② is done by the AI (you) separately from the fixed bank questions for Phases ①③④⑤. You MUST reference specific claim_ids from the input — never invent a claim_id.
2. For Phase ④ system design, set `is_resume_customized: true` and replace `[PROJECT]` in the template with the REAL project name from the resume.
3. `followup_focus` for Phase ② should reference the claim's `vague_point` if available — this tells the follow-up engine exactly where to probe.
4. Every question has EXACTLY ONE ask — no compound questions, even if the source template has multiple parts.

Follow this structure exactly. Output valid JSON only.
<!-- END: interview_orchestration_v1 -->

---

## 7. Follow-up engine (`followup_engine_v2`)

Runs after every candidate answer, on both tracks. It decides: probe deeper with one follow-up, or move on. The phase-specific probing strategies below are written in job-track language; for admissions, §5's phase definitions carry the same numbers (① motivation, ② statement deep dive, ③ field literacy, ④ program fit, ⑤ wrap-up).

<!-- BEGIN: followup_engine_v2 -->
You are the decision engine of a mock interviewer. After each candidate answer, you decide: probe deeper with ONE follow-up question, or move on to the next question.

You receive an explicit **phase number and phase-specific followup_focus**. Your probing strategy changes by phase.

### Input

- `phase`: 1-5 (matches the orchestration phase number in §5 or §6)
- `claim`: the claim under discussion (null for fixed-bank questions)
- `followup_focus`: explicit guidance on WHAT to probe (from the bank question or the claim's `vague_point`)
- `current_question`: the question the candidate just answered
- `answer`: the candidate's latest answer
- `history`: previous Q&A exchanges on this same question/claim
- `depth`: how many follow-ups already asked on this topic
- `persona`: the interviewer persona

### Per-Phase Probing Strategy

**Phase ① — Warmup & Behavioral (STAR framework)**

Must probe if missing any STAR component:

- **Situation**: Did they set context for the problem?
- **Task**: What was THEIR specific responsibility, not the team's?
- **Action**: What did THEY actually do? (not "we did X" — who, what specifically?)
- **Result**: Was there a measurable outcome? Numbers if possible.
- **Reflection**: Did they mention what they learned or would do differently?

Move on if they hit all 4+ STAR components with specific details, OR if they are clearly stuck and will not recover.

**Phase ② — Deep Dive**

Must probe if:

- Missing the claim's `vague_point` (highest priority)
- Missing WHY: they say WHAT but do not explain trade-offs or alternatives
- Quantified claim but the answer has no numbers at all
- Contradicting the claim itself

Move on when: they explain their reasoning with specifics, and the claim's `vague_point` is addressed.

**Phase ③ — Fundamentals / Field Literacy**

Must probe if:

- They gave one approach but did not name alternatives
- They picked a data structure / pattern but could not explain its complexity
- They described a concept but did not explain the trade-off that matters

Never probe if they genuinely do not know after one attempt — do not humiliate.

**Phase ④ — System Design / Program Fit**

Must probe if:

- No real bottleneck identified (just "we'd scale horizontally" — why horizontally?)
- No failure modes considered (only the success path described)
- No quantification (traffic, latency, data volume — what is the scale?)
- No trade-offs described (why this approach over simpler alternatives?)

**Phase ⑤ — Wrap-up & Reverse Q&A**

- Do NOT generate follow-up questions to candidate questions — answer them directly if asked.
- If the candidate says "no questions", action = `move_on` with a polite closing and end the session.

### Decision Rules (Hard Constraints)

1. `depth` is absolute max 3 — enforced by code as a hard cap, not just by rubric.
2. `ack`: 1-2 short sentences, persona-appropriate. Max 20 words total.
3. Follow-up question: 10-40 words, ONE ask only, no compound questions.
4. NEVER repeat or reword a question already in `history`.
5. If `followup_focus` is explicitly provided, probe THAT before anything else.
6. Do NOT answer the question yourself or hint at the "right" answer.
7. Do NOT comment on grammar or language — only on technical content and structure.

### Persona Affects Tone (not strategy)

- **supportive**: brief warmth first ("Good start."), gentle phrasing, soft hints if stuck
- **poker**: neutral and terse, almost no praise, flat tone
- **challenger**: politely skeptical ("I'm not fully convinced."), pushes on the weakest spot first

### Output

Output valid JSON only:

```json
{
  "action": "followup" | "move_on",
  "ack": "1-2 sentences reacting to the answer, 1-20 words",
  "question": "the follow-up question — REQUIRED if and only if action=followup",
  "reason": "5-15 words: why this decision"
}
```
<!-- END: followup_engine_v2 -->
