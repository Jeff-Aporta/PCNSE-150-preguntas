/**
 * scripts/tts-prompt.mjs — Prompt TTS compartido (runtime + generate-audio + tests).
 * Mantener UNA sola implementación para no divergir de _dist/js/app/core/tts.ts.
 */

/** Prompt monolítico (fallback). */
export function buildTtsPrompt(q, locale, enRow) {
  const num = q.id.replace(/^q/i, "");
  const topic = q.topic;
  const question = locale === "en" && enRow ? enRow.question : q.question;
  const options = locale === "en" && enRow ? enRow.options : q.options;
  const opts = options
    .map((o) => (locale === "en" ? `Option ${o.id}. ${o.text}` : `Opcion ${o.id}. ${o.text}`))
    .join(" ");
  if (locale === "en") {
    return `Question ${num}. Topic ${topic}. ${question}. ${opts}`;
  }
  return `Pregunta ${num}. ${topic}. ${question}. ${opts}`;
}

export function buildTipTtsPrompt(q, locale, enRow) {
  const num = q.id.replace(/^q/i, "");
  const tip = locale === "en" && enRow ? enRow.tip : q.tip;
  const explanations = locale === "en" && enRow ? enRow.explanations : q.explanations;
  const exps = ["A", "B", "C", "D"]
    .map((id) => (locale === "en" ? `Option ${id}. ${explanations[id]}` : `Opcion ${id}. ${explanations[id]}`))
    .join(" ");
  if (locale === "en") {
    return `Explanation for question ${num}. Tip. ${tip}. ${exps}`;
  }
  return `Justificacion pregunta ${num}. Tip. ${tip}. ${exps}`;
}

/** Prompts por fragmento — question track. */
export function buildClipPrompts(q, locale, enRow) {
  const num = q.id.replace(/^q/i, "");
  const topic = q.topic;
  const question = locale === "en" && enRow ? enRow.question : q.question;
  const options = locale === "en" && enRow ? enRow.options : q.options;
  const stmt = locale === "en"
    ? `Question ${num}. Topic ${topic}. ${question}`
    : `Pregunta ${num}. ${topic}. ${question}`;
  const out = {
    stmt,
    A: locale === "en" ? `Option A. ${options[0].text}` : `Opcion A. ${options[0].text}`,
    B: locale === "en" ? `Option B. ${options[1].text}` : `Opcion B. ${options[1].text}`,
    C: locale === "en" ? `Option C. ${options[2].text}` : `Opcion C. ${options[2].text}`,
    D: locale === "en" ? `Option D. ${options[3].text}` : `Opcion D. ${options[3].text}`,
  };
  return out;
}

/** Prompts por fragmento — tip track. */
export function buildTipClipPrompts(q, locale, enRow, isCorrect = false) {
  const num = q.id.replace(/^q/i, "");
  const tip = locale === "en" && enRow ? enRow.tip : q.tip;
  const explanations = locale === "en" && enRow ? enRow.explanations : q.explanations;
  const ttip = locale === "en"
    ? `Explanation for question ${num}. Tip. ${tip}`
    : `Justificacion pregunta ${num}. Tip. ${tip}`;
  const fb = isCorrect
    ? (locale === "en" ? "Correct." : "Correcto.")
    : (locale === "en" ? "Incorrect." : "Incorrecto.");
  const out = {
    ttip,
    correct: fb,
    wrong: fb,
    EA: locale === "en" ? `Option A. ${explanations.A}` : `Opcion A. ${explanations.A}`,
    EB: locale === "en" ? `Option B. ${explanations.B}` : `Opcion B. ${explanations.B}`,
    EC: locale === "en" ? `Option C. ${explanations.C}` : `Opcion C. ${explanations.C}`,
    ED: locale === "en" ? `Option D. ${explanations.D}` : `Opcion D. ${explanations.D}`,
  };
  return out;
}

export const QUESTION_CLIP_KEYS = ["stmt", "A", "B", "C", "D"];
export const TIP_CLIP_KEYS = ["ttip", "correct", "wrong", "EA", "EB", "EC", "ED"];

/** Aserciones reutilizables en tests. */
export function assertPromptIncludesOptions(prompt, locale) {
  const prefix = locale === "en" ? "Option A." : "Opcion A.";
  const alt = locale === "en" ? "Option D." : "Opcion D.";
  if (!prompt.includes(prefix) || !prompt.includes(alt)) {
    throw new Error(`TTS prompt missing options for ${locale}: ${prompt.slice(0, 120)}…`);
  }
}
