// 评分 / 反馈 / 申诉的共用实现。
// 模型只负责给档位与证据；所有 [code] 规则在这里机械执行。

import { chatJSON } from "./llm";
import { readRubricSection } from "./rubrics";
import {
  BANDS,
  DIMENSIONS,
  PS_DIMENSIONS,
  type Band,
  type ContestResult,
  type Dimension,
  type DimensionFeedback,
  type DimensionScore,
  type Evidence,
  type FeedbackResult,
  type PSDimension,
  type PSDimensionScore,
  type PSReviewResult,
  type QuestionScore,
  type SessionOverview,
  type SessionSummary,
  type Trend,
} from "./types";

const BAND_RANK: Record<Band, number> = {
  Strong: 0,
  Solid: 1,
  Developing: 2,
  Weak: 3,
};

export function bandAbove(band: Band): Band | null {
  const rank = BAND_RANK[band];
  return rank === 0 ? null : BANDS[rank - 1];
}

function normalize(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** 逐条执行 2.4.6 的证据规则与维度间约束 */
export function cleanEvaluation(
  raw: unknown,
  questionId: string,
  answer: string
): QuestionScore {
  const dims =
    raw && typeof raw === "object"
      ? (raw as { dimensions?: unknown }).dimensions
      : undefined;
  if (!dims || typeof dims !== "object") {
    throw new Error("Model output missing dimensions");
  }

  const text = normalize(answer);
  const result = {} as Record<Dimension, DimensionScore>;

  for (const dim of DIMENSIONS) {
    const source = (dims as Record<string, unknown>)[dim] as
      | { anchor?: unknown; evidence?: unknown; improvement?: unknown }
      | undefined;

    const anchor = source?.anchor;
    // 硬规则：只接受档位名，数字一律视为无效输出
    if (typeof anchor !== "string" || !(BANDS as readonly string[]).includes(anchor)) {
      throw new Error(`Invalid band for ${dim}: ${String(anchor)}`);
    }

    const evidence: Evidence[] = [];
    for (const item of Array.isArray(source?.evidence) ? source.evidence : []) {
      if (!item || typeof item !== "object") continue;
      const entry = item as { quote?: unknown; stance?: unknown; why?: unknown };
      const quote = asString(entry.quote);
      // 硬规则 2：引文必须逐字出现在答案里
      if (!quote || !text.includes(quote)) continue;
      // 硬规则 4：引文 5–40 词
      const length = wordCount(quote);
      if (length < 5 || length > 40) continue;
      const stance = entry.stance;
      if (stance !== "positive" && stance !== "negative") continue;
      evidence.push({ quote, stance, why: asString(entry.why) });
    }

    let finalBand = anchor as Band;
    const hasPositive = evidence.some((e) => e.stance === "positive");
    const hasNegative = evidence.some((e) => e.stance === "negative");

    if (evidence.length === 0) {
      // 约束 3：拿不出证据时封顶 Developing
      finalBand = "Developing";
    } else if (finalBand === "Strong" && hasNegative) {
      // Strong 不允许存在缺陷证据；拿不准取低档
      finalBand = "Solid";
    } else if (finalBand === "Strong" && !hasPositive) {
      finalBand = "Developing";
    } else if (finalBand === "Solid" && !(hasPositive && hasNegative)) {
      // 中间档需要正负各一条；缺任一类按"取低档"处理
      finalBand = "Developing";
    } else if (finalBand === "Weak" && !hasNegative) {
      finalBand = "Developing";
    }

    result[dim] = {
      anchor: finalBand,
      evidence,
      improvement: asString(source?.improvement),
    };
  }

  // 维度间约束：relevance 低于 Solid 时，correctness 与 depth 封顶 Developing
  if (BAND_RANK[result.relevance.anchor] >= 2) {
    for (const dim of ["correctness", "depth"] as const) {
      if (BAND_RANK[result[dim].anchor] < 2) {
        result[dim] = { ...result[dim], anchor: "Developing" };
      }
    }
  }

  return {
    evaluation_id: `E-${questionId}`,
    question_id: questionId,
    dimensions: result,
  };
}

export async function evaluatePair(input: {
  questionId: string;
  question: string;
  answer: string;
  track: "job" | "admissions";
  /** 只允许从这里取引文；缺省时等于 answer */
  quoteSource?: string;
}): Promise<QuestionScore> {
  const scoring = readRubricSection("scoring_v2");
  const correctness = readRubricSection(
    input.track === "job" ? "correctness_job_v2" : "correctness_admissions_v2"
  );

  const raw = await chatJSON<unknown>({
    system: `${scoring}\n\n${correctness}\n\nFollow the rubric exactly and output valid JSON only.`,
    user: [
      `Question:\n"""\n${input.question}\n"""`,
      "",
      `Answer:\n"""\n${input.answer}\n"""`,
    ].join("\n"),
    maxTokens: 1800,
  });

  return cleanEvaluation(raw, input.questionId, input.quoteSource ?? input.answer);
}

/** 逐条执行 2.5 的三层结构与 target_anchor 规则 */
export function cleanFeedback(
  raw: unknown,
  questionId: string,
  score: QuestionScore
): FeedbackResult {
  const list =
    raw && typeof raw === "object" && Array.isArray((raw as { per_dimension?: unknown }).per_dimension)
      ? ((raw as { per_dimension: unknown[] }).per_dimension)
      : [];

  const byDimension = new Map<Dimension, Record<string, unknown>>();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const dim = entry.dimension;
    if (
      typeof dim === "string" &&
      (DIMENSIONS as readonly string[]).includes(dim)
    ) {
      byDimension.set(dim as Dimension, entry);
    }
  }

  const perDimension: DimensionFeedback[] = [];

  for (const dim of DIMENSIONS) {
    const entry = byDimension.get(dim);
    // 模型漏掉的维度不进反馈区，报告仍会显示评分
    if (!entry) continue;

    const anchor = score.dimensions[dim].anchor;
    const above = bandAbove(anchor);

    const feedUp = entry.feed_up as { criteria?: unknown } | undefined;
    const feedBack = entry.feed_back as { evidence_highlights?: unknown } | undefined;
    const feedForward = entry.feed_forward as { action_items?: unknown } | undefined;

    const criteria = Array.isArray(feedUp?.criteria)
      ? feedUp.criteria.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      : [];
    const highlights = Array.isArray(feedBack?.evidence_highlights)
      ? feedBack.evidence_highlights.filter(
          (c): c is string => typeof c === "string" && c.trim().length > 0
        )
      : [];
    const actions = Array.isArray(feedForward?.action_items)
      ? feedForward.action_items.filter(
          (c): c is string => typeof c === "string" && c.trim().length > 0
        )
      : [];

    // 硬规则 3：反馈里的档位必须与评分一致
    const feedback: DimensionFeedback = {
      dimension: dim,
      feed_up: { anchor: above ?? anchor, criteria },
      feed_back: {
        anchor,
        evidence_highlights:
          highlights.length > 0
            ? highlights
            : score.dimensions[dim].evidence.map((e) => e.quote),
      },
    };

    // 硬规则 4：Strong 没有上一档，因此没有 feed_forward
    // 硬规则 2：target_anchor 恰好高一档，由代码锁定
    if (above) {
      feedback.feed_forward = {
        target_anchor: above,
        action_items:
          actions.length > 0
            ? actions
            : score.dimensions[dim].improvement
              ? [score.dimensions[dim].improvement]
              : [],
      };
    }

    perDimension.push(feedback);
  }

  return { question_id: questionId, per_dimension: perDimension, challenges_allowed: true };
}

export async function generateFeedback(input: {
  question: string;
  answer: string;
  score: QuestionScore;
}): Promise<FeedbackResult> {
  const rubric = readRubricSection("feedback_v2");

  const scoringView = {
    dimensions: DIMENSIONS.reduce<Record<string, unknown>>((acc, dim) => {
      const d = input.score.dimensions[dim];
      acc[dim] = {
        anchor: d.anchor,
        evidence: d.evidence.map((e) => ({ quote: e.quote, stance: e.stance })),
        improvement: d.improvement,
      };
      return acc;
    }, {}),
  };

  const raw = await chatJSON<unknown>({
    system: `${rubric}\n\nFollow the rubric exactly and output valid JSON only.`,
    user: [
      `Question:\n"""\n${input.question}\n"""`,
      "",
      `Answer:\n"""\n${input.answer}\n"""`,
      "",
      `Scoring output for this answer (fixed — do not change any band):\n${JSON.stringify(
        scoringView,
        null,
        2
      )}`,
    ].join("\n"),
    maxTokens: 1500,
  });

  return cleanFeedback(raw, input.score.question_id, input.score);
}

export async function contestBand(input: {
  questionId: string;
  question: string;
  answer: string;
  dimension: Dimension;
  anchor: Band;
  note: string;
}): Promise<ContestResult> {
  const rubric = readRubricSection("contest_v2");

  const raw = await chatJSON<{
    basis?: unknown;
    quotation?: unknown;
    change_condition?: unknown;
    anchor_after?: unknown;
  }>({
    system: `${rubric}\n\nFollow the rubric exactly and output valid JSON only.`,
    user: [
      `Question:\n"""\n${input.question}\n"""`,
      "",
      `Answer:\n"""\n${input.answer}\n"""`,
      "",
      `Dimension contested: ${input.dimension}`,
      `Band assigned: ${input.anchor}`,
      input.note ? `Candidate's argument:\n"""\n${input.note}\n"""` : "Candidate gave no argument.",
    ].join("\n"),
    maxTokens: 700,
  });

  // 硬规则 1：三个要素缺一不可
  const basis = asString(raw.basis);
  const quotation = asString(raw.quotation);
  const changeCondition = asString(raw.change_condition);
  if (!basis || !quotation || !changeCondition) {
    throw new Error("Challenge response missing basis, quotation, or change_condition");
  }

  // 硬规则 2：引文必须逐字出现在答案里
  if (!normalize(input.answer).includes(quotation)) {
    throw new Error("Challenge quotation does not match the answer");
  }

  const anchorAfter = raw.anchor_after;
  if (typeof anchorAfter !== "string" || !(BANDS as readonly string[]).includes(anchorAfter)) {
    throw new Error("Invalid anchor_after in challenge response");
  }

  return {
    dimension: input.dimension,
    anchor_before: input.anchor,
    basis,
    quotation,
    change_condition: changeCondition,
    anchor_after: anchorAfter as Band,
  };
}

/** 会话级汇总：只数档位分布，不做平均分 */
export function summarize(scores: QuestionScore[]): SessionSummary {
  const summary = {} as SessionSummary;

  for (const dim of DIMENSIONS) {
    const counts: Record<Band, number> = { Strong: 0, Solid: 0, Developing: 0, Weak: 0 };
    for (const score of scores) {
      counts[score.dimensions[dim].anchor] += 1;
    }

    // 众数；票数相同时取更低的一档
    let band: Band = "Weak";
    let best = -1;
    for (const candidate of BANDS) {
      if (counts[candidate] >= best) {
        best = counts[candidate];
        band = candidate;
      }
    }

    summary[dim] = { band, counts };
  }

  return summary;
}

/** 档位换算成 4/3/2/1，只用于内部比较，不进入输出 */
const BAND_SCORE: Record<Band, number> = { Strong: 4, Solid: 3, Developing: 2, Weak: 1 };

/**
 * v3 2.5.3：最弱两项 + 趋势。
 * 均值在代码里算，页面只显示维度名和趋势标签，不显示数字。
 */
export function summarizeOverview(scores: QuestionScore[]): SessionOverview {
  if (scores.length === 0) return { weakest: [], trend: null };

  const means = {} as Record<Dimension, number>;
  for (const dim of DIMENSIONS) {
    const total = scores.reduce((sum, q) => sum + BAND_SCORE[q.dimensions[dim].anchor], 0);
    means[dim] = total / scores.length;
  }

  // 均值最低的两维；并列时按固定维度顺序
  const weakest = [...DIMENSIONS]
    .sort((a, b) => means[a] - means[b] || DIMENSIONS.indexOf(a) - DIMENSIONS.indexOf(b))
    .slice(0, 2);

  // 题量太少时前后段不可比，不输出趋势
  let trend: Trend | null = null;
  if (scores.length >= 4) {
    const perQuestion = scores.map(
      (q) => DIMENSIONS.reduce((sum, dim) => sum + BAND_SCORE[q.dimensions[dim].anchor], 0) / DIMENSIONS.length
    );
    const half = Math.floor(perQuestion.length / 2);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const diff = mean(perQuestion.slice(-half)) - mean(perQuestion.slice(0, half));
    trend = diff > 0.3 ? "improving" : diff < -0.3 ? "declining" : "stable";
  }

  return { weakest, trend };
}

// ===== 附加功能：个人陈述审阅 =====

/** 逐条执行 ps_review_v1 的证据规则与档位封顶 */
export function cleanPSReview(raw: unknown, draft: string): PSReviewResult {
  const dims =
    raw && typeof raw === "object"
      ? (raw as { dimensions?: unknown }).dimensions
      : undefined;
  if (!dims || typeof dims !== "object") {
    throw new Error("Model output missing dimensions");
  }

  const text = normalize(draft);
  const result = {} as Record<PSDimension, PSDimensionScore>;

  for (const dim of PS_DIMENSIONS) {
    const source = (dims as Record<string, unknown>)[dim] as
      | { anchor?: unknown; evidence?: unknown; improvement?: unknown }
      | undefined;

    const anchor = source?.anchor;
    if (typeof anchor !== "string" || !(BANDS as readonly string[]).includes(anchor)) {
      throw new Error(`Invalid band for ${dim}: ${String(anchor)}`);
    }

    const evidence: Evidence[] = [];
    for (const item of Array.isArray(source?.evidence) ? source.evidence : []) {
      if (!item || typeof item !== "object") continue;
      const entry = item as { quote?: unknown; stance?: unknown; why?: unknown };
      const quote = asString(entry.quote);
      if (!quote || !text.includes(quote)) continue;
      const length = wordCount(quote);
      if (length < 5 || length > 40) continue;
      const stance = entry.stance;
      if (stance !== "positive" && stance !== "negative") continue;
      evidence.push({ quote, stance, why: asString(entry.why) });
    }

    let finalBand = anchor as Band;
    if (evidence.length === 0) {
      finalBand = "Developing";
    } else if (finalBand === "Strong" && !evidence.some((e) => e.stance === "positive")) {
      finalBand = "Developing";
    } else if (finalBand === "Weak" && !evidence.some((e) => e.stance === "negative")) {
      finalBand = "Developing";
    }

    result[dim] = {
      anchor: finalBand,
      evidence,
      improvement: asString(source?.improvement),
    };
  }

  return result;
}

export async function reviewPersonalStatement(input: {
  draft: string;
  targetProgram?: string;
}): Promise<PSReviewResult> {
  const rubric = readRubricSection("ps_review_v1");

  const raw = await chatJSON<unknown>({
    system: `${rubric}\n\nFollow the rubric exactly and output valid JSON only.`,
    user: [
      `Target programme: ${input.targetProgram || "not specified"}`,
      "",
      `Draft:\n"""\n${input.draft}\n"""`,
    ].join("\n"),
    maxTokens: 1600,
  });

  return cleanPSReview(raw, input.draft);
}
