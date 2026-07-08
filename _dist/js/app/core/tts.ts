import type { Question } from "./quiz.ts";
import type { AppLocale } from "./locale.ts";
import { localizeQuestion, questionAudioPath } from "./question-i18n.ts";

export const TTS_VOICE_ES = "English_Trustworth_Man";
export const TTS_VOICE_EN = "English_Trustworth_Man";
export const TTS_SPEED = 0.95;
export const TTS_MODEL = "speech-02-turbo";

/** Resuelve rutas relativas al index.html (base href). */
export function resolveAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:")) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return new URL(clean, document.baseURI).href;
}

/** Narración completa: pregunta + opciones A–D. */
export function buildTtsPrompt(q: Question, locale: AppLocale = "es"): string {
  const L = localizeQuestion(q, locale);
  const num = q.id.replace(/^q/i, "");
  const opts = L.options
    .map((o) => (locale === "en" ? `Option ${o.id}. ${o.text}` : `Opcion ${o.id}. ${o.text}`))
    .join(" ");
  if (locale === "en") {
    return `Question ${num}. Topic ${L.topic}. ${L.question}. ${opts}`;
  }
  return `Pregunta ${num}. ${L.topic}. ${L.question}. ${opts}`;
}

export function ttsVoiceFor(locale: AppLocale): string {
  return locale === "en" ? TTS_VOICE_EN : TTS_VOICE_ES;
}

export async function fetchTtsAudioBlob(text: string, locale: AppLocale = "es"): Promise<Blob> {
  const url = resolveAssetUrl("api/tts");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice_id: ttsVoiceFor(locale),
      speed: TTS_SPEED,
      model: TTS_MODEL,
      language_boost: locale === "en" ? "English" : "Spanish",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`TTS MiniMax falló (${res.status}): ${detail.slice(0, 200)}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("audio") && !ct.includes("octet-stream")) {
    throw new Error("TTS: respuesta no es audio (" + ct + ")");
  }
  return res.blob();
}

export { questionAudioPath };