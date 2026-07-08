/**
 * core/question-i18n.ts — Texto localizado de preguntas (ES + EN).
 */
import type { AnswerId, Question } from "./quiz.ts";
import type { AppLocale } from "./locale.ts";

export type QuestionTranslation = {
  question: string;
  options: { id: AnswerId; text: string }[];
  tip: string;
  explanations: Record<AnswerId, string>;
};

export function questionAudioPath(id: string, locale: AppLocale): string {
  return `audio/${locale}/${id}.mp3`;
}

/** Devuelve copia de la pregunta con textos del idioma activo. */
export function localizeQuestion(q: Question, locale: AppLocale): Question {
  if (locale === "es" || !q.en) {
    return { ...q, audioFile: questionAudioPath(q.id, "es") };
  }
  return {
    ...q,
    question: q.en.question,
    options: q.en.options,
    tip: q.en.tip,
    explanations: q.en.explanations,
    audioFile: questionAudioPath(q.id, "en"),
  };
}
