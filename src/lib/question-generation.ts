// 出题结果的机械校验与去重（两条 track 共用）。

import {
  PROBE_TYPES,
  type BloomLevel,
  type ClaimDocument,
  type ExpectedDepth,
  type InterviewQuestion,
  type Predicate,
  type ProbeType,
} from "./types";

/** expected_depth 由 probe_type 决定，不允许模型自选 */
export const DEPTH_BY_PROBE: Record<ProbeType, ExpectedDepth> = {
  mechanism: 3,
  tradeoff: 3,
  failure_mode: 3,
  motivation: 2,
  scope: 2,
  accuracy: 1,
};

export type PredicateRef = Predicate & {
  claim_id: string;
  original_text: string;
};

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "than", "that", "this",
  "these", "those", "you", "your", "yours", "how", "what", "why", "when",
  "where", "which", "who", "did", "do", "does", "was", "were", "is", "are",
  "be", "been", "being", "to", "of", "in", "on", "for", "with", "about",
  "would", "could", "should", "can", "will", "it", "its", "as", "at", "by",
  "from", "into", "not", "no", "so", "there", "their", "them", "they",
]);

function tokens(s: string): Set<string> {
  const words = s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w)));
}

/** 词面重合度，作为「语义相似度」的低成本近似 */
export function similarity(a: string, b: string): number {
  const at = tokens(a);
  const bt = tokens(b);
  if (at.size === 0 || bt.size === 0) return 0;
  let shared = 0;
  at.forEach((w) => {
    if (bt.has(w)) shared += 1;
  });
  return shared / (at.size + bt.size - shared);
}

export function flattenPredicates(doc: ClaimDocument): PredicateRef[] {
  return doc.claims.flatMap((c) =>
    c.predicates.map((p) => ({
      ...p,
      claim_id: c.claim_id,
      original_text: c.original_text,
    }))
  );
}

function isVerbatim(quote: string, pred: PredicateRef): boolean {
  return pred.original_text.includes(quote) || pred.source_quote.includes(quote);
}

/**
 * 按 question_generate_v2 的 [code] 规则逐条过滤模型输出，
 * 编号在过滤后统一重排，避免模型编造的 id 流入后续环节。
 */
export function cleanGeneratedQuestions(
  raw: unknown,
  predicates: PredicateRef[],
  limit: number
): InterviewQuestion[] {
  const byId = new Map(predicates.map((p) => [p.predicate_id, p]));
  const perPredicate = new Map<string, number>();
  const accepted: InterviewQuestion[] = [];

  const list =
    raw && typeof raw === "object" && Array.isArray((raw as { questions?: unknown }).questions)
      ? ((raw as { questions: unknown[] }).questions)
      : [];

  for (const item of list) {
    if (accepted.length >= limit) break;
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;

    const text =
      typeof q.question_text === "string"
        ? q.question_text.replace(/\s+/g, " ").trim()
        : "";
    if (text.length < 10) continue;
    // 硬规则 5：一条只能问一个问题
    if ((text.match(/\?/g) ?? []).length > 1) continue;

    const pred = byId.get(String(q.target_predicate_id ?? ""));
    if (!pred) continue;

    // 硬规则 3：probe_type 必须是该命题声明过的方向
    const probe =
      typeof q.probe_type === "string" ? q.probe_type.trim().toLowerCase() : "";
    if (!(PROBE_TYPES as readonly string[]).includes(probe)) continue;
    if (!pred.probe_types.includes(probe as ProbeType)) continue;

    // 硬规则 4：bloom_level 取值受限，expected_depth 跟随 probe_type
    const bloom =
      typeof q.bloom_level === "string" ? q.bloom_level.trim().toLowerCase() : "";
    if (bloom !== "analyze" && bloom !== "evaluate") continue;
    if (q.expected_depth !== DEPTH_BY_PROBE[probe as ProbeType]) continue;

    // 硬规则 1：source_quote 必须逐字出自该句
    const quote = typeof q.source_quote === "string" ? q.source_quote.trim() : "";
    if (!quote || !isVerbatim(quote, pred)) continue;

    // 硬规则 6：同一命题最多 3 条
    const used = perPredicate.get(pred.predicate_id) ?? 0;
    if (used >= 3) continue;

    // 硬规则 7：与已接受问题的相似度需低于 85%
    if (accepted.some((a) => similarity(a.question_text, text) >= 0.85)) continue;

    accepted.push({
      question_id: `Q${accepted.length + 1}`,
      question_text: text,
      target_predicate_id: pred.predicate_id,
      source_quote: quote,
      probe_type: probe as ProbeType,
      bloom_level: bloom as BloomLevel,
      expected_depth: DEPTH_BY_PROBE[probe as ProbeType],
    });
    perPredicate.set(pred.predicate_id, used + 1);
  }

  return accepted;
}
