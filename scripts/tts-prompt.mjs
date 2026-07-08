/**
 * scripts/tts-prompt.mjs — Prompt TTS compartido (runtime + generate-audio + tests).
 * Mantener UNA sola implementación para no divergir de _dist/js/app/core/tts.ts.
 */
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

/** Aserciones reutilizables en tests. */
export function assertPromptIncludesOptions(prompt, locale) {
  const prefix = locale === "en" ? "Option A." : "Opcion A.";
  const alt = locale === "en" ? "Option D." : "Opcion D.";
  if (!prompt.includes(prefix) || !prompt.includes(alt)) {
    throw new Error(`TTS prompt missing options for ${locale}: ${prompt.slice(0, 120)}…`);
  }
}
