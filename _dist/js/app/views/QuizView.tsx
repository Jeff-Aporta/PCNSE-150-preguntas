/**
 * views/QuizView.tsx — Pantalla del simulacro (preguntas secuenciales).
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import type { AnswerId, AnswerRecord, Question, QuizSession, QuizResult } from "../core/quiz.ts";
import { gradeAnswer, computeResult } from "../core/quiz.ts";
import { playQuestionAudio, stopAudio, pauseAudio, resumeAudio, getCurrentAudio, isAudioPlaying } from "../core/audio.ts";
import { useAppLocale } from "../components/LocaleToolbar.tsx";
import { localizeQuestion } from "../core/question-i18n.ts";
import { t, tDifficulty } from "../core/ui-i18n.ts";

type Props = {
  session: QuizSession;
  questions: Question[];
  onFinish: (result: QuizResult) => void;
  onAbort: () => void;
};

const optionLetters: AnswerId[] = ["A", "B", "C", "D"];

/** Scroll interno en cards cuando el texto es largo (tips, preguntas, opciones). */
const SCROLL = {
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  pr: 0.25,
} as const;

const SCROLL_QUESTION = { ...SCROLL, maxHeight: { xs: "22vh", sm: "26vh" } };
const SCROLL_OPTION = { ...SCROLL, maxHeight: { xs: "11vh", sm: "13vh" } };
const SCROLL_EXPLAIN = { ...SCROLL, maxHeight: { xs: "34vh", sm: "42vh" } };

export function QuizView({ session, onFinish, onAbort }: Props) {
  const { locale } = useAppLocale();
  const total = session.totalQuestions;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, AnswerId | undefined>>({});
  const [verifiedByQuestion, setVerifiedByQuestion] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(session.durationSec);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = session.questions[currentIdx];
  const L = currentQuestion ? localizeQuestion(currentQuestion, locale) : null;
  const currentSelected = selectedByQuestion[currentQuestion?.id];
  const currentVerified = verifiedByQuestion[currentQuestion?.id] || false;

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          // Auto-finalizar
          const usedSec = session.durationSec - t;
          const finalAnswers: AnswerRecord[] = Object.entries(selectedByQuestion).map(([qid, sel]) => {
            const q = session.questions.find((qq) => qq.id === qid);
            const correct = q && sel ? gradeAnswer(q, sel) : false;
            const ansRec = answers.find((a) => a.questionId === qid);
            return {
              questionId: qid,
              selected: sel || "A",
              correct,
              timeSpentSec: ansRec?.timeSpentSec || 0,
            };
          });
          onFinish(computeResult(session, finalAnswers, usedSec));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session, selectedByQuestion, answers, onFinish]);

  // Resetear cronómetro y audio por pregunta / idioma
  useEffect(() => {
    questionStartRef.current = Date.now();
    setAudioError(null);
    setAudioPlaying(false);
    stopAudio();
  }, [currentIdx, locale]);

  useEffect(() => () => stopAudio(), []);

  const wireAudio = useCallback((audio: HTMLAudioElement) => {
    const onPlay = () => setAudioPlaying(true);
    const onPause = () => setAudioPlaying(false);
    const onEnded = () => setAudioPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
  }, []);

  const handleAudioToggle = useCallback(async () => {
    if (!currentQuestion || audioLoading) return;
    const playing = isAudioPlaying();
    const current = getCurrentAudio();
    if (playing && current) {
      pauseAudio();
      return;
    }
    if (current && current.paused && current.currentTime > 0 && !current.ended) {
      try {
        await resumeAudio();
      } catch (err) {
        console.error("[WilliamQuest] audio resume:", err);
      }
      return;
    }
    stopAudio();
    setAudioError(null);
    setAudioLoading(true);
    try {
      const audio = await playQuestionAudio(currentQuestion, locale);
      audioRef.current = audio;
      wireAudio(audio);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAudioError(msg);
      console.error("[WilliamQuest] audio:", err);
    } finally {
      setAudioLoading(false);
    }
  }, [currentQuestion, audioLoading, locale, wireAudio]);

  const handleSelect = useCallback(
    (letter: AnswerId) => {
      if (currentVerified) return;
      setSelectedByQuestion((prev) => ({ ...prev, [currentQuestion.id]: letter }));
    },
    [currentQuestion?.id, currentVerified]
  );

  const handleVerify = useCallback(() => {
    if (!currentSelected) return;
    setVerifiedByQuestion((prev) => ({ ...prev, [currentQuestion.id]: true }));
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const correct = gradeAnswer(currentQuestion, currentSelected);
    setAnswers((prev) => [
      ...prev.filter((a) => a.questionId !== currentQuestion.id),
      { questionId: currentQuestion.id, selected: currentSelected, correct, timeSpentSec: timeSpent },
    ]);
  }, [currentQuestion, currentSelected]);

  const goNext = useCallback(() => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      // Finalizar
      const usedSec = session.durationSec - timeLeft;
      // Asegurar que la última pregunta está en answers
      let allAnswers = answers;
      if (currentSelected && !currentVerified) {
        // El usuario pasó sin verificar: contar como incorrecta
        allAnswers = [
          ...answers,
          {
            questionId: currentQuestion.id,
            selected: currentSelected,
            correct: gradeAnswer(currentQuestion, currentSelected),
            timeSpentSec: Math.round((Date.now() - questionStartRef.current) / 1000),
          },
        ];
      } else if (!currentSelected) {
        // No respondió
        allAnswers = [
          ...answers,
          { questionId: currentQuestion.id, selected: "A", correct: false, timeSpentSec: 0 },
        ];
      }
      onFinish(computeResult(session, allAnswers, usedSec));
    }
  }, [currentIdx, total, currentSelected, currentVerified, currentQuestion, answers, session, timeLeft, onFinish]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }, [currentIdx]);

  const progress = ((currentIdx + 1) / total) * 100;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        p: { xs: 1.5, sm: 3 },
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 880,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          py: 1,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            size="small"
            onClick={onAbort}
            startIcon={<iconify-icon icon="mdi:arrow-left" width="1.1em" height="1.1em" />}
            sx={{ color: "text.secondary" }}
          >
            {t("exit", locale)}
          </Button>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(30,144,255,0.10)",
                "& .MuiLinearProgress-bar": {
                  background: "linear-gradient(90deg, #1e90ff, #6366f1, #00e5ff)",
                  boxShadow: "0 0 12px rgba(30,144,255,0.55)",
                },
              }}
            />
          </Box>
          <Chip
            label={`${currentIdx + 1}/${total}`}
            sx={{
              fontWeight: 700,
              border: "1px solid rgba(30,144,255,0.35)",
              backgroundColor: "rgba(30,144,255,0.10)",
              color: "#7dd3fc",
            }}
          />
          <Chip
            icon={
              <iconify-icon
                icon={timeLeft < 60 ? "mdi:timer-alert-outline" : "mdi:timer-outline"}
                width="1.1em"
                height="1.1em"
              />
            }
            label={`${mm}:${ss}`}
            sx={{
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              border: timeLeft < 60 ? "1px solid rgba(239,68,68,0.55)" : "1px solid rgba(245,158,11,0.45)",
              backgroundColor: timeLeft < 60 ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.10)",
              color: timeLeft < 60 ? "#fca5a5" : "#fcd34d",
            }}
          />
        </Stack>

        {L ? (
        <Card
          sx={{
            flexShrink: 0,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(30,144,255,0.10) 0%, rgba(99,102,241,0.06) 50%, rgba(0,229,255,0.04) 100%)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, ...SCROLL_QUESTION }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5, flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                label={L.topic}
                sx={{
                  fontWeight: 700,
                  border: "1px solid rgba(0,229,255,0.40)",
                  backgroundColor: "rgba(0,229,255,0.10)",
                  color: "#7dd3fc",
                }}
              />
              <Chip
                size="small"
                label={tDifficulty(L.difficulty, locale)}
                sx={{
                  border: "1px solid rgba(168,85,247,0.40)",
                  backgroundColor: "rgba(168,85,247,0.10)",
                  color: "#d8b4fe",
                  textTransform: "capitalize",
                }}
              />
              <Box sx={{ flex: 1 }} />
              <Tooltip
                title={
                  audioError ||
                  (audioLoading ? t("generatingAudio", locale) : audioPlaying ? t("pauseAudioAria", locale) : t("listenQuestion", locale))
                }
              >
                <span>
                  <IconButton
                    onClick={handleAudioToggle}
                    disabled={audioLoading}
                    sx={{
                      background: audioPlaying
                        ? "linear-gradient(135deg, rgba(0,229,255,0.32), rgba(30,144,255,0.32))"
                        : "linear-gradient(135deg, rgba(0,229,255,0.18), rgba(30,144,255,0.18))",
                      border: `1px solid ${audioPlaying ? "rgba(0,229,255,0.70)" : "rgba(0,229,255,0.40)"}`,
                      opacity: audioLoading ? 0.6 : 1,
                      boxShadow: audioPlaying ? "0 0 22px rgba(0,229,255,0.50)" : "none",
                      animation: audioPlaying ? "wq-audio-pulse 1.4s ease-in-out infinite" : "none",
                      "@keyframes wq-audio-pulse": {
                        "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 18px rgba(0,229,255,0.40)" },
                        "50%": { transform: "scale(1.06)", boxShadow: "0 0 28px rgba(0,229,255,0.65)" },
                      },
                      "&:hover": {
                        boxShadow: "0 0 16px rgba(0,229,255,0.45)",
                        background: "linear-gradient(135deg, rgba(0,229,255,0.28), rgba(30,144,255,0.28))",
                      },
                    }}
                    aria-label={audioPlaying ? t("pauseAudioAria", locale) : t("playAudioAria", locale)}
                  >
                    <iconify-icon
                      icon={audioLoading ? "mdi:loading" : audioPlaying ? "mdi:pause" : "mdi:play"}
                      width="1.4em"
                      height="1.4em"
                    />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            <Typography
              variant="h6"
              sx={{ fontWeight: 600, lineHeight: 1.5, fontSize: { xs: "1.05rem", sm: "1.18rem" } }}
            >
              {L.question}
            </Typography>
          </CardContent>
        </Card>
        ) : null}

        {/* Opciones */}
        <Stack spacing={1.5} sx={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", pr: 0.25 }}>
          {(L?.options || []).map((opt) => {
            const isSelected = currentSelected === opt.id;
            const isCorrect = L!.correctAnswer === opt.id;
            let state: "idle" | "selected" | "correct" | "wrong" | "missed" = "idle";
            if (currentVerified) {
              if (isCorrect) state = "correct";
              else if (isSelected) state = "wrong";
              else state = "idle";
            } else if (isSelected) {
              state = "selected";
            }

            const palette = optionPalette(state);
            return (
              <Box
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                sx={{
                  cursor: currentVerified ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  border: `1px solid ${palette.border}`,
                  background: palette.background,
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s ease",
                  boxShadow: palette.shadow,
                  "&:hover": currentVerified
                    ? {}
                    : {
                        borderColor: "rgba(30,144,255,0.55)",
                        boxShadow: "0 0 18px rgba(30,144,255,0.25)",
                        transform: "translateY(-1px)",
                      },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    background: palette.badgeBg,
                    border: `1px solid ${palette.badgeBorder}`,
                    color: palette.badgeColor,
                    boxShadow: palette.badgeShadow,
                  }}
                >
                  {state === "correct" ? (
                    <iconify-icon icon="mdi:check-bold" width="1.2em" height="1.2em" />
                  ) : state === "wrong" ? (
                    <iconify-icon icon="mdi:close-thick" width="1.1em" height="1.1em" />
                  ) : (
                    opt.id
                  )}
                </Box>
                <Typography
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: { xs: "0.95rem", sm: "1.02rem" },
                    lineHeight: 1.55,
                    ...SCROLL_OPTION,
                  }}
                >
                  {opt.text}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Explicación post-verificar */}
        {currentVerified && L ? (
          <Card
            sx={{
              flexShrink: 0,
              overflow: "hidden",
              background:
                currentSelected === L.correctAnswer
                  ? "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)"
                  : "linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(185,28,28,0.06) 100%)",
              border: currentSelected === L.correctAnswer
                ? "1px solid rgba(16,185,129,0.40)"
                : "1px solid rgba(239,68,68,0.40)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 }, ...SCROLL_EXPLAIN }}>
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.2,
                    background: currentSelected === L.correctAnswer
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "linear-gradient(135deg, #ef4444, #b91c1c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: currentSelected === L.correctAnswer
                      ? "0 0 18px rgba(16,185,129,0.45)"
                      : "0 0 18px rgba(239,68,68,0.45)",
                  }}
                >
                  <iconify-icon
                    icon={
                      currentSelected === L.correctAnswer
                        ? "mdi:check-circle-outline"
                        : "mdi:close-circle-outline"
                    }
                    width="1.3em"
                    height="1.3em"
                    style={{ color: "#fff" }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {currentSelected === L.correctAnswer ? t("correct", locale) : t("wrong", locale)}
                </Typography>
              </Stack>

              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.4 }}
                >
                  {t("tipLabel", locale)}
                </Typography>
                <Typography sx={{ lineHeight: 1.65 }}>{L.tip}</Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.6 }}
                >
                  {t("explainLabel", locale)}
                </Typography>
                <Stack spacing={0.8}>
                  {optionLetters.map((letter) => {
                    const isCorrect = L.correctAnswer === letter;
                    const isPicked = currentSelected === letter;
                    return (
                      <Box
                        key={letter}
                        sx={{
                          display: "flex",
                          gap: 1,
                          p: 1.1,
                          borderRadius: 1.5,
                          background: isCorrect
                            ? "rgba(16,185,129,0.10)"
                            : isPicked
                            ? "rgba(239,68,68,0.10)"
                            : "transparent",
                          border: isCorrect
                            ? "1px solid rgba(16,185,129,0.30)"
                            : isPicked
                            ? "1px solid rgba(239,68,68,0.30)"
                            : "1px solid transparent",
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, minWidth: 22 }}>
                          {letter}
                          {isCorrect ? " ✓" : isPicked ? " ✗" : ""}
                        </Typography>
                        <Typography sx={{ flex: 1, fontSize: "0.92rem", lineHeight: 1.55 }}>
                          {L.explanations[letter]}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ) : null}

        {/* Botones de acción */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexShrink: 0 }}>
          <Button
            variant="outlined"
            disabled={currentIdx === 0}
            onClick={goPrev}
            startIcon={<iconify-icon icon="mdi:chevron-left" width="1.2em" height="1.2em" />}
          >
            {t("prev", locale)}
          </Button>
          <Box sx={{ flex: 1 }} />
          {!currentVerified ? (
            <Button
              variant="contained"
              disabled={!currentSelected}
              onClick={handleVerify}
              startIcon={<iconify-icon icon="mdi:check-decagram-outline" width="1.2em" height="1.2em" />}
              sx={{
                background: currentSelected
                  ? "linear-gradient(135deg, #1e90ff 0%, #6366f1 100%)"
                  : undefined,
              }}
            >
              {t("verify", locale)}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={goNext}
              endIcon={<iconify-icon icon={currentIdx === total - 1 ? "mdi:flag-checkered" : "mdi:chevron-right"} width="1.2em" height="1.2em" />}
              sx={{
                background: "linear-gradient(135deg, #00e5ff 0%, #1e90ff 50%, #6366f1 100%)",
                boxShadow: "0 0 24px rgba(30,144,255,0.40)",
                "&:hover": { boxShadow: "0 0 32px rgba(30,144,255,0.60)" },
              }}
            >
              {currentIdx === total - 1 ? t("finish", locale) : t("next", locale)}
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function optionPalette(state: "idle" | "selected" | "correct" | "wrong" | "missed") {
  switch (state) {
    case "correct":
      return {
        border: "rgba(16,185,129,0.55)",
        background: "linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(5,150,105,0.06) 100%)",
        shadow: "0 0 24px rgba(16,185,129,0.30)",
        badgeBg: "linear-gradient(135deg, #10b981, #059669)",
        badgeBorder: "rgba(16,185,129,0.70)",
        badgeColor: "#fff",
        badgeShadow: "0 0 14px rgba(16,185,129,0.55)",
      };
    case "wrong":
      return {
        border: "rgba(239,68,68,0.55)",
        background: "linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(185,28,28,0.06) 100%)",
        shadow: "0 0 24px rgba(239,68,68,0.30)",
        badgeBg: "linear-gradient(135deg, #ef4444, #b91c1c)",
        badgeBorder: "rgba(239,68,68,0.70)",
        badgeColor: "#fff",
        badgeShadow: "0 0 14px rgba(239,68,68,0.55)",
      };
    case "selected":
      return {
        border: "rgba(0,229,255,0.55)",
        background: "linear-gradient(135deg, rgba(0,229,255,0.10) 0%, rgba(30,144,255,0.08) 100%)",
        shadow: "0 0 18px rgba(0,229,255,0.25)",
        badgeBg: "linear-gradient(135deg, #00e5ff, #1e90ff)",
        badgeBorder: "rgba(0,229,255,0.70)",
        badgeColor: "#fff",
        badgeShadow: "0 0 14px rgba(0,229,255,0.55)",
      };
    default:
      return {
        border: "rgba(30,144,255,0.22)",
        background: "linear-gradient(135deg, rgba(15,23,42,0.40) 0%, rgba(11,18,32,0.55) 100%)",
        shadow: "0 4px 12px rgba(0,0,0,0.20)",
        badgeBg: "rgba(30,144,255,0.10)",
        badgeBorder: "rgba(30,144,255,0.40)",
        badgeColor: "#7dd3fc",
        badgeShadow: "none",
      };
  }
}