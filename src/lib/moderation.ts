// Gemini Flash image moderation stub — gatekeeper before photos go live
// Replace with real Gemini pipeline once API key is provided

import type { ModerationResult } from "@/types";

const rawKey = process.env.GEMINI_API_KEY;
// 空值或 placeholder 一律視為未設定（避免拿假 key 打 API 導致上傳被擋）
const GEMINI_API_KEY =
  rawKey && rawKey !== "placeholder" ? rawKey : undefined;
const MODERATION_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a photo moderation AI. Analyze the image and respond with JSON only.
Check for: NSFW content, apparent age under 18, non-real person (cartoon/anime/celebrity/stock photo), low quality.
Respond: {"passed": boolean, "reason": "ok"|"nsfw"|"underage"|"not_real_person"|"low_quality", "confidence": 0.0-1.0}`;

export async function moderatePhoto(imageBase64: string, mimeType: string): Promise<ModerationResult> {
  if (!GEMINI_API_KEY) {
    // Stub: always pass in dev
    return { passed: true, reason: "ok", confidence: 1.0 };
  }

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
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return JSON.parse(text) as ModerationResult;
  } catch {
    // Fail open in dev, fail closed in prod
    return process.env.NODE_ENV === "production"
      ? { passed: false, reason: "low_quality", confidence: 0 }
      : { passed: true, reason: "ok", confidence: 1.0 };
  }
}
