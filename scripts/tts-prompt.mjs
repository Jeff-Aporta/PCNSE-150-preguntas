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

/** Prompts por fragmento — tip track.
 *
 * Sistema de coherencia (PCNSE-150-preguntas, voz Jeff-Aporta):
 * - ttip = "Justificacion pregunta N. Tip. <tip>"
 * - correct = "Es correcta la opcion <X>"  (X = letra CANONICA, p.ej. "C")
 * - wrong   = "Es incorrecta. La respuesta correcta es la opcion <X>"
 *   Donde <X> es la letra canonica del banco (q.correctAnswer), no el slot
 *   barajado, porque el panel UI de justificaciones SIEMPRE muestra las
 *   opciones A,B,C,D en orden canonico (independiente del shuffle). El
 *   usuario mira en el panel la opcion cuya letra coincide con X.
 * - Explicaciones en orden: correcta (EA) -> incorrecta X baja (EB)
 *   -> otra incorrecta (EC) -> ultima incorrecta (ED).
 *   Es decir: PRIMERO la correcta, luego las incorrectas. Esto cumple con
 *   "primero se lee la correcta y luego se deben leer cuales son
 *   incorrectas".
 *
 * El playlist virtual (`core/audio-playlist.ts:buildTipOrder`) reproduce los
 * clips en orden: ttip -> correct/wrong -> Ecorrect -> EW1 -> EW2 -> EW3.
 */
export function buildTipClipPrompts(q, locale, enRow, isCorrect = false) {
  const num = q.id.replace(/^q/i, "");
  const tip = locale === "en" && enRow ? enRow.tip : q.tip;
  const explanations = locale === "en" && enRow ? enRow.explanations : q.explanations;
  const correct = q.correctAnswer; // "A" | "B" | "C" | "D" canonico
  const others = ["A", "B", "C", "D"].filter((l) => l !== correct);
  const ttip = locale === "en"
    ? `Explanation for question ${num}. Tip. ${tip}`
    : `Justificacion pregunta ${num}. Tip. ${tip}`;
  const correctFb = locale === "en"
    ? `Yes, you are right. The correct answer is option ${correct}.`
    : `Es correcta la opcion ${correct}.`;
  const wrongFb = locale === "en"
    ? `It is incorrect. The correct answer is option ${correct}.`
    : `Es incorrecta. La respuesta correcta es la opcion ${correct}.`;
  const expLine = (letter) => locale === "en"
    ? `Option ${letter}. ${explanations[letter]}`
    : `Opcion ${letter}. ${explanations[letter]}`;
  return {
    ttip,
    correct: correctFb,
    wrong: wrongFb,
    // 4 entradas fijas. EA contiene la explicacion de la correcta; EB..ED
    // contienen las 3 incorrectas en orden alfabetico ascendente.
    EA: expLine(correct),
    EB: expLine(others[0]),
    EC: expLine(others[1]),
    ED: expLine(others[2]),
  };
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
