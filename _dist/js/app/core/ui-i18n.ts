/**
 * core/ui-i18n.ts — Cadenas de UI (nav, botones, mensajes).
 */
import type { AppLocale } from "./locale.ts";
import type { Question } from "./quiz.ts";

const STRINGS = {
  es: {
    navHome: "Inicio",
    navQuiz: "Práctica",
    navResults: "Resultados",
    loadingQuestions: "Cargando banco de preguntas…",
    loadError: "No se pudieron cargar las preguntas. Verifica tu conexión o inténtalo más tarde.",
    invalidState: "Estado inválido. Vuelve al inicio.",
    exit: "Salir",
    prev: "Anterior",
    verify: "Verificar respuesta",
    next: "Siguiente",
    finish: "Finalizar",
    correct: "¡Correcto!",
    wrong: "Incorrecto",
    tipLabel: "Tip del porqué",
    explainLabel: "Explicación por opción",
    playAudio: "Escuchar la pregunta",
    generatingAudio: "Generando audio…",
    listenQuestion: "Escuchar la pregunta y opciones",
    playAudioAria: "Reproducir audio de pregunta y opciones",
    pauseAudioAria: "Pausar audio",
    langToggle: "Cambiar idioma",
    heroTitle: "Simulador PCNSE",
    heroSubtitle: "Palo Alto Networks Certified Security Engineer · {count} preguntas reales",
    heroBody:
      "Practica con preguntas tipo examen sobre App-ID, User-ID, Content-ID, NAT, VPN, Panorama, HA, Decryption, WildFire y Troubleshooting. Cada pregunta tiene audio, tips del porqué la respuesta es correcta y explicación de las opciones incorrectas.",
    chipAudio: "Audio ES/EN",
    chipTips: "Tips y explicaciones",
    chipSimple: "Lenguaje sencillo",
    chipScore: "Score final",
    configTitle: "Configura tu simulacro",
    modeAll: "Todas las preguntas ({count})",
    modeAllHint: "Simulacro completo tipo PCNSE",
    modeTopic: "Por tema",
    modeTopicHint: "Practica un tema específico",
    topicLabel: "Tema:",
    questionsCount: "{count} pregunta(s) · tiempo sugerido {min} min",
    lastScore: "Último score: {score}% · {attempts} intento(s)",
    noAttempts: "Sin intentos aún",
    startQuiz: "Empezar simulacro",
    howTitle: "Cómo se evalúa",
    how1: "Lee la pregunta o pulsa el botón de audio para escucharla con las opciones.",
    how2: "Selecciona la opción que creas correcta (A, B, C o D).",
    how3: "Tras seleccionar, verás si acertaste y por qué.",
    how4: "Al finalizar verás tu score, qué temas reforzar y la explicación completa.",
    how5: "Tip: el examen PCNSE real es exigente; aquí practicamos como tal, con lenguaje claro.",
    score: "Score",
    correctOf: "{correct} de {total} correctas · {duration} usado",
    timeUp: " (tiempo agotado)",
    topicBreakdown: "Desempeño por tema",
    retry: "Reintentar",
    backHome: "Volver al inicio",
    reviewTitle: "Revisión detallada",
    questionN: "Pregunta {n} · {topic}",
    yourAnswer: "Tu: {letter}",
    correctAnswer: "OK: {letter}",
    scoreExcellent: "¡Excelente! Listo para el examen",
    scoreGreat: "Muy bien, casi listo",
    scoreGood: "Vas bien, sigue practicando",
    scoreFair: "Necesitas reforzar varios temas",
    scoreLow: "A repasar con calma — tú puedes",
    difficulty: { básico: "básico", intermedio: "intermedio", avanzado: "avanzado" },
  },
  en: {
    navHome: "Home",
    navQuiz: "Practice",
    navResults: "Results",
    loadingQuestions: "Loading question bank…",
    loadError: "Could not load questions. Check your connection and try again.",
    invalidState: "Invalid state. Return to home.",
    exit: "Exit",
    prev: "Previous",
    verify: "Check answer",
    next: "Next",
    finish: "Finish",
    correct: "Correct!",
    wrong: "Incorrect",
    tipLabel: "Why this answer",
    explainLabel: "Explanation per option",
    playAudio: "Play question audio",
    generatingAudio: "Generating audio…",
    listenQuestion: "Listen to question and options",
    playAudioAria: "Play question and options audio",
    pauseAudioAria: "Pause audio",
    langToggle: "Switch language",
    heroTitle: "PCNSE Simulator",
    heroSubtitle: "Palo Alto Networks Certified Security Engineer · {count} real questions",
    heroBody:
      "Practice exam-style questions on App-ID, User-ID, Content-ID, NAT, VPN, Panorama, HA, Decryption, WildFire, and Troubleshooting. Each question includes audio, tips explaining the correct answer, and explanations for wrong options.",
    chipAudio: "ES/EN audio",
    chipTips: "Tips & explanations",
    chipSimple: "Plain language",
    chipScore: "Final score",
    configTitle: "Configure your practice",
    modeAll: "All questions ({count})",
    modeAllHint: "Full PCNSE-style simulation",
    modeTopic: "By topic",
    modeTopicHint: "Practice a specific topic",
    topicLabel: "Topic:",
    questionsCount: "{count} question(s) · suggested time {min} min",
    lastScore: "Last score: {score}% · {attempts} attempt(s)",
    noAttempts: "No attempts yet",
    startQuiz: "Start practice",
    howTitle: "How scoring works",
    how1: "Read the question or tap audio to hear it with all options.",
    how2: "Select the option you believe is correct (A, B, C, or D).",
    how3: "After selecting, you'll see whether you were right and why.",
    how4: "When finished you'll see your score, topics to review, and full explanations.",
    how5: "Tip: the real PCNSE is demanding; we practice the same way, in clear language.",
    score: "Score",
    correctOf: "{correct} of {total} correct · {duration} used",
    timeUp: " (time expired)",
    topicBreakdown: "Performance by topic",
    retry: "Retry",
    backHome: "Back to home",
    reviewTitle: "Detailed review",
    questionN: "Question {n} · {topic}",
    yourAnswer: "Yours: {letter}",
    correctAnswer: "OK: {letter}",
    scoreExcellent: "Excellent! Exam ready",
    scoreGreat: "Very good, almost there",
    scoreGood: "Good progress, keep practicing",
    scoreFair: "Several topics need reinforcement",
    scoreLow: "Review calmly — you've got this",
    difficulty: { básico: "basic", intermedio: "intermediate", avanzado: "advanced" },
  },
} as const;

export type UiKey = keyof typeof STRINGS.es;

export function t(key: UiKey, locale: AppLocale): string {
  const block = STRINGS[locale] ?? STRINGS.es;
  const val = block[key];
  return typeof val === "string" ? val : String(val);
}

export function tf(key: UiKey, locale: AppLocale, vars: Record<string, string | number>): string {
  let s = t(key, locale);
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}

export function tDifficulty(level: Question["difficulty"], locale: AppLocale): string {
  const block = STRINGS[locale]?.difficulty ?? STRINGS.es.difficulty;
  return block[level] ?? level;
}

export function scoreLabelFor(p: number, locale: AppLocale): string {
  if (p >= 90) return t("scoreExcellent", locale);
  if (p >= 80) return t("scoreGreat", locale);
  if (p >= 60) return t("scoreGood", locale);
  if (p >= 40) return t("scoreFair", locale);
  return t("scoreLow", locale);
}

export function formatDuration(sec: number, locale: AppLocale): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return locale === "en" ? `${m}m ${String(s).padStart(2, "0")}s` : `${m}m ${String(s).padStart(2, "0")}s`;
}
