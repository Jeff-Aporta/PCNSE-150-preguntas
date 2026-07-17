import type { AnswerId, Question } from "./quiz.ts";
import type { AppLocale } from "./locale.ts";
import { localizeQuestion, questionAudioPath } from "./question-i18n.ts";

// Voz clonada del autor (Jeff-Aporta). Funciona tanto en español como en
// inglés porque la API de MiniMax detecta el idioma del texto y aplica el
// mismo timbre. Si expira (>168h sin uso) se regenera con Voice Clone API.
export const WILLIAM_VOICE_ID = "moss_audio_6121c2b3-7957-11f1-b432-da8cea034f66";

export const TTS_VOICE_ES = WILLIAM_VOICE_ID;
export const TTS_VOICE_EN = WILLIAM_VOICE_ID;
export const TTS_SPEED = 0.95;
export const TTS_MODEL = "speech-02-turbo";

/** Resuelve rutas relativas al index.html (base href). */
export function resolveAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:")) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return new URL(clean, document.baseURI).href;
}

/** Narración monolítica (FALLBACK). */
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

/** Justificación monolítica (FALLBACK). */
export function buildTipTtsPrompt(q: Question, locale: AppLocale = "es"): string {
  const L = localizeQuestion(q, locale);
  const num = q.id.replace(/^q/i, "");
  const letters: AnswerId[] = ["A", "B", "C", "D"];
  const exps = letters
    .map((id) => (locale === "en" ? `Option ${id}. ${L.explanations[id]}` : `Opcion ${id}. ${L.explanations[id]}`))
    .join(" ");
  if (locale === "en") {
    return `Explanation for question ${num}. Tip. ${L.tip}. ${exps}`;
  }
  return `Justificacion pregunta ${num}. Tip. ${L.tip}. ${exps}`;
}

/** Prompts por fragmento — question track. */
export function buildClipPrompts(q: Question, locale: AppLocale = "es"): Record<string, string> {
  const L = localizeQuestion(q, locale);
  const num = q.id.replace(/^q/i, "");
  const stmt = locale === "en" ? `Question ${num}. Topic ${L.topic}. ${L.question}` : `Pregunta ${num}. ${L.topic}. ${L.question}`;
  const out: Record<string, string> = {
    stmt,
    A: locale === "en" ? `Option A. ${L.options[0].text}` : `Opcion A. ${L.options[0].text}`,
    B: locale === "en" ? `Option B. ${L.options[1].text}` : `Opcion B. ${L.options[1].text}`,
    C: locale === "en" ? `Option C. ${L.options[2].text}` : `Opcion C. ${L.options[2].text}`,
    D: locale === "en" ? `Option D. ${L.options[3].text}` : `Opcion D. ${L.options[3].text}`,
  };
  return out;
}

/** Prompts por fragmento — tip track.
 *
 * Sistema de coherencia (PCNSE-150-preguntas, voz Jeff-Aporta):
 * - "correct" / "wrong" anuncian explicitamente la letra correcta (canonica)
 *   para que el usuario la busque en el panel A,B,C,D (siempre canonico).
 * - EA = explicacion de la correcta (se narra PRIMERO).
 * - EB / EC / ED = explicaciones de las incorrectas en orden alfabetico.
 *
 * Coherencia con el shuffle de la sesion:
 *   En `QuizView` las opciones se barajan (A<->D), pero `q.correctAnswer`
 *   se remapea via `shuffleQuestionOptions` para que apunte al slot visible
 *   de la respuesta correcta. Aqui usamos `q.correctAnswer` (que ya esta
 *   remapeado) para anunciar la letra del SLOT visible. Asi el audio y la
 *   pantalla coinciden.
 */
export function buildTipClipPrompts(q: Question, locale: AppLocale = "es", isCorrect = false): Record<string, string> {
  const L = localizeQuestion(q, locale);
  const num = q.id.replace(/^q/i, "");
  const correct = q.correctAnswer; // ya remapeada al slot visible por shuffleQuestionOptions
  const others: AnswerId[] = (["A", "B", "C", "D"] as AnswerId[]).filter((l) => l !== correct);
  const ttip = locale === "en"
    ? `Explanation for question ${num}. Tip. ${L.tip}`
    : `Justificacion pregunta ${num}. Tip. ${L.tip}`;
  const correctFb = locale === "en"
    ? `Yes, you are right. The correct answer is option ${correct}.`
    : `Es correcta la opcion ${correct}.`;
  const wrongFb = locale === "en"
    ? `It is incorrect. The correct answer is option ${correct}.`
    : `Es incorrecta. La respuesta correcta es la opcion ${correct}.`;
  const expLine = (letter: AnswerId) => locale === "en"
    ? `Option ${letter}. ${L.explanations[letter]}`
    : `Opcion ${letter}. ${L.explanations[letter]}`;
  return {
    ttip,
    correct: correctFb,
    wrong: wrongFb,
    EA: expLine(correct),
    EB: expLine(others[0]),
    EC: expLine(others[1]),
    ED: expLine(others[2]),
  };
}

/** Paths de clip por key (canónica). */
export function clipPath(qid: string, locale: AppLocale, key: string): string {
  return `audio/${locale}/${qid}-${key}.mp3`;
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
