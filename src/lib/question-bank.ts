// 固定面试题库
// 5 Phase 编排时，按 phase 从这里选题；Phase ②（简历深挖）由 AI 从 claims 生成，不在此文件
// 总题量约 35 道，覆盖应届 CS 技术面试核心能力
// 设计原则：每题带 followup_focus 字段，追问引擎根据此知道应该挖什么

export type Phase = 1 | 2 | 3 | 4 | 5;

export type BankQuestion = {
  phase: Exclude<Phase, 2>; // Phase 2 由 AI 简历生成
  category: string;
  base_question: string;        // 固定基础题面
  variation_hint?: string;      // 告诉 LLM 怎么根据简历项目调整（Phase ④ 用）
  intent: string;               // 考什么
  difficulty: "entry" | "mid" | "deep";
  followup_focus: string;       // 追问引擎重点
};

// Phase ① — Warmup & Behavioral（STAR 框架，1-2 题）
// 固定题，不依赖简历，评估 STAR 完整性、Storytelling、Self-awareness
export const WARMUP_QUESTIONS: BankQuestion[] = [
  {
    phase: 1,
    category: "STAR Challenge",
    base_question:
      "Walk me through a project or experience in university or an internship where you faced a genuinely difficult technical challenge. What was the situation, what did you do, and how did it turn out?",
    intent: "Assess STAR completeness and how the candidate frames their problem-solving.",
    difficulty: "mid",
    followup_focus:
      "STAR completeness: did they describe the situation clearly, state their OWN role (not the team's), quantify the outcome, and reflect on what they learned?",
  },
  {
    phase: 1,
    category: "Conflict / Teamwork",
    base_question:
      "Tell me about a time you had a disagreement with a teammate or mentor over a technical decision. How did you handle it?",
    intent: "Assess conflict resolution, maturity, and how they reason under disagreement.",
    difficulty: "mid",
    followup_focus:
      "Did they describe their OWN behavior clearly, admit any mistakes, and frame the outcome as a team decision (not 'I was right')?",
  },
  {
    phase: 1,
    category: "Failure & Learning",
    base_question:
      "Describe a time your own technical solution failed or didn't meet expectations. What happened and what did you learn from it?",
    intent: "Assess honesty, self-awareness, and growth mindset — avoids 'I never fail' canned answers.",
    difficulty: "mid",
    followup_focus:
      "Do they take genuine ownership (not blame teammates/tools), and does their learning actually sound like it changed how they work?",
  },
  {
    phase: 1,
    category: "Debugging Approach",
    base_question:
      "Tell me about a bug or issue that took you more than a day to track down. How did you approach debugging it?",
    intent: "Assess systematic debugging methodology vs trial-and-error.",
    difficulty: "mid",
    followup_focus:
      "Did they have a structured approach (reproduce → isolate → hypothesize → verify), or was it random clicking? Did they measure anything?",
  },
  {
    phase: 1,
    category: "Ambiguity Handling",
    base_question:
      "Have you ever had to build something where the requirements were unclear or kept changing? How did you handle that?",
    intent: "Assess how they deal with ambiguity — a real-world engineering skill.",
    difficulty: "mid",
    followup_focus:
      "Did they proactively clarify, prototype, or document assumptions? Or did they just guess and hope for the best?",
  },
  {
    phase: 1,
    category: "Motivation",
    base_question:
      "What made you pick computer science, and what area of it are you most curious about right now?",
    intent: "Assess genuine motivation — avoids generic 'I love coding' answers.",
    difficulty: "entry",
    followup_focus:
      "Is their curiosity specific and current, or canned high-school ambition? Do they follow what's happening in the field?",
  },
];

// Phase ③ — Core CS Fundamentals（2-3 题，简历有相关内容时升级难度）
// 覆盖算法思路、数据结构选择、并发、缓存、消息队列、数据库、系统设计基础
export const CORE_QUESTIONS: BankQuestion[] = [
  // —— 算法思路 ——
  {
    phase: 3,
    category: "Algorithm Thinking",
    base_question:
      "Without writing code, how would you approach finding if a given string appears inside another longer string? Walk me through your thought process.",
    intent: "Assess problem decomposition, edge case awareness, and why-did-you-pick-this reasoning.",
    difficulty: "mid",
    followup_focus:
      "Can they explain naive vs optimized approaches? Do they think about time/space complexity? What edge cases break their approach?",
  },
  {
    phase: 3,
    category: "Algorithm Thinking",
    base_question:
      "Suppose you have a sorted array that's been rotated at some point — how would you efficiently find a target value in it?",
    intent: "Assess binary search variant thinking, not memorized solution.",
    difficulty: "deep",
    followup_focus:
      "Do they understand why binary search still works on a rotated array? Can they identify the pivot element?",
  },
  // —— 数据结构选择 ——
  {
    phase: 3,
    category: "Data Structure Choice",
    base_question:
      "If you needed to maintain a collection of items where you insert frequently, delete by key, and also sometimes find the max value — what data structures would you consider and why?",
    intent: "Assess trade-off thinking, not 'pick HashMap and move on'.",
    difficulty: "mid",
    followup_focus:
      "Do they compare at least two options (e.g. HashMap vs TreeMap vs heap)? Do they articulate time complexity trade-offs for each operation?",
  },
  // —— 并发编程 ——
  {
    phase: 3,
    category: "Concurrency",
    base_question:
      "What's the difference between a thread, a process, and an async task? When would you pick one over the other?",
    intent: "Assess fundamental understanding of concurrency primitives.",
    difficulty: "mid",
    followup_focus:
      "Can they explain the trade-off between shared-memory threads vs message-passing processes? Do they know when async helps vs when threads are needed?",
  },
  {
    phase: 3,
    category: "Concurrency",
    base_question:
      "Imagine two threads updating the same shared counter — what can go wrong, and how do you fix it at different levels?",
    intent: "Assess race condition understanding and fix options (atomic, lock, DB-level, idempotent).",
    difficulty: "deep",
    followup_focus:
      "Can they explain why locks work and what their cost is? Do they know alternatives like Compare-And-Swap or version-based optimistic locking?",
  },
  // —— 缓存策略 ——
  {
    phase: 3,
    category: "Caching",
    base_question:
      "When would you choose cache-aside vs write-through vs write-back? What are the trade-offs of each?",
    intent: "Assess caching pattern selection reasoning.",
    difficulty: "mid",
    followup_focus:
      "Do they talk about consistency windows, failure modes, and what happens when the DB goes down while writes are still in the cache?",
  },
  {
    phase: 3,
    category: "Caching",
    base_question:
      "Your cache is showing terrible hit rate — what's your debugging approach to figure out why?",
    intent: "Assess systematic caching debugging, not guessing.",
    difficulty: "deep",
    followup_focus:
      "Do they check: key design, TTL, eviction policy, access pattern? Can they describe cache penetration, breakdown, and stampede?",
  },
  // —— 消息队列 ——
  {
    phase: 3,
    category: "Messaging",
    base_question:
      "When would you pick RabbitMQ over Kafka, or Kafka over Redis Streams? What problem does each solve best?",
    intent: "Assess message broker selection reasoning — not brand awareness.",
    difficulty: "mid",
    followup_focus:
      "Do they know the core difference: RabbitMQ = flexible routing + reliable delivery, Kafka = log-based replay + high throughput? Do they mention use cases where each shines?",
  },
  {
    phase: 3,
    category: "Messaging",
    base_question:
      "What exactly is idempotency, and why does every message-consumer need to think about it?",
    intent: "Assess understanding of at-least-once delivery and duplicate message handling.",
    difficulty: "deep",
    followup_focus:
      "Do they know that idempotency keys / unique constraints / de-duplication tables are all valid approaches? Can they describe the cost of NOT being idempotent?",
  },
  // —— 数据库 ——
  {
    phase: 3,
    category: "Database",
    base_question:
      "Your query on a table with 10 million rows is taking 4 seconds — how do you find and fix the problem?",
    intent: "Assess systematic query optimization methodology.",
    difficulty: "mid",
    followup_focus:
      "Do they start with EXPLAIN / query plan? Do they check for full table scans, missing indexes, N+1 queries, or locks? Do they know what a composite index is and how column order matters?",
  },
  {
    phase: 3,
    category: "Database",
    base_question:
      "What's the difference between ACID transactions and BASE eventual consistency? When do you pick each?",
    intent: "Assess fundamental distributed systems trade-off awareness.",
    difficulty: "deep",
    followup_focus:
      "Do they tie this to concrete product decisions? Can they describe which operations MUST be ACID (e.g. payment deduction) vs which can be BASE (e.g. feed counts)?",
  },
  // —— 系统设计基础 ——
  {
    phase: 3,
    category: "API Design",
    base_question:
      "If you had to design a REST API for creating orders that need to handle sudden traffic spikes — what are the key design choices you'd make?",
    intent: "Assess API design with scalability in mind.",
    difficulty: "mid",
    followup_focus:
      "Do they think about: idempotent POST / PUT, async processing with webhooks, rate limiting, partial success, and how to handle retries safely?",
  },
  {
    phase: 3,
    category: "Web Fundamentals",
    base_question:
      "When you type a URL into the browser, what actually happens step by step? Try to go deeper than just 'HTTP request'.",
    intent: "Assess fundamental web stack understanding — DNS → TCP → TLS → HTTP → render pipeline.",
    difficulty: "mid",
    followup_focus:
      "Can they explain DNS resolution, TCP handshake, TLS key exchange, and why HTTP/2 matters? Do they know what a CDN actually does at the network level?",
  },
  {
    phase: 3,
    category: "Fault Tolerance",
    base_question:
      "What's the difference between retries, fallbacks, circuit breakers, and timeouts? When do you pick which?",
    intent: "Assess resilience pattern understanding.",
    difficulty: "mid",
    followup_focus:
      "Do they know that circuit breakers protect against cascading failure, that retries need idempotent endpoints, and that timeouts must be shorter than the caller's timeout?",
  },
  {
    phase: 3,
    category: "Trade-off Thinking",
    base_question:
      "What's one engineering decision you made in a project where you picked a simpler approach over the 'better' one, and why?",
    intent: "Assess maturity — knowing when simplicity beats perfection.",
    difficulty: "mid",
    followup_focus:
      "Do they articulate a real trade-off they thought through (e.g. 'used relational DB even though it wasn't perfect, because our team knew it and we needed to ship in 2 weeks')?",
  },
];

// Phase ④ — System Design Templates（1 题，根据简历项目场景定制化）
// variation_hint 告诉编排 API 怎么把 [PROJECT] 替换成用户简历里最有代表性的项目
export const SYSTEM_DESIGN_TEMPLATES: BankQuestion[] = [
  {
    phase: 4,
    category: "Architecture Deep Dive",
    base_question:
      "Design the architecture of [PROJECT]. Start with your initial design — what are the components, how do they talk, what are the bottlenecks you anticipated? Then: scale it to 10x your current peak traffic. What breaks first, and how do you fix it?",
    variation_hint:
      "Replace [PROJECT] with the user's most substantial project from their resume (preferably one with quantified traffic or QPS numbers). If the resume mentions Redis, RabbitMQ, or specific scalability numbers, weave those in naturally.",
    intent: "Assess architectural thinking: components, bottlenecks, and scalable redesign.",
    difficulty: "deep",
    followup_focus:
      "Do they have a clear initial architecture (not a list of buzzwords)? Can they identify the REAL bottleneck under 10x (often DB write throughput, not compute)? Do their fixes actually address that bottleneck's root cause?",
  },
  {
    phase: 4,
    category: "Scalability Stress Test",
    base_question:
      "Walk me through the failure modes of [PROJECT]. Under what conditions would it crash, corrupt data, or give wrong answers? What did you do (or what would you do) to harden it?",
    variation_hint:
      "Replace [PROJECT] with the user's most substantial project. Weave in specific failure modes relevant to the tech stack they used (Redis lock expiry, message queue re-delivery, optimistic locking failure, etc.).",
    intent: "Assass fault-tolerance thinking — not just 'what goes right' but 'what goes wrong'.",
    difficulty: "deep",
    followup_focus:
      "Do they think about the specific failure modes of their chosen tech stack? Can they describe the recovery path after each failure? Do they test these scenarios?",
  },
  {
    phase: 4,
    category: "Data Model & Evolution",
    base_question:
      "If you had to redesign the data layer of [PROJECT] from scratch — what data model would you pick, and how would you evolve it as the product grew and new features appeared?",
    variation_hint:
      "Replace [PROJECT] with the user's most substantial project. If the resume mentions a specific DB (MySQL, PostgreSQL, MongoDB) talk about why they'd pick the same or different one now.",
    intent: "Assess data modeling skills and schema evolution thinking.",
    difficulty: "deep",
    followup_focus:
      "Do they normalize vs denormalize intentionally? Can they describe a schema migration they've actually done? Do they think about read vs write throughput trade-offs in their model?",
  },
];

// Phase ⑤ — Wrap-up & Closing（1 题）
export const WRAPUP_QUESTIONS: BankQuestion[] = [
  {
    phase: 5,
    category: "Reverse Q&A",
    base_question: "Alright — do you have any questions for me?",
    intent: "Assess curiosity and preparation — what questions they ask reveals what they care about.",
    difficulty: "entry",
    followup_focus:
      "Do they ask about the role's technical scope, team culture, or growth? Or do they just say 'no'?",
  },
  {
    phase: 5,
    category: "Closing Reflection",
    base_question: "Is there anything else you'd like to highlight that we didn't get a chance to cover?",
    intent: "Gives them a chance to shine on something the earlier phases didn't cover.",
    difficulty: "entry",
    followup_focus:
      "Do they use this wisely to mention a relevant project/skill we missed, or ramble?",
  },
];

// —— 辅助函数：从题库按条件选题 ——

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 按难度梯度选题：entry → mid → deep，同一档位内随机。
// 规则：
// 1. 只有 1 题时取最浅的档位（保证开场不难）
// 2. 有 2 题以上时，最深档位至少占 1 个名额（保证一场面试内难度确实爬升，而不是全停在 mid）
// 3. 返回顺序即提问顺序，难度不倒挂
export function pickProgressive(qs: BankQuestion[], n: number): BankQuestion[] {
  const take = Math.min(n, qs.length);
  if (take <= 0) return [];

  const tiers = (["entry", "mid", "deep"] as const)
    .map((d) => shuffle(qs.filter((q) => q.difficulty === d)))
    .filter((group) => group.length > 0);

  const counts = new Array<number>(tiers.length).fill(0);
  if (take >= 2 && tiers.length >= 2) {
    counts[tiers.length - 1] = 1;
  }

  let remaining = take - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; i < tiers.length && remaining > 0; i++) {
    const give = Math.min(tiers[i].length - counts[i], remaining);
    counts[i] += give;
    remaining -= give;
  }

  const picked: BankQuestion[] = [];
  tiers.forEach((group, i) => picked.push(...group.slice(0, counts[i])));
  return picked;
}

export function allBankQuestions(): BankQuestion[] {
  return [
    ...WARMUP_QUESTIONS,
    ...CORE_QUESTIONS,
    ...SYSTEM_DESIGN_TEMPLATES,
    ...WRAPUP_QUESTIONS,
  ];
}
