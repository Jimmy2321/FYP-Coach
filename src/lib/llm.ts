// DeepSeek 接入层：OpenAI 兼容协议，JSON 输出模式
// 所有评分/提取类调用统一 temperature=0，保证一致性

const API_URL = "https://api.deepseek.com/chat/completions";

export async function chatJSON<T>(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key || key === "sk-your-key-here") {
    throw new Error("DEEPSEEK_API_KEY is not set — add it to .env.local and restart the dev server");
  }
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0,
      max_tokens: opts.maxTokens ?? 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from DeepSeek");
  return JSON.parse(content) as T;
}
