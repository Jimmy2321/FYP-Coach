// 领域模型：字段名与 rubrics/rubrics_v2.md 的字段表一一对应，
// 避免提示词里一套命名、代码里另一套命名。

export type SourceType = "resume" | "personal_statement";

export const PROBE_TYPES = [
  "mechanism",
  "tradeoff",
  "failure_mode",
  "motivation",
  "scope",
  "accuracy",
] as const;

export type ProbeType = (typeof PROBE_TYPES)[number];

export type CheckWorthiness = "high" | "medium" | "low";

/** 最小可验证命题：每道题只对应一个命题，答案好坏才能归因 */
export type Predicate = {
  predicate_id: string; // C1-P1
  predicate_text: string; // 5–40 词，英文
  source_quote: string; // 原文逐字片段
  check_worthiness: CheckWorthiness;
  probe_types: ProbeType[];
};

/** 原文中的一句话，以及从它拆出的命题 */
export type Claim = {
  claim_id: string; // C1
  original_text: string; // 原文逐字
  predicates: Predicate[];
};

/** 一次提取的完整产物，页面之间以 JSON 传递 */
export type ClaimDocument = {
  source_type: SourceType;
  claims: Claim[];
};

export type BloomLevel = "analyze" | "evaluate";
export type ExpectedDepth = 1 | 2 | 3;

/** question_generate_v2 的单条输出 */
export type InterviewQuestion = {
  question_id: string;
  question_text: string;
  target_predicate_id: string;
  source_quote: string;
  probe_type: ProbeType;
  bloom_level: BloomLevel;
  expected_depth: ExpectedDepth;
};

export type QAExchange = {
  question: string;
  answer: string;
};

/** followup_engine_v3 的输出 */
export type FollowupResult = {
  trigger_reason: string;
  response_preview: string;
  transition: string;
  followup_question: string;
  justification: string;
  is_termination: boolean;
  termination_reason: string;
};

// ===== 评分与反馈：只给等级名，不给数字 =====

export const BANDS = ["Strong", "Solid", "Developing", "Weak"] as const;
export type Band = (typeof BANDS)[number];
export const DIMENSIONS = [
  "correctness",
  "relevance",
  "depth",
  "articulation",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export type Evidence = {
  quote: string;
  stance: "positive" | "negative";
  why: string;
};

export type DimensionScore = {
  anchor: Band;
  evidence: Evidence[];
  improvement: string;
};

export type QuestionScore = {
  evaluation_id: string;
  question_id: string;
  dimensions: Record<Dimension, DimensionScore>;
};

export type DimensionFeedback = {
  dimension: Dimension;
  feed_up: { anchor: Band; criteria: string[] };
  feed_back: { anchor: Band; evidence_highlights: string[] };
  feed_forward?: { target_anchor: Band; action_items: string[] };
};

export type FeedbackResult = {
  question_id: string;
  per_dimension: DimensionFeedback[];
  challenges_allowed: boolean;
};

// ===== 会话与报告 =====

/** 一道主题目及其追问，报告的基本单位 */
export type SessionResponse = {
  question_id: string;
  question: string;
  answer: string;
  followups: { question: string; answer: string }[];
  phase: number;
  predicate_id: string | null;
  probe_type: ProbeType | null;
  expected_depth: ExpectedDepth | null;
};

/** 面试结束时写入 sessionStorage 的载荷 */
export type SessionReportInput = {
  session_id: string;
  track: "job" | "admissions";
  persona: string;
  completed_at: string;
  session_length: "short" | "standard";
  total_questions: number;
  responses: SessionResponse[];
};

/** 会话索引：只存列表所需字段，档位汇总在报告生成后回写 */
export type SessionIndexEntry = {
  session_id: string;
  track: "job" | "admissions";
  persona: string;
  completed_at: string;
  total_questions: number;
  summary?: SessionSummary;
};

export type ScoredQuestion = {
  question_id: string;
  question: string;
  answer: string;
  score: QuestionScore;
  feedback: FeedbackResult | null;
};

/** 会话级只给分布和众数档位，不给数字 */
export type DimensionSummary = {
  band: Band;
  counts: Record<Band, number>;
};

export type SessionSummary = Record<Dimension, DimensionSummary>;

export type Trend = "improving" | "declining" | "stable";

/** v3 2.5.3 的会话结论：最弱两项与趋势，内部按档位换算，展示时不出现数字 */
export type SessionOverview = {
  weakest: Dimension[];
  trend: Trend | null;
};

export type ReportResult = {
  results: ScoredQuestion[];
  summary: SessionSummary;
  overview: SessionOverview;
  failed: number;
};

export type ContestResult = {
  dimension: Dimension;
  anchor_before: Band;
  basis: string;
  quotation: string;
  change_condition: string;
  anchor_after: Band;
};

// ===== 附加功能：个人陈述审阅（不参与面试评分） =====

export const PS_DIMENSIONS = [
  "purpose_fit",
  "evidence_specificity",
  "narrative_coherence",
  "language_clarity",
] as const;

export type PSDimension = (typeof PS_DIMENSIONS)[number];

export type PSDimensionScore = {
  anchor: Band;
  evidence: Evidence[];
  improvement: string;
};

export type PSReviewResult = Record<PSDimension, PSDimensionScore>;
