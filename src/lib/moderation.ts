// 上傳照片的 AI 守門員（Gemini Flash）。
//
// 安全原則：**絕不因為審核服務不可用就放行**。
// 未設定 API key 或呼叫失敗時，正式環境一律回報 requiresManualReview，
// 呼叫端（uploadPhoto）會把照片存成 pending_review 且不進評分池。
// 開發環境為了方便測試才直接通過。

import type { ModerationResult } from "@/types";

const rawKey = process.env.GEMINI_API_KEY;
// 空值或 placeholder 一律視為未設定。
const GEMINI_API_KEY =
  rawKey && rawKey !== "placeholder" ? rawKey : undefined;
const MODERATION_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a photo moderation AI. Analyze the image and respond with JSON only.
Check for: NSFW content, apparent age under 18, non-real person (cartoon/anime/celebrity/stock photo), low quality.
Respond: {"passed": boolean, "reason": "ok"|"nsfw"|"underage"|"not_real_person"|"low_quality", "confidence": 0.0-1.0}`;

const VALID_REASONS = [
  "ok",
  "nsfw",
  "underage",
  "not_real_person",
  "low_quality",
] as const;

// 無法判定時的結果：正式環境送人工複審，開發環境放行。
function undetermined(): ModerationResult {
  if (process.env.NODE_ENV === "production") {
    return {
      passed: false,
      requiresManualReview: true,
      reason: "unreviewed",
      confidence: 0,
    };
  }
  return { passed: true, reason: "ok", confidence: 1.0 };
}

// 驗證模型回傳格式，避免把 `{}` 之類的雜訊當成有效判定。
function parseResult(text: string): ModerationResult | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.passed !== "boolean") return null;

  const reason = VALID_REASONS.includes(obj.reason as (typeof VALID_REASONS)[number])
    ? (obj.reason as ModerationResult["reason"])
    : obj.passed
      ? "ok"
      : "low_quality";

  return {
    passed: obj.passed,
    reason,
    confidence: typeof obj.confidence === "number" ? obj.confidence : 0,
  };
}

export async function moderatePhoto(
  imageBase64: string,
  mimeType: string,
): Promise<ModerationResult> {
  if (!GEMINI_API_KEY) return undetermined();

  try {
    const res = await fetch(`${MODERATION_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: "Moderate this photo." },
            ],
          },
        ],
        generation_config: { response_mime_type: "application/json" },
      }),
      // 避免審核服務卡住讓上傳無限等待。
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    // 格式不符 → 當成無法判定，不放行。
    return parseResult(text) ?? undetermined();
  } catch {
    return undetermined();
  }
}
