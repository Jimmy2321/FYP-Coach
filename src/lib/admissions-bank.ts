// 留学申请面试固定题库
// 与 src/lib/question-bank.ts 同构（同样的 BankQuestion 类型、同样的 difficulty 分档），
// 但考察的是学术动机、领域理解与项目匹配，不是工程落地能力。
// Phase ②（陈述深挖）由 AI 从 PS claims 生成，不在此文件。

import type { BankQuestion } from "./question-bank";

// Phase ① — Motivation & Background（1-2 题）
// 开场必须是最浅的一档：先问"为什么读这个方向"，不要一上来就问研究计划或弱点
export const ADMISSIONS_WARMUP: BankQuestion[] = [
  {
    phase: 1,
    category: "Field Motivation",
    base_question:
      "What made you decide to pursue a postgraduate degree in this field, rather than start working after your bachelor's?",
    intent: "Open the interview at entry difficulty and test whether the motivation is specific or generic.",
    difficulty: "entry",
    followup_focus:
      "Is there a concrete experience, course, or problem behind the decision, or just 'I like it and a master's is the next step'?",
  },
  {
    phase: 1,
    category: "Academic Path",
    base_question:
      "Walk me through the piece of work you're proudest of from your bachelor's. What was the problem, what did you actually do, and what came out of it?",
    intent: "Assess whether they can describe their own work precisely — the foundation every later question builds on.",
    difficulty: "entry",
    followup_focus:
      "Do they separate their own contribution from the group's? Can they state the problem, the method, and the result without hedging?",
  },
  {
    phase: 1,
    category: "Field Awareness",
    base_question:
      "How did you first get interested in this area, and what have you done since then to learn more about it outside class?",
    intent: "Test genuine interest — what they did voluntarily, not what they were assigned.",
    difficulty: "mid",
    followup_focus:
      "Name one concrete thing (paper, project, competition, reading group). 'I watch videos' is not an answer; ask what they took from it.",
  },
  {
    phase: 1,
    category: "Self-Assessment",
    base_question:
      "Looking back at your undergraduate years, which part of your preparation for research do you think is weakest?",
    intent: "Assess self-awareness and honesty — admissions interviewers test whether the candidate can name a real gap.",
    difficulty: "mid",
    followup_focus:
      "Is the gap specific and plausible (e.g. 'I've never written a proper literature review')? Do they say what they'd do about it?",
  },
];

// Phase ③ — Field & Research Literacy（2-3 题）
// 考察"离开自己的项目之后还能不能谈这个领域"
export const ADMISSIONS_LITERACY: BankQuestion[] = [
  {
    phase: 3,
    category: "Reading Research",
    base_question:
      "Tell me about a paper or a talk in this field that changed how you think about a problem. What was the claim, and why did it convince you?",
    intent: "Assess whether they can summarize someone else's work and judge its evidence.",
    difficulty: "entry",
    followup_focus:
      "Can they state the paper's actual claim and its evidence (dataset, baseline, ablation)? Or only its conclusion? Did anything about it fail to convince them?",
  },
  {
    phase: 3,
    category: "Evaluating Evidence",
    base_question:
      "Suppose you read a paper reporting a large improvement over the previous method. What would you check before believing it?",
    intent: "Test research literacy: baselines, evaluation protocol, leakage, statistical significance.",
    difficulty: "mid",
    followup_focus:
      "Do they mention baseline fairness, dataset splits, variance across runs, or applicability beyond the benchmark? Or only 'I'd try to reproduce it'?",
  },
  {
    phase: 3,
    category: "Open Problems",
    base_question:
      "In your field, what do you think is currently the most interesting unsolved problem, and why is it hard?",
    intent: "Assess field awareness beyond coursework and their own project.",
    difficulty: "mid",
    followup_focus:
      "Is the problem real and currently discussed? Can they explain what makes it hard (data, theory, evaluation), or is it a buzzword?",
  },
  {
    phase: 3,
    category: "Learning Something New",
    base_question:
      "Say your supervisor hands you a topic you know nothing about and a month to get up to speed. What do you actually do, step by step?",
    intent: "Assess research method: how they build a mental map of an unfamiliar area.",
    difficulty: "mid",
    followup_focus:
      "Do they have a method (survey → key papers → reproduce a baseline → ask a specific question)? Or just 'read a lot'?",
  },
  {
    phase: 3,
    category: "Intellectual Honesty",
    base_question:
      "Describe a time your experiment or analysis produced a result you did not expect. What did you do with it?",
    intent: "Test whether they can report a negative or confusing result honestly instead of hiding it.",
    difficulty: "deep",
    followup_focus:
      "Did they investigate the cause, or explain it away? Can they distinguish 'my method is wrong' from 'my hypothesis is wrong'?",
  },
  {
    phase: 3,
    category: "Method Critique",
    base_question:
      "Take a method commonly used in this field. What is its main weakness, and when would you not use it?",
    intent: "Assess critical understanding of a standard method rather than textbook recall.",
    difficulty: "deep",
    followup_focus:
      "Can they name a concrete failure condition (assumption violated, data regime, cost) — not just 'it has limitations'?",
  },
];

// Phase ④ — Program Fit & Future Plan（1 题模板，由编排 API 用目标项目定制）
export const ADMISSIONS_FIT_TEMPLATES: BankQuestion[] = [
  {
    phase: 4,
    category: "Program Fit",
    base_question:
      "You're applying to [PROGRAM]. What specifically about this programme do you want, that you could not get from the programme you almost chose instead?",
    variation_hint:
      "Replace [PROGRAM] with the target program the candidate provided (school + programme name). If they named a supervisor or a lab, use it. NEVER invent a professor, a paper title, or a course name they did not mention.",
    intent: "Test whether the 'why this programme' answer has real content behind it.",
    difficulty: "mid",
    followup_focus:
      "Do they name concrete courses, labs, or a supervisor's actual line of work? Or only ranking and reputation?",
  },
  {
    phase: 4,
    category: "Research Plan",
    base_question:
      "If you joined [PROGRAM] next year, what would you want to work on in your first term, and what would you need to learn before you could start?",
    variation_hint:
      "Replace [PROGRAM] with the target program. Anchor the question in the field the candidate named in their statement — do not introduce a new research direction.",
    intent: "Assess whether the stated interest is concrete enough to become a plan.",
    difficulty: "deep",
    followup_focus:
      "Is the plan specific (a task, a dataset, an existing method to extend) and do they acknowledge a real prerequisite gap? Or is it a vague aspiration?",
  },
  {
    phase: 4,
    category: "Plan Under Constraint",
    base_question:
      "Suppose the topic you want is already taken by another student in the group. How would you decide what to work on instead?",
    variation_hint:
      "Anchor in the target program and the candidate's stated field. This probes flexibility, not knowledge.",
    intent: "Test intellectual flexibility — a common real admissions question.",
    difficulty: "deep",
    followup_focus:
      "Can they generate a genuinely adjacent problem rather than collapsing into 'whatever my supervisor says'?",
  },
];

// Phase ⑤ — Wrap-up（1 题）
export const ADMISSIONS_WRAPUP: BankQuestion[] = [
  {
    phase: 5,
    category: "Reverse Q&A",
    base_question: "Do you have any questions for me about the programme or the department?",
    intent: "What they ask reveals what they actually care about.",
    difficulty: "entry",
    followup_focus:
      "Do they ask about supervision, coursework, or research culture? Or say 'no' / ask something answered on the website?",
  },
  {
    phase: 5,
    category: "Closing",
    base_question: "Is there anything about your application you'd like to add that we haven't covered?",
    intent: "Last chance to surface something the statement could not carry.",
    difficulty: "entry",
    followup_focus:
      "Do they use it to add a concrete, relevant fact — or to repeat the statement?",
  },
];

export function allAdmissionsBankQuestions(): BankQuestion[] {
  return [
    ...ADMISSIONS_WARMUP,
    ...ADMISSIONS_LITERACY,
    ...ADMISSIONS_FIT_TEMPLATES,
    ...ADMISSIONS_WRAPUP,
  ];
}
