# Rubric System — v2 (master file)

Single source of truth for every rule the model follows. Runtime code reads only the text between
the `BEGIN` and `END` comment markers and embeds it into prompts; text outside the markers is
documentation and is never sent to the model.

| Marker | Stage | Consumer |
|---|---|---|
| `extract_v2` | 2.1 Extraction | `/api/resume/extract`, `/api/admissions/extract` |
| `question_generate_v2` | 2.2 Question generation | `/api/interview/generate`, `/api/admissions/generate` |
| `followup_engine_v3` | 2.3 Follow-up | `/api/interview/followup` |
| `scoring_v2` | 2.4 Scoring, shared part | `/api/evaluate` |
| `correctness_job_v2` | 2.4.4 Correctness, technical interview | appended after `scoring_v2` |
| `correctness_admissions_v2` | 2.4.4 Correctness, admissions interview | appended after `scoring_v2` |
| `feedback_v2` | 2.5.2–2.5.3 Feedback | `/api/feedback` |
| `contest_v2` | 2.5.4 Response to a challenge | `/api/feedback/contest` |
| `ps_review_v1` | Supplementary: personal statement review | `/api/ps/review` |

How to read this file:

- **[code]** marks a rule that code enforces mechanically. The prompt still states it, so the model
  avoids the violation instead of being rejected for it.
- **[judgement]** marks a rule that only a reader of the output can assess.
- The two tracks share every stage. The only thing that differs is the correctness criteria, which
  is why they are two small markers appended to one shared scoring section rather than two copies
  of the whole section.
- All field values are in English, except verbatim quotations (`original_text`, `source_quote`,
  `quote`), which keep the language of the source document.

---

## 1. Extraction (`extract_v2`)

<!-- BEGIN: extract_v2 -->
## Task

Decompose the document into **minimal propositions, each verifiable on its own**. Every later
question is built on one of these propositions.

A whole sentence must not be used as a question target: it usually mixes several items, and when
it is only partly correct there is no way to attribute the failure.

The same rules apply to a résumé and to a personal statement. Only `source_type` differs.

## Fields

| Field | Meaning | Constraint |
|---|---|---|
| `claim_id` | Identifier of the source sentence | `C1`, `C2`, … |
| `original_text` | The sentence as written | Verbatim, source language |
| `predicate_id` | Identifier of the proposition | `C1-P1`, `C1-P2`, … |
| `predicate_text` | Normalised statement | 5–40 words, English |
| `source_quote` | The wording that supports it | Verbatim substring of the source |
| `check_worthiness` | Whether it is worth interview time | `high` / `medium` / `low` |
| `probe_types` | Angles from which to probe | Subset of the six below |

`check_worthiness`:

- `high` — a core contribution or a key technical decision.
- `medium` — meaningful but secondary detail.
- `low` — record-keeping information such as dates, employer names, degrees.

`probe_types` — exactly these six, no others:

| Value | What it asks |
|---|---|
| `mechanism` | How it was implemented |
| `tradeoff` | What was given up by choosing this approach |
| `failure_mode` | Under what conditions it breaks down |
| `motivation` | Why the work was undertaken |
| `scope` | What the candidate was responsible for; how far the claim applies |
| `accuracy` | Whether numbers and terminology are precise |

## Hard rules

1. **[code]** `source_quote` must appear character-for-character in the source document. Do not
   paraphrase, translate, repair punctuation, or merge separate spans.
2. **[judgement]** One proposition states one thing. Do not join two independent clauses with
   "and", "because", "which led to", or "resulting in".
3. **[judgement]** Do not extract dates, employer names, degree titles, or tool names on their own.
   A statement needs at least two of: a specific object, a specific action, a specific result.
4. **[code]** Produce 3–20 propositions per document. Fewer means under-decomposition; more means
   details were split that should have been consolidated.
5. `predicate_text` normalises the wording but adds no fact that is not in the source.
6. **[code]** A proposition with `check_worthiness: "high"` must carry at least two `probe_types`.
7. **[code]** `probe_types` values must come from the six listed above.
8. Use English for `predicate_text`, `check_worthiness`, `probe_types` and `source_type`.
   Keep `original_text` and `source_quote` in the source language.

## Output format

Output a single valid JSON object. No markdown fences, no commentary.

```json
{
  "source_type": "resume",
  "claims": [
    {
      "claim_id": "C1",
      "original_text": "verbatim sentence from the source",
      "predicates": [
        {
          "predicate_id": "C1-P1",
          "predicate_text": "normalised statement, 5-40 words",
          "source_quote": "verbatim span from the sentence",
          "check_worthiness": "high",
          "probe_types": ["mechanism", "tradeoff"]
        }
      ]
    }
  ]
}
```
<!-- END: extract_v2 -->

---

## 2. Question generation (`question_generate_v2`)

<!-- BEGIN: question_generate_v2 -->
## Task

For each proposition, write one to three interview questions. One question maps to exactly one
proposition, so that the quality of the answer can be attributed to a specific claim.

Questions are asked aloud and answered without preparation. They must be open-ended and must not
require a yes/no answer.

## Fields

| Field | Meaning | Constraint |
|---|---|---|
| `question_id` | Identifier | `Q1`, `Q2`, … |
| `question_text` | The question as asked aloud | Open-ended, one question only |
| `target_predicate_id` | The proposition it derives from | Must exist |
| `source_quote` | The supporting wording | Verbatim substring of the source |
| `probe_type` | The angle | One of the six directions |
| `bloom_level` | Thinking level required | `analyze` or `evaluate` |
| `expected_depth` | How far the answer must unfold | 1, 2, or 3 |

**Cognitive level.** Only two values are permitted. *Understand* and *apply* test recall and
procedural repetition, which a written test already covers; an interview tests whether the
candidate can decompose and weigh in the absence of a standard answer. So:

- `analyze` — the candidate must decompose, compare, or trace a cause.
- `evaluate` — the candidate must judge, weigh, or justify a choice under stated constraints.

**Expected depth** states how far the answer must unfold:

| Value | Unfolding | Criterion |
|---|---|---|
| 1 | Conclusion | States a position or result with no reason |
| 2 | Conclusion + reason | States "because of X", but X itself is not unpacked |
| 3 | Conclusion + reason + unfolding | The reason is unpacked into how it works, or a cost or failure boundary is added |

`expected_depth` is fixed by `probe_type`, not chosen freely:

| `probe_type` | `expected_depth` | Basis |
|---|---|---|
| `mechanism`, `tradeoff`, `failure_mode` | 3 | The value lies in whether the candidate can explain how it works and where it breaks; a bare conclusion carries no information |
| `motivation`, `scope` | 2 | These ask why the work was done and which part the candidate did; a reason or a boundary suffices |
| `accuracy` | 1 | These ask whether a number or term is precise; one clear answer completes them |

## Hard rules

1. **[code]** `source_quote` must appear character-for-character in the source document.
2. **[code]** `target_predicate_id` must exist in the extraction output.
3. **[code]** `probe_type` must be one of the `probe_types` declared for that proposition.
4. **[code]** `bloom_level` ∈ {`analyze`, `evaluate`}; `expected_depth` must follow the mapping above.
5. **[code]** Each entry contains exactly one question. Do not merge two questions with "and".
6. **[code]** One to three questions per proposition; 5–12 questions per document.
7. **[code]** Semantic similarity to an already generated question must stay below 85%. Different
   angles on the same proposition are not duplicates; rewordings of the same question are.
8. **[judgement]** The question must point at the proposition. "Tell me about your project" is
   too broad and must not appear.
9. **[judgement]** Do not embed the answer, a suggested approach, or an evaluation of the claim in
   the question.

## Output format

Output a single valid JSON object. No markdown fences, no commentary.

```json
{
  "questions": [
    {
      "question_id": "Q1",
      "question_text": "the question as asked aloud",
      "target_predicate_id": "C1-P1",
      "source_quote": "verbatim span from the source",
      "probe_type": "mechanism",
      "bloom_level": "analyze",
      "expected_depth": 3
    }
  ]
}
```
<!-- END: question_generate_v2 -->

---

## 3. Follow-up (`followup_engine_v3`)

<!-- BEGIN: followup_engine_v3 -->
## Task

The candidate has just answered one question. Decide whether to probe further, and if so advance
exactly one turn. A follow-up targets **what the answer lacks**; it is never a repetition of the
question that was just asked.

You always produce a spoken response. Whether the chain continues is carried by `is_termination`.

## Fields

| Field | Role | Constraint |
|---|---|---|
| `trigger_reason` | What the answer lacks | One of the four forms below |
| `response_preview` | Brief acknowledgement before probing | 10 words or fewer |
| `transition` | Anchors the probe in the candidate's own wording | Must quote a key phrase from the answer |
| `followup_question` | The question itself | 150 characters or fewer |
| `justification` | Why this probe, and which proposition it serves | Must name the `predicate_id` |
| `is_termination` | Whether the chain ends here | — |
| `termination_reason` | Why the chain ends | Required when `is_termination` is true |

**Trigger reason** — exactly four valid forms. Anything else is invalid:

1. A conclusion is given without a reason.
2. One direction is covered while another declared direction is missed.
3. The answer does not correspond to the question asked.
4. A statement is too vague to verify.

"The answer was too short" is not valid: that is an articulation issue, not a content gap.

**Where the probe lands** depends on the turn already taken. Turn 1 establishes the facts, turn 2
probes mechanism, turn 3 probes scope or failure conditions. Do not re-ask a level already covered.

**Termination reason** — exactly three valid forms:

1. Every declared direction for the proposition is covered.
2. The turn cap is reached.
3. The candidate states they cannot answer and prompting does not help.

## Hard rules

1. **[code]** `followup_question` ≤ 150 characters. Longer questions usually merge two questions,
   and the candidate answers only one.
2. **[code]** `response_preview` ≤ 10 words.
3. **[code]** `justification` must contain the `predicate_id` being probed.
4. **[code]** When `is_termination` is true, `termination_reason` must be present and must be one
   of the three forms above.
5. **[code]** Similarity to an earlier question in the same chain must stay below 80%. This
   threshold is tighter than in question generation because follow-ups stay close to one point,
   so a reworded repeat would otherwise pass.
6. **[judgement]** `trigger_reason` must describe what the actual answer lacks, not what a generic
   answer lacks.
7. **[judgement]** The follow-up must land at a level the previous question did not cover.
8. **[judgement]** No leading phrasing. Do not suggest the answer inside the question.
9. When terminating, still produce `response_preview` and a natural closing line. Do not ask a
   question in that turn; leave `followup_question` empty.

## Output format

Output a single valid JSON object. No markdown fences, no commentary.

```json
{
  "trigger_reason": "what the answer lacks, in one sentence",
  "response_preview": "brief acknowledgement, 10 words or fewer",
  "transition": "sentence quoting the candidate's own wording",
  "followup_question": "the question, 150 characters or fewer",
  "justification": "why this probe, naming the predicate_id",
  "is_termination": false,
  "termination_reason": ""
}
```
<!-- END: followup_engine_v3 -->

---

## 4. Scoring (`scoring_v2`)

The shared part of scoring. `correctness_job_v2` or `correctness_admissions_v2` is appended after
this section at run time, and must not be embedded inside it.

<!-- BEGIN: scoring_v2 -->
## Task

For one question-answer pair, assign a band in each of four dimensions and supply evidence that can
be located in the answer.

Output bands and evidence only. Totals, means and trends are computed in code.

## Scale

| Band | Meaning |
|---|---|
| Strong | No defect can be pointed to in this dimension, and every criterion at this band has evidence |
| Solid | The core is met, with one non-critical defect |
| Developing | The core is not met, but the answer is still recognisably responding to the question |
| Weak | The dimension essentially does not hold |

Output the band **name only**, never a number, never a decimal. A numeric range pulls judgement
toward the upper end and produces arithmetic instead of assessment.

## Division of labour

| Dimension | Answers | Judges only | Does not judge |
|---|---|---|---|
| `correctness` | Is the content true | Truth of the propositions in the answer | Unfolding, relevance, fluency |
| `relevance` | Does it answer the question asked | Correspondence between answer and question | Truth, depth, articulation |
| `depth` | Does it go beyond surface assertion | Mechanism, causation, cost, failure | Truth, relevance, fluency |
| `articulation` | Can the listener follow | Organisation, transitions, term explanation, grammar | Truth, depth, relevance |

The four dimensions coexist because answers exist that lose points on only one. Do not let one
dimension's verdict leak into another.

## Criteria

### Correctness

The criteria for this dimension are supplied below this section. They differ by track; use the
table you were given.

### Relevance

| Band | Criteria |
|---|---|
| Strong | Addresses the core of the question and covers every sub-question |
| Solid | The core is answered, but one sub-question is missed, or there is one mild digression |
| Developing | Broadly on topic, but contains a clearly off-topic passage |
| Weak | Essentially answering a different question |

### Depth

| Band | Criteria |
|---|---|
| Strong | At least one mechanism or causal chain is fully explained, and at least one cost or failure condition is covered |
| Solid | A mechanism is explained but only at the first level (states "X holds because of Y" without explaining why Y holds); a cost is mentioned but not developed |
| Developing | Only assertions or vague evaluation; no mechanism, cost, or causal reasoning |
| Weak | No substantive content to assess, or the question is restated instead of answered |

### Articulation

| Band | Criteria |
|---|---|
| Strong | A clear thread, natural transitions, terms explained at first use, no noticeable grammatical problems |
| Solid | The thread is discernible, with one awkward transition or unexplained term and at most one minor grammatical problem |
| Developing | The thread is unclear, several transition problems, and language errors impede understanding |
| Weak | Disorganised and hard to follow, with language seriously impeding understanding |

## Dimension boundaries

Four cases most often encroach on one another. They are decided as follows:

| Case | Dimension |
|---|---|
| An absolute claim that is false | `correctness` |
| A correct statement left unexpanded | `depth` |
| A correct statement that does not answer the question | `relevance` |
| Correct content the listener cannot follow | `articulation` |

The boundary between correctness and depth is the one rule to guard most closely:

> A false absolute claim counts against correctness; mere lack of unfolding counts against depth.

When one sentence contains both, judge the two separately. They must not offset each other.

## Evidence

Every dimension needs evidence. A band without a quotation is invalid output.

| # | Rule | Check |
|---|---|---|
| 1 | At least one evidence item per dimension | **[code]** |
| 2 | The quotation must be the exact wording of the answer | **[code]** |
| 3 | Strong needs positive evidence only; Solid and Developing need at least one of each; Weak needs negative evidence only | **[code]** |
| 4 | Quotation length 5–40 words | **[code]** |
| 5 | Each item states which band criterion it supports | **[judgement]** |

Rule 2 is the core constraint: quoting the original is not enough. Code compares the quotation
against the answer character-by-character and discards the item if it does not match. Do not
paraphrase inside quotation marks.

Rule 3 exists because a genuinely excellent answer has no negative evidence; requiring it at every
band would make Strong unreachable.

## Scoring constraints

| # | Constraint |
|---|---|
| 1 | Band names only, never numbers |
| 2 | For Strong, every criterion at that band needs evidence; one missing item drops the band to Solid |
| 3 | If no evidence can be produced at all, the band is capped at Developing |
| 4 | `improvement` states what would be needed to reach the band above; never write "should improve" |
| 5 | When torn between two adjacent bands, take the lower |
| 6 | On disagreement, re-check the band criteria; never change a band because the user insisted |
| 7 | Output dimension bands only; totals, means and trends are computed in code |
| 8 | A technically sound but unconventional solution counts in the candidate's favour |

## Constraints between dimensions

| Condition | Effect |
|---|---|
| `relevance` is Developing or lower | `correctness` and `depth` are capped at Developing |
| `articulation` is Weak | `correctness` and `depth` must state explicitly whether poor articulation is masking the real level |

The second is a statement requirement, not a cap: the band may stand, but the reasoning must be
given, because severe disorganisation makes "did not understand" easy to mistake for "cannot
answer".

## Output format

Output a single valid JSON object. No markdown fences, no commentary.

```json
{
  "evaluation_id": "E1",
  "question_id": "Q1",
  "dimensions": {
    "correctness": {
      "anchor": "Developing",
      "evidence": [
        { "quote": "exact wording from the answer", "stance": "negative", "why": "which band criterion this violates" },
        { "quote": "exact wording from the answer", "stance": "positive", "why": "which band criterion this supports" }
      ],
      "improvement": "To reach Solid, ..."
    },
    "relevance": {
      "anchor": "Strong",
      "evidence": [
        { "quote": "exact wording from the answer", "stance": "positive", "why": "which band criterion this supports" }
      ],
      "improvement": ""
    },
    "depth": {
      "anchor": "Developing",
      "evidence": [
        { "quote": "exact wording from the answer", "stance": "negative", "why": "which band criterion this violates" },
        { "quote": "exact wording from the answer", "stance": "positive", "why": "which band criterion this supports" }
      ],
      "improvement": "To reach Solid, ..."
    },
    "articulation": {
      "anchor": "Solid",
      "evidence": [
        { "quote": "exact wording from the answer", "stance": "positive", "why": "which band criterion this supports" },
        { "quote": "exact wording from the answer", "stance": "negative", "why": "which band criterion this violates" }
      ],
      "improvement": "To reach Strong, ..."
    }
  }
}
```

`improvement` is empty only when the band is Strong, because there is no band above it.
<!-- END: scoring_v2 -->

### 4.1 Correctness — technical interview (`correctness_job_v2`)

<!-- BEGIN: correctness_job_v2 -->
## Correctness — technical job interview

| Band | Criteria |
|---|---|
| Strong | All technical propositions are true and no absolute claim is untenable; or a technically sound but unconventional solution is proposed |
| Solid | Core propositions are true, with at most one non-critical detail wrong |
| Developing | At least one definite proposition is false, or an untenable absolute claim appears |
| Weak | A key judgement is wrong, or concepts are confused |

An absolute claim that is false belongs here, not in depth. A statement that is true but not
unfolded belongs in depth, not here.
<!-- END: correctness_job_v2 -->

### 4.2 Correctness — admissions interview (`correctness_admissions_v2`)

<!-- BEGIN: correctness_admissions_v2 -->
## Correctness — admissions interview

Admissions interviews do not judge technical propositions; they judge whether experience claims
are self-consistent and survive verification.

| Band | Criteria |
|---|---|
| Strong | Experience claims are internally consistent, the timeline has no contradiction, and there is no exaggeration or unverifiable absolute statement |
| Solid | Core claims are credible, with at most one vague or overly cautious detail |
| Developing | At least one claim looks exaggerated, or the timeline has a minor contradiction, or an unverifiable absolute statement appears |
| Weak | A key claim does not hold, or different experiences contradict each other |

A claim that is exaggerated or unverifiable belongs here, not in depth. A claim that is credible
but not unfolded belongs in depth, not here.
<!-- END: correctness_admissions_v2 -->

---

## 5. Feedback (`feedback_v2`)

<!-- BEGIN: feedback_v2 -->
## Task

Turn one scored answer into feedback the candidate can act on. A score alone is an evaluation, not
feedback; all three layers below are required.

## Three layers

| Layer | Answers | Content | Consequence if missing |
|---|---|---|---|
| `feed_up` | Where to aim | The criteria of the band one above the current band | No target, no direction |
| `feed_back` | Where the answer stands | The current band and the specific evidence | No sense of the gap |
| `feed_forward` | How to get there | Concrete actions aimed at that one band | Knowing the problem without knowing how to fix it |

## Fields

| Field | Content | Constraint |
|---|---|---|
| `dimension` | Which dimension this feedback addresses | One entry per dimension |
| `feed_up.criteria` | The target band's criteria in plain language | Do not quote terminology |
| `feed_back.evidence_highlights` | The evidence that decided the band | Must match the scoring output |
| `feed_forward.target_anchor` | The band the actions aim at | Exactly one above the current band |
| `feed_forward.action_items` | What to do next | Each starts with a verb and names a concrete object |

## Hard rules

1. **[code]** All three layers present for every dimension whose band is not Strong.
2. **[code]** `feed_forward.target_anchor` is exactly one band above the current band. Never skip a
   band: listing everything needed to reach Strong from Developing gives too many items to act on.
3. **[code]** Bands in the feedback must match the scoring output for that answer.
4. **[code]** Strong has no band above it, so that dimension carries no `feed_forward`.
5. **[judgement]** `feed_up.criteria` restates the target band's criteria in ordinary language. It
   does not repeat the rubric's terminology.
6. **[judgement]** An action item names a concrete object and a concrete move, such as "explain
   under what conditions the approach fails". "Improve depth" is not an action item.
7. Only produce per-question feedback. Session totals, means, weakest dimensions and trend are
   computed in code; do not generate them.
8. Write in the second person. Do not address the candidate in the third person.

## Output format

Output a single valid JSON object. No markdown fences, no commentary.

```json
{
  "question_id": "Q1",
  "per_dimension": [
    {
      "dimension": "depth",
      "feed_up": {
        "anchor": "Solid",
        "criteria": ["state how the practice works", "name one cost"]
      },
      "feed_back": {
        "anchor": "Developing",
        "evidence_highlights": ["the quotation that decided the band"]
      },
      "feed_forward": {
        "target_anchor": "Solid",
        "action_items": ["explain what each route solves", "explain the cost added by fusion"]
      }
    }
  ],
  "challenges_allowed": true
}
```
<!-- END: feedback_v2 -->

---

## 6. Response to a challenge (`contest_v2`)

<!-- BEGIN: contest_v2 -->
## Task

The candidate has contested a band or a piece of evidence. Respond by disclosing the reasoning
behind the judgement. The purpose is not to change the band, but to make the basis checkable.

Give all three elements together. A response missing any one of them is invalid.

| Element | Content |
|---|---|
| `basis` | Which criteria of the current band the answer does or does not meet |
| `quotation` | The exact wording from the answer that the judgement turns on |
| `change_condition` | What would have to appear in the answer for the band to change |

## Hard rules

1. **[code]** All three elements present and non-empty.
2. **[code]** `quotation` must be the exact wording of the answer, character-for-character.
3. **[judgement]** The response must argue from the band criteria, not from the candidate's
   confidence or persistence.
4. **[judgement]** If the candidate identifies no criterion violation and no missing evidence, keep
   the band and say so. Never change a band to end a disagreement.
5. If a criterion violation is identified, the band may be revised upward; state which criterion
   changed and re-check the evidence rules for the new band.

## Output format

Output a single valid JSON object. No markdown fences, no commentary.

```json
{
  "dimension": "depth",
  "anchor_before": "Developing",
  "basis": "which band criteria are met or missed",
  "quotation": "exact wording from the answer",
  "change_condition": "what the answer would have to contain for the band to change",
  "anchor_after": "Developing"
}
```
<!-- END: contest_v2 -->

---

## 9. Supplementary review: personal statement (`ps_review_v1`)

This stage sits outside the interview pipeline. It reviews a document, not an answer, and is not
part of the interview report.

Basis: L9 (statement-of-purpose rubric with sub-categories and quoted evidence), L13 (quotations
compared verbatim), L10 (behavioural anchors instead of good/bad labels), L7 (a detailed rubric
beats a holistic impression).

<!-- BEGIN: ps_review_v1 -->
## Task

Review a personal statement draft. Assign a band in each of four dimensions and quote the draft as
evidence. Do not rewrite the statement. Do not score it numerically.

## Dimensions

| Dimension | Question | Judges only |
|---|---|---|
| `purpose_fit` | Are the reasons for this programme specific | Named courses, supervisors, labs or papers and their link to the applicant's direction, not institutional reputation |
| `evidence_specificity` | Are experience claims checkable | Object, action and result in each substantive claim; precision of numbers and terms |
| `narrative_coherence` | Do experience, direction and programme form one chain | Explicit links from past work to the chosen field to this programme |
| `language_clarity` | Can the reader follow | Sentence length, transitions, terms explained at first use, grammar |

## Bands

Each cell states what must be observable in the draft.

| Dimension | Strong | Solid | Developing | Weak |
|---|---|---|---|---|
| `purpose_fit` | A concrete element is named and tied to the applicant's direction | A concrete element is named, but the link is only implied | Only generic praise of the institution | No reason for this programme, or it contradicts the stated direction |
| `evidence_specificity` | Every substantive claim names an object, an action and a result | One claim stops at participation without a result | Several claims are abstract, with no object or result | Experience is asserted with no checkable detail |
| `narrative_coherence` | One thread runs from experience through field to programme | The thread is visible, with one abrupt transition | The draft reads as a list; the link is stated but not shown | Sections are unrelated, or the direction changes without explanation |
| `language_clarity` | Clear throughout, terms explained, no impeding errors | One long or awkward sentence; meaning stays clear | Several long sentences or errors force re-reading | Meaning is frequently unclear |

## Hard rules

1. **[code]** Every quotation must appear character-for-character in the draft, and be 5–40 words.
2. **[code]** Every dimension needs at least one quotation; a band with no quotation is capped at
   Developing.
3. **[code]** Output band names only, never numbers.
4. **[judgement]** Quote only the draft. Do not quote the prompt or the programme name, and invent
   nothing.
5. **[judgement]** `improvement` names a concrete addition or cut, never "improve" or "be specific".
6. **[judgement]** Do not rewrite the statement; point at the wording that decides the band.

## Output format

Output a single valid JSON object. No markdown fences, no commentary.

```json
{
  "dimensions": {
    "purpose_fit": {
      "anchor": "Solid",
      "evidence": [
        { "quote": "exact wording from the draft", "stance": "positive", "why": "which criterion it supports" }
      ],
      "improvement": "To reach Strong, name the paper you read and the question it left open."
    },
    "evidence_specificity": { "anchor": "Developing", "evidence": [], "improvement": "Add the result and the scale to the second project." },
    "narrative_coherence": { "anchor": "Solid", "evidence": [], "improvement": "Link the teaching experience to the research direction." },
    "language_clarity": { "anchor": "Strong", "evidence": [], "improvement": "" }
  }
}
```
<!-- END: ps_review_v1 -->
