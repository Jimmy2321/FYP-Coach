# Interview Rehearsal System — Rubric Specification

## 0 Overview

### 0.1 Scope and Pipeline Stages

This document specifies **what each stage of the interview rehearsal pipeline must produce**, and the conditions that output must satisfy. Five stages are covered:

| Stage | Input | Output | Section |
|---|---|---|---|
| Extraction | Résumé / statement of purpose | A set of probeable claims | 2.1 |
| Question generation | A single claim | An interview question | 2.2 |
| Follow-up | The candidate's answer | One follow-up question | 2.3 |
| Scoring | Question and answer | Band and evidence across four dimensions | 2.4 |
| Feedback | Scoring result | Feedback shown to the user | 2.5 |

The five stages are chained by identifiers: claim identifiers are referenced by questions, question identifiers by scores, and scores by feedback. If any stage is missing, downstream stages cannot justify where a band came from.

The system covers two tracks: technical job interviews and study-abroad admissions interviews. Both tracks share the same stages and the same scoring dimensions; only the correctness dimension is defined separately per track (see 2.4.4).

**Scope boundary**: this document defines rules and decision criteria. It does not cover prompt wording, implementation, dimension weights, or interface copy.

### 0.2 Two Classes of Checks

| Class | Executed by | Applicable to | Typical targets |
|---|---|---|---|
| **Automated** | Code | Anything decidable by literal comparison | Whether a quotation appears verbatim in the source; whether a field is empty; whether a value is out of range |
| **Judgement** | Constrained generation plus sampling review | Anything requiring semantic understanding | Whether a claim is a single proposition; whether a question is open-ended; whether a follow-up goes deeper than the previous turn |

The two classes cannot be merged:

- **Assign everything to code**: code can only compare literals. For a requirement such as "must be a single proposition" it has no basis for judgement and degrades to keyword matching, producing frequent misclassification.
- **Assign everything to the model**: when checking a quotation it produced, the model does not regard the output as rewritten and therefore tends to pass it directly, which makes the check vacuous.

The resulting principle: **anything decidable by literal comparison must be checked by code, because the model tends to approve its own output; anything requiring semantic judgement must be constrained by rules and reviewed by sampling, because code cannot perform it.** Each checklist below marks which class a rule belongs to.

### 0.3 Outcome When a Rule Is Violated

| Level | Applies when | Action |
|---|---|---|
| Item discarded | A single output violates an automated check | Drop that item, keep the rest |
| Band downgraded | A single output meets the floor but not the declared level | Downgrade, do not discard |
| Stage regenerated | Overall count or structure falls short | Regenerate the whole stage |

### 0.4 Division Between Body and Appendices

The body states rules only, without examples. **Appendix A** provides one example running through all five stages together with counter-examples; **Appendix B** provides the output structure of each stage. The body refers to these as "A.x".

---

## 1 Literature Basis

### 1.1 Source List

Seventeen papers. Identifiers follow the order of the first stage each paper serves; every paper occupies exactly one row, and papers serving several stages list them all in the "Stages" column rather than being repeated.

| ID | Paper | Year | Venue | Stages | Role |
|---|---|---|---|---|---|
| L1 | FOLK: Explainable Claim Verification via Knowledge-Grounded Reasoning with LLMs (Wang & Shu) | 2023 | EMNLP Findings | Extraction, cross-cutting | Translation of claims into propositions; formal definition and procedure for per-proposition verification |
| L2 | EZInterviewer | 2023 | WSDM | Extraction | Reference point for knowledge-base-grounded questioning |
| L3 | A Systematic Review of Automatic Question Generation (Kurdi et al.) | 2020 | IJAIED | Questions | Task definition, evaluation metrics and method taxonomy for automatic question generation |
| L4 | Modular AI-Powered Interviewer (Adeseye et al.) | 2026 | arXiv:2601.11534 | Questions, follow-up, architecture | Module decomposition; four-part follow-up format; one engine with two configurations |
| L5 | MockLLM: Multi-Agent Collaboration for Job Interview | 2025 | KDD | Questions, follow-up | Bidirectional generation through reflection memory; also counter-evidence against unbounded follow-ups |
| L6 | Conversate: Reflective Learning and Dialogic Feedback | 2025 | CHI | Follow-up, scoring | Follow-up triggers and termination; dialogic feedback; measured sycophancy |
| L7 | G-Eval: NLG Evaluation using GPT-4 | 2023 | EMNLP | Scoring | Detailed rubrics with chain-of-thought and structured form filling improve agreement with human raters |
| L8 | Towards Smarter Hiring: LLMs and HR Interview Transcripts (Maity) | 2024 | arXiv | Scoring | Measured data: model mean 4.0 versus human interviewer 2.2; also reports verbosity bias |
| L9 | AI-Augmented Graduate Admissions: Statement of Purpose Review (Aggarwal) | 2025 | Purdue | Scoring | Rubric case study: six sub-categories on a 0–3 scale; requires quotations with both positive and negative aspects |
| L10 | VOPE: Hallucination of Vision-Language Models | 2026 | ACM MM | Scoring | Band design: explicit behavioural anchors instead of vague good/bad labels |
| L11 | Judging LLM-as-a-Judge with MT-Bench (Zheng et al.) | 2023 | NeurIPS | Scoring | Catalogue of systematic biases: position, verbosity, self-enhancement |
| L12 | Halo Effect in Job Performance Ratings (Viswesvaran et al.) | 2005 | JAP | Scoring | Validity threat: correlations between raters' dimension scores typically 0.6–0.8 |
| L13 | Teaching LLMs to Support Answers with Verified Quotes (Menick et al.) | 2022 | arXiv | Cross-cutting | Attach verifiable quotations at generation time and compare them verbatim in code |
| L14 | Enhancing LLM-Based Feedback: Insights from ITS and the Learning Sciences (Stamper et al.) | 2024 | arXiv:2405.04645 | Feedback | Review of the three-layer feedback model and design guidance |
| L15 | Feedback Literacy on AI-Enhanced Essay Writing (Hawkins et al.) | 2025 | AEHE | Feedback | Empirical finding: users need feedback literacy to use AI feedback effectively |
| L16 | Dialogic Peer Feedback: A Theoretical Framework (Er et al.) | 2021 | AEHE | Feedback | Theoretical framework for dialogic feedback |
| L17 | "My Grade is Wrong!": A Contestable AI Framework (Hong et al.) | 2024 | arXiv:2409.07453 | Feedback | Design in which users can contest feedback |

Papers by stage:

| Stage | Papers |
|---|---|
| Extraction | L1, L2 |
| Questions | L3, L4, L5 |
| Follow-up | L4, L5, L6 |
| Scoring | L6, L7, L8, L9, L10, L11, L12 |
| Cross-cutting | L1, L13 |
| Architecture | L4 |
| Feedback | L14, L15, L16, L17 |

### 1.2 Design Principles

Concrete thresholds and decision criteria appear in Section 2; this table records only where each design comes from.

| Stage | ID | Principle | Source |
|---|---|---|---|
| Extraction | EX1 | Decompose a compound claim into several propositions, each an independently verifiable sub-claim | L1 |
| Extraction | EX2 | Attach a source quotation to each proposition and compare it verbatim in code | L13 |
| Questions | QG1 | Attach a source quotation to each question so it remains traceable | L13, L3 |
| Questions | QG2 | Discard a question that is semantically redundant with existing ones | L4 |
| Follow-up | FO1 | Trigger on what the answer lacks, not on how short it is | L6 |
| Follow-up | FO2 | Format: short acknowledgement, transition, probing question, internal rationale | L4 |
| Follow-up | FO3 | Terminate when the turn cap is reached or all directions are covered | L6, L5 |
| Scoring | SC1 | Four bands; output the band name only, never a number | L8, L10 |
| Scoring | SC2 | Each band criterion must be an observable fact, free of subjective evaluative words | L6 |
| Scoring | SC3 | Strong needs positive evidence only; the two middle bands need both; Weak needs negative evidence only | L9 |
| Scoring | SC4 | Every piece of evidence must be a verbatim quotation, compared in code | L13, L9 |
| Scoring | SC5 | On user disagreement, re-check the band criteria; do not simply change the band | L6, L11 |
| Scoring | SC6 | A technically sound but unconventional solution counts in the candidate's favour | L10 |
| Scoring | SC7 | Independence of the four dimensions is tested on data; merge any pair correlating above 0.8 | L12 |
| Cross-cutting | GR1 | Every stage output must be traceable to the source text | L13, L1 |
| Feedback | FD1 | Three layers: feed-up, feed-back, feed-forward | L14, L15 |
| Feedback | FD2 | Users may contest; the system responds with argument rather than acquiescence | L17, L16 |
| Architecture | AR1 | One scoring engine with two criteria configurations | L4 |

### 1.3 Rationale for the Four Dimensions

Four dimensions are used, for three reasons:

1. **Independence is testable.** For each dimension one can construct an answer that loses points on that dimension alone while the other three remain normal. If no such answer exists, the two dimensions are measuring the same thing and should be merged. Verification in A.5.1.
2. **The literature's dimensions can be absorbed.** Every interview scoring dimension appearing in the core system papers falls into one of these four, with neither omission nor overlap.
3. **Effectiveness is ultimately decided by data.** If the four-dimension correlation matrix shows any pair above 0.8, that pair is merged (see 2.4.2 and L12).

### 1.4 One Engine, Two Configurations

Both tracks share the same stages and dimensions, and differ only in what correctness is judged against.

| Dimension | Technical job interview | Admissions interview |
|---|---|---|
| Correctness | Truth of technical propositions; whether scope is stated correctly | Whether experience claims are self-consistent, free of exaggeration, and verifiable |
| Relevance | Whether the technical question was answered | Whether "why this programme" was answered |
| Depth | Mechanism, cost, failure conditions | A causal account of how the experience led to this field |
| Articulation | Whether the listener can follow | Whether the listener can follow |

Relevance and depth judge the same object on both tracks and therefore share one set of criteria. Correctness judges different objects and is therefore defined separately (see 2.4.4).

---

## 2 Output Specification

### 2.1 Extraction

#### 2.1.1 Purpose

Decompose every substantive sentence of a résumé into several **minimal propositions, each verifiable on its own**. All later questions draw on these propositions.

A whole sentence should not be used directly as the basis for a question: it usually mixes several items, and when it is only partly correct there is no way to attribute the failure.

#### 2.1.2 Fields

| Field | Meaning | Constraint |
|---|---|---|
| Proposition text | Normalised statement | 5–40 words |
| Source quotation | The original wording supporting it | Must be a substring of the source |
| Probe value | Whether it is worth interview time | High / medium / low |
| Probe directions | Angles from which to probe | See below |

**Probe value** has three levels: high for core contributions or key technical decisions; medium for meaningful but secondary detail; low for record-keeping information such as dates or employer names. The purpose is to avoid spending interview time on low-value content.

**Probe directions** fall into six classes:

| Direction | What it asks |
|---|---|
| Mechanism | How it was implemented |
| Trade-off | What was given up by choosing this approach |
| Failure mode | Under what conditions it breaks down |
| Motivation | Why the work was undertaken |
| Scope | What the candidate was responsible for, and to what extent the claim applies |
| Accuracy | Whether numbers and terminology are precise |

The reason for six classes: different directions demand different answer depth (see 2.2.2). Without this distinction, questions collapse into broad prompts such as "tell me about your project".

#### 2.1.3 Checks

| # | Rule | Check | If violated |
|---|---|---|---|
| 1 | The source quotation must actually appear in the résumé | Automated, verbatim | Proposition discarded |
| 2 | Every source sentence yields at least one proposition | Automated, count | Sentence discarded |
| 3 | Probe value and probe direction must be permitted values | Automated | Proposition discarded |
| 4 | Total propositions per document between 3 and 20 | Automated, count | Stage regenerated |
| 5 | Each proposition must be single, not two independent clauses joined by coordination or causation | Judgement | Proposition rewritten |
| 6 | A proposition with high probe value has at least two probe directions | Automated, count | Lowered to medium, or directions added |
| 7 | Statements without substantive content must not be extracted | Judgement | Proposition discarded |

Basis for the bounds in rule 4: fewer than three indicates under-decomposition, since any application document contains at least three probeable claims; more than twenty indicates a failure to consolidate, splitting details such as tool names into separate propositions and losing the interview's focus.

Rule 7 criterion: a statement containing fewer than two of "specific object, specific action, specific result" is treated as lacking substance.

---

### 2.2 Question Generation

#### 2.2.1 Purpose

Generate an interview question for each proposition. One question maps to exactly one proposition, so that answer quality can be attributed.

#### 2.2.2 Fields

| Field | Meaning | Constraint |
|---|---|---|
| Question text | A question answerable aloud | Open-ended |
| Target proposition | The proposition the question derives from | Must exist |
| Source quotation | The matching résumé wording | Must be a substring of the source |
| Probe direction | One of the six directions | Must be among the proposition's declared directions |
| Cognitive level | The level of thinking required | See below |
| Expected depth | The minimum level the answer should reach | See below |

**Cognitive level** has four levels and starts at *analysis*:

| Level | Requirement | Form of the question |
|---|---|---|
| Understand | Restate terminology | Ask for the meaning of a term |
| Apply | Apply an established method | Ask for an implementation following known steps |
| Analyse | Decompose, compare, trace causes | Ask for the difference between two approaches and its cause |
| Evaluate | Judge, weigh, justify | Ask for a choice under given constraints, with reasons |

The reason for starting at *analysis*: the first two levels test recall and application, which a written test already covers. An interview should test whether the candidate can decompose and weigh in the absence of a standard answer.

**Expected depth** states how far the answer must unfold, in three levels:

| Level | Unfolding | Criterion |
|---|---|---|
| 1 | Conclusion | States a position or result without any reason |
| 2 | Conclusion + reason | States "because of X", but X itself is not unpacked |
| 3 | Conclusion + reason + unfolding | The reason is unpacked into how it works, or a cost or failure boundary is added |

The difference between the levels, illustrated by three answers to one question:

> Question: Why use consistent hashing rather than modulo assignment?
>
> Level 1: Because consistent hashing is better.
>
> Level 2: Because consistent hashing moves less data when nodes are added or removed.
>
> Level 3: Because consistent hashing maps both nodes and data onto the same ring, so adding or removing a node only affects the neighbouring interval and the amount moved is about 1/N; the cost is a more complex implementation and the need to handle data skew.

Level 1 offers only a verdict and supports no assessment of ability. Level 2 gives a reason, but the listener must still infer why less data moves. Level 3 unfolds the reason into how it works and states a cost, so the answer stands on its own.

The field is determined by the probe direction:

| Probe direction | Expected depth | Basis |
|---|---|---|
| Mechanism / trade-off / failure mode | 3 | The value of these questions lies in whether the candidate can explain how it works and where it breaks; a bare conclusion carries no information |
| Motivation / scope | 2 | These ask why the work was done and which part the candidate did; a reason or a boundary suffices, and there is no mechanism left to unpack |
| Accuracy | 1 | These ask whether a number or term is precise; one clear answer completes them, and probing mechanism would miss the point |

#### 2.2.3 Checks

| # | Rule | Check | If violated |
|---|---|---|---|
| 1 | The source quotation must actually appear in the résumé | Automated | Question discarded |
| 2 | The target proposition must exist | Automated | Question discarded |
| 3 | The probe direction must be among the proposition's declared directions | Automated | Question discarded |
| 4 | Cognitive level and expected depth must be permitted values and must follow the mapping above | Automated | Question discarded |
| 5 | Semantic similarity to existing questions must not exceed 85% | Automated, vector comparison | Question discarded |
| 6 | One to three questions per proposition | Automated, count | Topped up or truncated |
| 7 | The question must be open-ended, not answerable yes/no | Judgement | Rewritten |
| 8 | The question must point at the proposition, not be broad | Judgement | Rewritten |
| 9 | Total questions per document between 5 and 12 | Automated, count | Topped up or truncated |

Threshold in rule 5: below 80% would mark different angles on the same matter as duplicates; above 90% would let through rewordings of the same question. 85% is the compromise.

---

### 2.3 Follow-up

#### 2.3.1 Purpose

After the candidate answers, decide whether to probe further, and if so advance exactly one turn. The follow-up targets **what the answer lacks**, not a repetition of the question.

#### 2.3.2 Fields

A follow-up consists of four text segments and one closing flag:

| Field | Role | Constraint |
|---|---|---|
| Trigger reason | What the answer lacks | Must be a content-level gap |
| Acknowledgement | A brief response before probing, to avoid an abrupt jump | 10 words or fewer |
| Transition | Picks up the candidate's wording and anchors the probe | Must quote a key phrase from the answer |
| Follow-up question | The question itself | 150 characters or fewer |
| Terminating | Whether this follow-up chain ends | A reason is required when terminating |

The 150-character limit: longer sentences usually merge two questions, and the candidate answers only one.

**Trigger reason** has exactly four valid forms: a conclusion without a reason; one direction covered while another is missed; an answer that does not correspond to the question; a statement too vague to verify. "The answer was too short" is not valid, because that is an articulation issue rather than a content gap.

**The turn cap defaults to 3**: turn 1 establishes the facts, turn 2 probes mechanism, turn 3 probes scope or failure conditions. Going further leaves the scope of the résumé sentence, and scoring loses its basis.

**Termination reason** has exactly three forms: all directions for the proposition are covered; the turn cap is reached; the candidate states they cannot answer and prompting does not help.

#### 2.3.3 Checks

| # | Rule | Check | If violated |
|---|---|---|---|
| 1 | Follow-up question no longer than 150 characters | Automated, count | Rewritten |
| 2 | Acknowledgement no longer than 10 words | Automated, count | Rewritten |
| 3 | The internal rationale must name the proposition being probed | Automated | Rewritten |
| 4 | Turns per chain must not exceed the cap | Automated, count | Forced termination |
| 5 | Similarity to earlier questions in the chain must not exceed 80% | Automated, vector comparison | Rewritten |
| 6 | The trigger reason must reflect the candidate's actual answer | Judgement | Rewritten |
| 7 | It must go deeper than the previous question, not repeat it | Judgement | Rewritten |
| 8 | A reason must be stated when terminating | Automated | Rewritten |
| 9 | No leading phrasing | Judgement | Rewritten |

The threshold in rule 5 is lower than in question generation (80% versus 85%): follow-ups stay close to the same point, so if it is not tightened, a reworded repeat still passes.

Rule 7 criterion: the follow-up must land at a level the previous question did not cover, moving from "did you do it" to "how did you do it", and then to "under what conditions does it fail".

---

### 2.4 Scoring

#### 2.4.1 Purpose

For one question-answer pair, assign a band in each of four dimensions and supply evidence that can be located in the source. Only bands and evidence are output; totals and trends are computed in code.

#### 2.4.2 Division of Labour

| Dimension | Question it answers | Judges only | Does not judge |
|---|---|---|---|
| Correctness | Is the content true | Truth of the propositions in the answer | Unfolding, relevance, fluency |
| Relevance | Does it answer the question asked | Correspondence between answer and question | Truth, depth, articulation |
| Depth | Does it go beyond surface assertion | Mechanism, causation, cost, failure | Truth, relevance, fluency |
| Articulation | Can the listener follow | Organisation, transitions, term explanation, grammar | Truth, depth, relevance |

The four dimensions coexist because answers exist that lose points on only one. If no such answer can be constructed, the two dimensions measure the same thing and should be merged. Verification in A.5.1.

#### 2.4.3 Universal Meaning of the Bands

| Band | Meaning |
|---|---|
| Strong | No defect can be pointed to in this dimension, and every criterion at this band has evidence |
| Solid | The core is met, with one non-critical defect |
| Developing | The core is not met, but the answer is still recognisably responding to the question |
| Weak | The dimension essentially does not hold |

Bands are output by name rather than by number. Given a numeric range, models cluster toward the upper end and emit decimals such as 3.5, which is arithmetic rather than judgement. Code maps names to 4 / 3 / 2 / 1.

#### 2.4.4 Criteria by Dimension

**Correctness — technical job interview**

| Band | Criteria |
|---|---|
| Strong | All technical propositions are true and no absolute claim is untenable; or a technically sound but unconventional solution is proposed |
| Solid | Core propositions are true, with at most one non-critical detail wrong |
| Developing | At least one definite proposition is false, or an untenable absolute claim appears |
| Weak | A key judgement is wrong, or concepts are confused |

**Correctness — admissions interview**

Admissions interviews do not judge technical propositions; they judge whether experience claims are self-consistent and survive verification.

| Band | Criteria |
|---|---|
| Strong | Experience claims are internally consistent, the timeline has no contradiction, and there is no exaggeration or unverifiable absolute statement |
| Solid | Core claims are credible, with at most one vague or overly cautious detail |
| Developing | At least one claim looks exaggerated, or the timeline has a minor contradiction, or an unverifiable absolute statement appears |
| Weak | A key claim does not hold, or different experiences contradict each other |

The two definitions are separate because the object differs: the same sentence is judged by propositional truth in a technical interview and by self-consistency in an admissions interview, so one set of criteria cannot serve both.

**Relevance**

| Band | Criteria |
|---|---|
| Strong | Addresses the core of the question and covers every sub-question |
| Solid | The core is answered, but one sub-question is missed or there is one mild digression |
| Developing | Broadly on topic, but contains a clearly off-topic passage |
| Weak | Essentially answering a different question |

**Depth**

| Band | Criteria |
|---|---|
| Strong | At least one mechanism or causal chain is fully explained, and at least one cost or failure condition is covered |
| Solid | A mechanism is explained but only at the first level (it states "X holds because of Y" without explaining why Y holds); a cost is mentioned but not developed |
| Developing | Only assertions or vague evaluation; no mechanism, cost, or causal reasoning |
| Weak | No substantive content to assess, or the question is restated instead of answered |

**Articulation**

| Band | Criteria |
|---|---|
| Strong | A clear thread, natural transitions, terms explained at first use, no noticeable grammatical problems |
| Solid | The thread is discernible, with one awkward transition or unexplained term and at most one minor grammatical problem |
| Developing | The thread is unclear, several transition problems, and language errors impede understanding |
| Weak | Disorganised and hard to follow, with language seriously impeding understanding |

#### 2.4.5 Dimension Boundaries

Four cases most often encroach on one another; they are decided as follows, with concrete sentences in A.5.2.

| Case | Dimension |
|---|---|
| An absolute claim that is false | Correctness |
| A correct statement left unexpanded | Depth |
| A correct statement that does not answer the question | Relevance |
| Correct content the listener cannot follow | Articulation |

The boundary between correctness and depth is the one rule this specification guards most closely:

> **A false absolute claim counts against correctness; mere lack of unfolding counts against depth.**

When one sentence contains both, the two are judged separately and must not offset each other.

#### 2.4.6 Evidence Requirements

Every band in every dimension must be supported by evidence:

| # | Rule | Check | If violated |
|---|---|---|---|
| 1 | At least one piece of evidence per dimension | Automated, count | Dimension invalid |
| 2 | The quotation must be the exact wording of the answer | Automated, verbatim | Evidence discarded |
| 3 | Strong needs positive evidence only; the two middle bands need at least one of each; Weak needs negative evidence only | Automated | Middle bands rewritten if one class is missing |
| 4 | Quotation length between 5 and 40 words | Automated, count | Rewritten |
| 5 | Each piece of evidence must state which band criterion it supports | Judgement | Rewritten |

Rule 2 is the core constraint of this specification: if the requirement merely says "quote the original", the model rewrites the wording and puts it in quotation marks, which looks like a citation but is paraphrase. A quotation holds only when code performs the verbatim comparison.

Basis for the band requirements in rule 3: if every band required both positive and negative evidence, a genuinely excellent answer could never reach Strong, since it has no negative evidence.

#### 2.4.7 Scoring Constraints

| # | Constraint | Risk it prevents |
|---|---|---|
| 1 | Output band names only, never numbers | A numeric range pulls the model upward and produces decimals |
| 2 | For Strong, every criterion at that band needs evidence; one missing item drops the band to Solid | Awarding the top band without evidence |
| 3 | If no evidence can be produced at all, the band is capped at Developing | High marks for absent content |
| 4 | State what would be needed to reach the band above; never write "should improve" | Unactionable feedback |
| 5 | When weighing two adjacent bands, take the lower | Systematic upward drift |
| 6 | On user disagreement, re-check the band criteria; do not change the band outright | Changing a band because the user insisted |
| 7 | The model outputs dimension bands only; totals, means and trends are computed in code | Making the model do arithmetic |
| 8 | A technically sound but unconventional solution counts in the candidate's favour | Penalising answers that depart from a model answer |

Rule 6 in practice: after a challenge, the system re-checks whether the current band's criteria are met and states the conclusion with the corresponding evidence; it must not agree without re-checking.

#### 2.4.8 Constraints Between Dimensions

| Condition | Effect | Basis |
|---|---|---|
| Relevance ≤ 2 | Correctness and depth are capped at 2 | When the answer is seriously off-topic, its correct content and depth do not address the question and should not earn credit |
| Articulation = 1 | Correctness and depth require an explicit note on whether poor articulation is masking the real level | Severe disorganisation makes "did not understand" easy to mistake for "cannot answer" |

The second is not a cap but a mandatory statement: the band may stand, but the reasoning must be given.

---

### 2.5 Feedback

#### 2.5.1 Purpose

Turn scores into information the user can understand and act on: where they are, where they should aim, and what to do next, while allowing them to contest the judgement.

#### 2.5.2 Three Layers

Feedback has three layers, each answering one question; all three are required for it to count as feedback:

| Layer | Question it answers | Content | Consequence if missing |
|---|---|---|---|
| Target | Where to aim | Criteria of the band above | No target, no direction |
| Current | Where the answer stands | Current band and specific evidence | No sense of the gap |
| Action | How to get there | Concrete actions aimed at the band above | Knowing the problem without knowing how to fix it |

A score alone is an evaluation, not feedback.

**The action layer points to the next band only**, never skipping one. Listing everything needed to reach Strong directly from Developing produces too many items to act on. Strong has no band above it, so that dimension needs no action layer.

#### 2.5.3 Session Summary versus Per-Question Feedback

| Level | Content | Use |
|---|---|---|
| Session summary | Number of questions, dimension means, weakest dimensions, trend | Shows overall position |
| Per-question feedback | Three-layer feedback and the contest entry point | Shows how to improve |

Session summary figures are computed in code, not generated by the model, so that the model cannot inflate scores a second time during summarisation.

The weakest dimensions are the two with the lowest means. Ties are broken by a fixed order (correctness, relevance, depth, articulation) to guarantee that identical data yield identical output.

Trend: average the four dimensions per question to obtain one value per question; if the mean of the later half exceeds the earlier half by more than 0.3 the trend is *improving*, if lower by more than 0.3 it is *declining*, otherwise *stable*. The 0.3 threshold corresponds to half a band; smaller movement is not a trend.

#### 2.5.4 Contest Mechanism

Users may contest any band or any piece of evidence. The purpose is not to change the score but to require the system to disclose its reasoning. Three items must be given together:

| Element | Content |
|---|---|
| Basis | Which criteria the current band corresponds to |
| Quotation | The original wording supporting the judgement |
| Change condition | What would have to appear in the answer for the band to change |

The third turns a dispute into a testable condition rather than a negotiation.

#### 2.5.5 Checks

| # | Rule | Check | If violated |
|---|---|---|---|
| 1 | All three layers present, covering every non-Strong dimension | Automated | Dimension rewritten |
| 2 | The target band in the action layer must be one above the current band | Automated | Rewritten |
| 3 | Action items must correspond to the target layer's criteria and be executable | Judgement | Rewritten |
| 4 | Bands in the feedback must match the scoring result | Automated | Item regenerated |
| 5 | Session summary figures must match per-question data | Automated, recomputed | Recomputed values prevail |
| 6 | The target layer must restate criteria in plain language, not quote terminology | Judgement | Rewritten |
| 7 | Action items must be concrete next steps, not general advice | Judgement | Rewritten |
| 8 | A contest response must give basis, quotation and change condition together | Automated + judgement | Rewritten |

Rule 3 criterion for "executable": the item must begin with a verb and name a concrete object, such as "explain under what conditions the approach fails", rather than "improve depth".

---

## Appendix A — Example

All sections below share one piece of material. The example is written in English to match the product interface and application documents.

### A.1 Source Material

| Item | Content |
|---|---|
| Background | A computer science undergraduate with one algorithm internship on the résumé |
| Original sentence | I independently rebuilt the recall stage of our recommendation system, replacing the two-tower model with multi-route recall, which lifted the online click-through rate by 6%. |

Decomposition per 2.1:

| ID | Proposition | What it makes verifiable | Probe value | Probe directions |
|---|---|---|---|---|
| C1-P1 | I independently completed the recall-stage rebuild | Ownership and completeness of the work | High | Scope, motivation |
| C1-P2 | The two-tower model was replaced with multi-route recall | Whether the technical choice holds up | High | Mechanism, trade-off, failure mode |
| C1-P3 | The online click-through rate rose by 6% | Whether the figure can be verified | High | Accuracy, mechanism |

The three are separated because failing on P1 is a question of ownership, on P2 of technical judgement, and on P3 of data verification; the probing directions differ. All three have high probe value, so each carries at least two directions, satisfying 2.1.3 rule 6.

### A.2 Counter-examples for Extraction

| Counter-example | Violates | Reason |
|---|---|---|
| I independently completed the rebuild and replaced the two-tower model | 2.1.3 rule 5 | Two independent propositions are joined, so a partly correct claim cannot be attributed |
| The results improved significantly | 2.1.3 rules 1 and 7 | No matching source quotation; no specific object or result |
| I am very interested in recommender systems | 2.1.3 rule 7 | Expresses an attitude only, with no verifiable content |

### A.3 Example for Question Generation

Taking C1-P2, whose declared directions are mechanism, trade-off and failure mode:

| Outcome | Question | Problem |
|---|---|---|
| Invalid | Have you worked on recommender systems? | Yes/no question, and it targets no proposition (violates rules 7 and 8) |
| Invalid | Tell me about your project. | Too broad to attribute (violates rule 8) |
| Valid | What differs between the two-tower model and multi-route recall in candidate generation? | Direction: mechanism; level: analysis; expected depth 3 |
| Valid | What did the extra routes cost in online latency and engineering complexity? | Direction: trade-off; level: evaluate; expected depth 3 |

The two valid questions probe mechanism and trade-off respectively; they point in different directions and do not constitute the duplication prohibited by rule 5.

### A.4 Example for Follow-up

Previous question: Why did you move away from the two-tower model?

Answer: `Because multiple routes give better recall. It works much better.`

| Outcome | Follow-up | Problem |
|---|---|---|
| Invalid | Could you explain again why you moved away from the two-tower model? | Repeats the previous question (violates rule 7) |
| Invalid | So you chose multi-route recall because it performs better, right? | Leading phrasing that supplies the answer to the candidate (violates rule 9) |
| Valid | Which part of recall improved - long-tail content or new users? And what did the extra routes cost in online scoring and fusion? | Lands on the missing trade-off and mechanism directions; trigger reason is "a conclusion without a reason" |

Two grounds support the valid follow-up: the answer gave only the conclusion *better recall* without saying where the improvement came from, and it mentioned no cost, although trade-off is one of the proposition's declared directions.

### A.5 Examples for Scoring

#### A.5.1 Verifying Independence of the Four Dimensions

| Answer | Correctness | Relevance | Depth | Articulation |
|---|---|---|---|---|
| The two-tower model is outdated, and multi-route recall is stronger in every scenario. | Low (false claim) | High | Medium | High |
| Asked why the recall design changed; described the internship team's division of labour. | High | Low | Medium | High |
| Multi-route recall works better. | High | High | Low | High |
| Content correct, but the delivery is disorganised, terms are unexplained, and the speaker repeatedly restarts. | High | High | Medium | Low |

Each row is low on exactly one dimension while the other three are normal, so the four dimensions are independent and need no merging.

#### A.5.2 Deciding Dimension Boundaries

| Sentence | Dimension | Reason |
|---|---|---|
| Multi-route recall is better than the two-tower model in every scenario. | Correctness | An absolute claim that is false |
| Multi-route recall works better. | Depth | The claim holds, but neither mechanism nor cost is given |
| Asked about latency; answered with the team's headcount. | Relevance | The content is not wrong, but it does not answer the question |
| Dense terminology with no transitions; the listener repeatedly asks for repetition. | Articulation | The information is present but does not get across |

#### A.5.3 A Complete Evaluation of One Question

Question: Why did you move away from the two-tower model?

Answer: `The two-tower model is outdated. Multi-route recall is better in every way, and it improved our business metrics a lot.`

| Dimension | Band | Evidence | Reasoning |
|---|---|---|---|
| Correctness | Developing | Positive: "it improved our business metrics"; negative: "better in every way" | The latter is an untenable absolute claim; the former is true, which keeps the band at the middle level rather than Weak |
| Relevance | Strong | Positive: "The two-tower model is outdated" | Directly addresses "why move away", with no sub-question missed |
| Depth | Developing | Positive: "it improved our business metrics a lot"; negative: "better in every way" | The latter is a verdict only; it does not say where the improvement came from, so there is no mechanism and no cost |
| Articulation | Solid | Positive: "The two-tower model is outdated"; negative: the second and third sentences are juxtaposed without stating their relation | The thread is discernible, but there is one awkward transition, so the band is not Strong |

Correctness, depth and articulation are middle bands, so each carries both positive and negative evidence; relevance is Strong and therefore needs positive evidence only, per 2.4.6 rule 3.

One quotation may appear under more than one dimension because it supports different criteria. "better in every way", for instance, is an untenable absolute claim under correctness and an unsupported verdict under depth. The reasoning column distinguishes the two uses.

Improvement for correctness: state which part of recall improved and remove the unrestricted claim.

### A.6 Example for Feedback

Taking the depth dimension from A.5.3:

| Layer | Content |
|---|---|
| Target | Explain how the practice works, and name one cost it brings |
| Current | Currently Developing: only the conclusion *better* is given, with no indication of where the improvement came from |
| Action | Explain what each recall route solves; explain the compute cost added by multi-route fusion |

The target layer restates the criteria in plain language without quoting terms such as "causal chain" or "failure condition", satisfying 2.5.5 rule 6. Both action items begin with a verb and name a concrete object, satisfying rule 3.

---

## Appendix B — Output Structure

The body defines what each field means; the complete structures are listed here for implementation reference. All field values are in English.

**B.1 Extraction**

```json
{
  "source_type": "resume",
  "claims": [
    {
      "claim_id": "C1",
      "original_text": "I independently rebuilt the recall stage of our recommendation system, replacing the two-tower model with multi-route recall, which lifted the online click-through rate by 6%.",
      "predicates": [
        {
          "predicate_id": "C1-P2",
          "predicate_text": "The two-tower model was replaced with multi-route recall",
          "source_quote": "replacing the two-tower model with multi-route recall",
          "check_worthiness": "high",
          "probe_types": ["mechanism", "tradeoff", "failure_mode"]
        }
      ]
    }
  ]
}
```

**B.2 Question Generation**

```json
{
  "questions": [
    {
      "question_id": "Q1",
      "question_text": "What differs between the two-tower model and multi-route recall in candidate generation?",
      "target_predicate_id": "C1-P2",
      "source_quote": "replacing the two-tower model with multi-route recall",
      "probe_type": "mechanism",
      "bloom_level": "analyze",
      "expected_depth": 3
    }
  ]
}
```

**B.3 Follow-up**

```json
{
  "trigger_reason": "States only that recall improved, without saying which part improved or what the change cost.",
  "response_preview": "Okay, that makes sense.",
  "transition": "You mentioned better recall.",
  "followup_question": "Which part of recall improved - long-tail content or new users? And what did the extra routes cost in online scoring and fusion?",
  "justification": "The answer covers only the surface claim of C1-P2 and addresses neither the tradeoff nor the mechanism direction.",
  "is_termination": false
}
```

**B.4 Scoring**

```json
{
  "evaluation_id": "E1",
  "question_id": "Q1",
  "dimensions": {
    "correctness": {
      "anchor": "Developing",
      "evidence": [
        {
          "quote": "better in every way",
          "stance": "negative",
          "why": "Contains an absolute claim that does not hold."
        },
        {
          "quote": "it improved our business metrics",
          "stance": "positive",
          "why": "The claim itself is true, which keeps the band at Developing rather than Weak."
        }
      ],
      "improvement": "To reach Solid, state which part of recall improved and remove the unrestricted claim."
    },
    "relevance": { "anchor": "Strong" },
    "depth": { "anchor": "Developing" },
    "articulation": { "anchor": "Solid" }
  }
}
```

**B.5 Feedback**

```json
{
  "session_summary": {
    "total_questions": 5,
    "average_dimension_scores": { "correctness": 3.2, "relevance": 3.6, "depth": 2.4, "articulation": 3.0 },
    "weakest_dimensions": ["depth", "articulation"],
    "session_trend": "improving"
  },
  "per_question_feedback": [
    {
      "question_id": "Q1",
      "dimension_scores": { "depth": { "anchor": "Developing" } },
      "feed_up": {
        "dimension": "depth",
        "anchor": "Solid",
        "criteria": ["Explain how the practice works - one level is enough", "Mention one cost"]
      },
      "feed_back": {
        "dimension": "depth",
        "anchor": "Developing",
        "evidence_highlights": ["Only states the conclusion 'it improved our business metrics a lot'"]
      },
      "feed_forward": {
        "dimension": "depth",
        "target_anchor": "Solid",
        "action_items": ["Explain what each recall route solves", "Explain the compute cost added by multi-route fusion"]
      },
      "challenges_allowed": true
    }
  ]
}
```
