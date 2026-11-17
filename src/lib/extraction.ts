// 提取结果归一化：把模型输出变成 rubric v3 的 ClaimDocument。
// 只做 rubric 里标了 [code] 的机械校验，判断类规则交给提示词。

import {
  PROBE_TYPES,
  type CheckWorthiness,
  type Claim,
  type ClaimDocument,
  type ProbeType,
  type SourceType,
} from "./types";

const MIN_PROPOSITIONS = 3;
const MAX_PROPOSITIONS = 20;

const WORTHINESS_RANK: Record<CheckWorthiness, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

type RawPredicate = {
  predicate_text?: unknown;
  source_quote?: unknown;
  check_worthiness?: unknown;
  probe_types?: unknown;
};

type RawClaim = {
  original_text?: unknown;
  predicates?: unknown;
};

type Candidate = {
  predicate_text: string;
  source_quote: string;
  check_worthiness: CheckWorthiness;
  probe_types: ProbeType[];
};

function normalizeNewlines(s: string): string {
  return s.replace(/\r\n?/g, "\n");
}

function normalizePredicate(raw: RawPredicate, sourceText: string): Candidate | null {
  if (!raw || typeof raw !== "object") return null;

  const predicateText =
    typeof raw.predicate_text === "string"
      ? raw.predicate_text.replace(/\s+/g, " ").trim()
      : "";
  if (!predicateText) return null;

  // 硬规则 1：source_quote 必须逐字出现在原文里，不做改写或翻译
  const sourceQuote =
    typeof raw.source_quote === "string" ? raw.source_quote.trim() : "";
  if (!sourceQuote || !sourceText.includes(normalizeNewlines(sourceQuote))) {
    return null;
  }

  // 硬规则 7：probe_types 只能取自六个方向
  const rawTypes = Array.isArray(raw.probe_types) ? raw.probe_types : [];
  const probeTypes = Array.from(
    new Set(
      rawTypes
        .map((t) => (typeof t === "string" ? t.trim().toLowerCase() : ""))
        .filter((t): t is ProbeType =>
          (PROBE_TYPES as readonly string[]).includes(t)
        )
    )
  );
  // 没有任何追问方向，这条命题无法出题
  if (probeTypes.length === 0) return null;

  let worthiness: CheckWorthiness = "medium";
  const rawWorthiness =
    typeof raw.check_worthiness === "string"
      ? raw.check_worthiness.trim().toLowerCase()
      : "";
  if (
    rawWorthiness === "high" ||
    rawWorthiness === "medium" ||
    rawWorthiness === "low"
  ) {
    worthiness = rawWorthiness;
  }
  // 硬规则 6：high 至少两个追问方向；不足时降为 medium，不凭空补方向
  if (worthiness === "high" && probeTypes.length < 2) {
    worthiness = "medium";
  }

  return {
    predicate_text: predicateText,
    source_quote: sourceQuote,
    check_worthiness: worthiness,
    probe_types: probeTypes,
  };
}

export function normalizeExtraction(
  raw: { claims?: unknown },
  sourceText: string,
  sourceType: SourceType
): ClaimDocument {
  const source = normalizeNewlines(sourceText);
  const rawClaims: RawClaim[] = Array.isArray(raw?.claims)
    ? (raw.claims as RawClaim[])
    : [];

  const groups: { original_text: string; candidates: Candidate[] }[] = [];
  for (const rc of rawClaims) {
    if (!rc || typeof rc.original_text !== "string") continue;
    const originalText = rc.original_text.replace(/\s+/g, " ").trim();
    if (!originalText) continue;

    const rawPredicates: RawPredicate[] = Array.isArray(rc.predicates)
      ? (rc.predicates as RawPredicate[])
      : [];
    const candidates = rawPredicates
      .map((rp) => normalizePredicate(rp, source))
      .filter((c): c is Candidate => c !== null);

    if (candidates.length > 0) {
      groups.push({ original_text: originalText, candidates });
    }
  }

  const total = () => groups.reduce((n, g) => n + g.candidates.length, 0);

  // 硬规则 4：3–20 条命题。超过上限时保留更值得问的，同档维持原顺序
  if (total() > MAX_PROPOSITIONS) {
    const keep = new Set(
      groups
        .flatMap((g) => g.candidates)
        .slice()
        .sort(
          (a, b) =>
            WORTHINESS_RANK[a.check_worthiness] -
            WORTHINESS_RANK[b.check_worthiness]
        )
        .slice(0, MAX_PROPOSITIONS)
    );
    groups.forEach((g) => {
      g.candidates = g.candidates.filter((c) => keep.has(c));
    });
  }

  if (total() < MIN_PROPOSITIONS) {
    throw new Error(
      `Too few verifiable propositions extracted (${total()}) — the document may lack concrete detail`
    );
  }

  // id 在过滤后统一重排，保证连续且不会与模型编造的编号冲突
  const claims: Claim[] = groups
    .filter((g) => g.candidates.length > 0)
    .map((g, i) => ({
      claim_id: `C${i + 1}`,
      original_text: g.original_text,
      predicates: g.candidates.map((c, j) => ({
        predicate_id: `C${i + 1}-P${j + 1}`,
        predicate_text: c.predicate_text,
        source_quote: c.source_quote,
        check_worthiness: c.check_worthiness,
        probe_types: c.probe_types,
      })),
    }));

  return { source_type: sourceType, claims };
}
