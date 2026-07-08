/**
 * core/quiz.ts — Tipos y helpers del banco de preguntas.
 */

import type { QuestionTranslation } from "./question-i18n.ts";

export type AnswerId = "A" | "B" | "C" | "D";

export type Question = {
  id: string;
  topic: string;
  difficulty: "básico" | "intermedio" | "avanzado";
  question: string;
  options: { id: AnswerId; text: string }[];
  correctAnswer: AnswerId;
  tip: string;
  explanations: Record<AnswerId, string>;
  audioFile: string;
  en?: QuestionTranslation;
};

export type QuestionBank = {
  metadata: {
    exam: string;
    version: string;
    language: string;
    totalQuestions: number;
    topics: string[];
  };
  questions: Question[];
};

export type QuizMode = "all" | "topic";

export type QuizSession = {
  mode: QuizMode;
  topic?: string;
  totalQuestions: number;
  questions: Question[];
  startedAt: number;
  durationSec: number; // segundos totales del examen
};

export type AnswerRecord = {
  questionId: string;
  selected: AnswerId;
  correct: boolean;
  timeSpentSec: number;
};

export type QuizResult = {
  session: QuizSession;
  answers: AnswerRecord[];
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  durationUsedSec: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
};

const QUESTIONS_URL = new URL("data/questions.json", document.baseURI).href;
const QUESTIONS_EN_URL = new URL("data/questions.en.json", document.baseURI).href;

let cachedQuestions: Question[] | null = null;

export async function loadQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions;
  const [esRes, enRes] = await Promise.all([
    fetch(QUESTIONS_URL, { cache: "no-store" }),
    fetch(QUESTIONS_EN_URL, { cache: "no-store" }).catch(() => null),
  ]);
  if (!esRes.ok) throw new Error("No se pudo cargar questions.json: " + esRes.status);
  const data = (await esRes.json()) as QuestionBank;
  let enMap = new Map<string, QuestionTranslation>();
  if (enRes?.ok) {
    const enBank = (await enRes.json()) as { questions?: Array<QuestionTranslation & { id: string }> };
    for (const row of enBank.questions || []) {
      enMap.set(row.id, {
        question: row.question,
        options: row.options,
        tip: row.tip,
        explanations: row.explanations,
      });
    }
  }
  for (const q of data.questions) {
    const en = enMap.get(q.id);
    if (en) q.en = en;
    q.audioFile = `audio/es/${q.id}.mp3`;
  }
  cachedQuestions = data.questions;
  return cachedQuestions;
}

/** Fisher–Yates in-place shuffle. Returns the same array. */
export function shuffleArray<T>(arr: T[], rng: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** Mapeo estable letra → índice. */
const ANSWER_INDEX: Record<AnswerId, number> = { A: 0, B: 1, C: 2, D: 3 };

export function shuffleQuestionOptions(
  q: Question,
  rng: () => number = Math.random
): Question {
  // Permuta textos A–D pero conserva la letra correcta en `correctAnswer`.
  const pairs = q.options.map((o, idx) => ({ text: o.text, original: o.id }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pairs[i];
    pairs[i] = pairs[j];
    pairs[j] = tmp;
  }
  const letters: AnswerId[] = ["A", "B", "C", "D"];
  const newOptions = pairs.map((p, idx) => ({ id: letters[idx], text: p.text }));
  const newCorrect = letters[pairs.findIndex((p) => p.original === q.correctAnswer)];
  const newExplanations = letters.reduce<Record<AnswerId, string>>((acc, letter, idx) => {
    // `idx` apunta al `pairs` original; mantenemos la explicación según la letra NUEVA.
    acc[letter] = q.explanations[letters[idx]] ?? "";
    return acc;
  }, { A: "", B: "", C: "", D: "" });
  // `pairs[idx].original` es la letra vieja que ahora cae en `letters[idx]`.
  for (const [newLetter, idx] of letters.map((l, i) => [l, i] as const)) {
    const oldLetter = pairs[idx].original;
    newExplanations[newLetter] = q.explanations[oldLetter];
  }
  return {
    ...q,
    options: newOptions,
    correctAnswer: newCorrect,
    explanations: newExplanations,
  };
}

export function buildSession(mode: QuizMode, topic?: string, allQuestions: Question[] = []): QuizSession {
  let selected: Question[];
  if (mode === "topic" && topic) {
    selected = allQuestions.filter((q) => q.topic === topic);
  } else {
    selected = allQuestions.slice();
  }
  // Orden determinista por id (q001..q150) y opciones A–D mezcladas por sesión.
  selected.sort((a, b) => a.id.localeCompare(b.id));
  selected = selected.map((q) => shuffleQuestionOptions(q));
  return {
    mode,
    topic,
    totalQuestions: selected.length,
    questions: selected,
    startedAt: Date.now(),
    // 90 segundos por pregunta como tiempo sugerido (formato PCNSE-like)
    durationSec: Math.max(300, selected.length * 90),
  };
}

export function gradeAnswer(question: Question, selected: AnswerId): boolean {
  return question.correctAnswer === selected;
}

export function computeResult(
  session: QuizSession,
  answers: AnswerRecord[],
  durationUsedSec: number
): QuizResult {
  const correctCount = answers.filter((a) => a.correct).length;
  const scorePercent = Math.round((correctCount / session.totalQuestions) * 100);
  const topicBreakdown: Record<string, { correct: number; total: number }> = {};
  for (const a of answers) {
    const q = session.questions.find((qq) => qq.id === a.questionId);
    if (!q) continue;
    if (!topicBreakdown[q.topic]) topicBreakdown[q.topic] = { correct: 0, total: 0 };
    topicBreakdown[q.topic].total++;
    if (a.correct) topicBreakdown[q.topic].correct++;
  }
  return {
    session,
    answers,
    correctCount,
    totalQuestions: session.totalQuestions,
    scorePercent,
    durationUsedSec,
    topicBreakdown,
  };
}