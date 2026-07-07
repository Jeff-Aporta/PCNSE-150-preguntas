/**
 * core/quiz.ts — Tipos y helpers del banco de preguntas.
 */

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

const QUESTIONS_URL = "/data/questions.json";

let cachedQuestions: Question[] | null = null;

export async function loadQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions;
  const res = await fetch(QUESTIONS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar questions.json: " + res.status);
  const data = (await res.json()) as QuestionBank;
  // Asegurar audioFile (q001.mp3) por id
  for (const q of data.questions) {
    q.audioFile = "audio/" + q.id + ".mp3";
  }
  cachedQuestions = data.questions;
  return cachedQuestions;
}

export function buildSession(mode: QuizMode, topic?: string, allQuestions: Question[] = []): QuizSession {
  let selected: Question[];
  if (mode === "topic" && topic) {
    selected = allQuestions.filter((q) => q.topic === topic);
  } else {
    selected = allQuestions.slice();
  }
  // Orden determinista: por id
  selected.sort((a, b) => a.id.localeCompare(b.id));
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