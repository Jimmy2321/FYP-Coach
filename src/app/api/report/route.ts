import { NextRequest, NextResponse } from "next/server";
import { evaluatePair, generateFeedback, summarize, summarizeOverview } from "@/lib/evaluation";
import type { ReportResult, ScoredQuestion, SessionResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESPONSES = 12;
const CONCURRENCY = 3;

// 追问属于同一道主题目的深入，合并成一段答案一起评
function composeAnswer(response: SessionResponse): string {
  const followups = Array.isArray(response.followups) ? response.followups : [];
  if (followups.length === 0) return response.answer;
  return [
    response.answer,
    ...followups.map((f) => `Follow-up: ${f.question}\nAnswer: ${f.answer}`),
  ].join("\n\n");
}

async function mapLimited<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const output = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        output[index] = await fn(items[index]);
      }
    }
  );
  await Promise.all(workers);
  return output;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const track = body.track === "admissions" ? "admissions" : "job";
    const responses: SessionResponse[] = Array.isArray(body.responses)
      ? body.responses
      : [];

    // Phase ⑤ 是收尾寒暄，不属于评分对象
    const usable = responses
      .filter(
        (r) =>
          r &&
          r.phase !== 5 &&
          typeof r.question === "string" &&
          r.question.trim().length > 0 &&
          typeof r.answer === "string" &&
          r.answer.trim().length > 0
      )
      .slice(0, MAX_RESPONSES);

    if (usable.length === 0) {
      return NextResponse.json(
        { error: "No scorable responses in this session" },
        { status: 400 }
      );
    }

    const evaluated = await mapLimited<SessionResponse, ScoredQuestion | null>(
      usable,
      CONCURRENCY,
      async (response) => {
        const answer = composeAnswer(response);
        // 引文只能来自候选人自己的话，不能来自问题或 Follow-up 标签
        const candidateWords = [
          response.answer,
          ...response.followups.map((f) => f.answer),
        ].join("\n\n");
        try {
          const score = await evaluatePair({
            questionId: response.question_id,
            question: response.question,
            answer,
            track,
            quoteSource: candidateWords,
          });

          let feedback = null;
          try {
            feedback = await generateFeedback({
              question: response.question,
              answer,
              score,
            });
          } catch {
            // 反馈失败不影响评分本身
            feedback = null;
          }

          return {
            question_id: response.question_id,
            question: response.question,
            answer,
            score,
            feedback,
          };
        } catch {
          return null;
        }
      }
    );

    const results = evaluated.filter((r): r is ScoredQuestion => r !== null);
    if (results.length === 0) {
      throw new Error("Every evaluation failed");
    }

    const payload: ReportResult = {
      results,
      summary: summarize(results.map((r) => r.score)),
      overview: summarizeOverview(results.map((r) => r.score)),
      failed: usable.length - results.length,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Report failed. ${msg}` }, { status: 502 });
  }
}
