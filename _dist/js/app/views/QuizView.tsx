/**
 * views/QuizView.tsx — Pantalla del simulacro (preguntas secuenciales).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Chip,
} from "@mui/material";
import type { AnswerId, AnswerRecord, Question, QuizSession, QuizResult } from "../core/quiz.ts";
import { gradeAnswer, computeResult } from "../core/quiz.ts";
import { stopAudio } from "../core/audio.ts";
import { useAppLocale } from "../components/LocaleToolbar.tsx";
import { AudioPlayerBar } from "../components/AudioPlayerBar.tsx";
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
const PANEL_SCROLL = { ...SCROLL, flex: 1, minHeight: 0 };

export function QuizView({ session, onFinish, onAbort }: Props) {
  const { locale } = useAppLocale();
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const modeValue = <T,>(v: T | { light: T; dark: T }) =>
    typeof v === "object" && v !== null && "light" in (v as { light: T })
      ? (v as { light: T; dark: T })[isLight ? "light" : "dark"]
      : (v as T);
  const total = session.totalQuestions;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, AnswerId | undefined>>({});
  const [verifiedByQuestion, setVerifiedByQuestion] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(session.durationSec);
  const questionStartRef = useRef<number>(Date.now());

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
    stopAudio();
  }, [currentIdx, locale]);

  useEffect(() => () => stopAudio(), []);

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
  const isCorrect = !!(L && currentSelected === L.correctAnswer);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        p: { xs: 1.5, sm: 3 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: currentVerified ? { xs: 880, md: 1320 } : { xs: 880 }, mx: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ flexShrink: 0 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              size="small"
              onClick={onAbort}
              startIcon={<iconify-icon icon="mdi:arrow-left" width="1.1em" height="1.1em" />}
              sx={{ color: "text.secondary" }}
            >
              {t("exit", locale)}
            </Button>
            <Box sx={{ flex: 1, display: { xs: "block", sm: "none" }, minWidth: 0 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "rgba(30,144,255,0.10)",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #1e90ff, #6366f1, #00e5ff)",
                    boxShadow: isLight ? "0 1px 2px rgba(30,144,255,0.30)" : "0 0 12px rgba(30,144,255,0.55)",
                  },
                }}
              />
            </Box>
          </Stack>
          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" }, minWidth: 0 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(30,144,255,0.10)",
                "& .MuiLinearProgress-bar": {
                  background: "linear-gradient(90deg, #1e90ff, #6366f1, #00e5ff)",
                  boxShadow: isLight ? "0 1px 2px rgba(30,144,255,0.30)" : "0 0 12px rgba(30,144,255,0.55)",
                },
              }}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: "space-between", sm: "flex-end" } }}>
            <Chip
              label={`${currentIdx + 1}/${total}`}
              sx={{
                fontWeight: 700,
                border: `1px solid ${isLight ? "rgba(30,144,255,0.45)" : "rgba(30,144,255,0.35)"}`,
                backgroundColor: isLight ? "rgba(30,144,255,0.10)" : "rgba(30,144,255,0.10)",
                color: isLight ? "#0c4a82" : "#7dd3fc",
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
                pl: 1,
                border:
                  timeLeft < 60
                    ? `1px solid ${isLight ? "rgba(190,18,60,0.55)" : "rgba(239,68,68,0.55)"}`
                    : `1px solid ${isLight ? "rgba(180,83,9,0.55)" : "rgba(245,158,11,0.45)"}`,
                backgroundColor:
                  timeLeft < 60
                    ? isLight
                      ? "rgba(190,18,60,0.10)"
                      : "rgba(239,68,68,0.10)"
                    : isLight
                    ? "rgba(180,83,9,0.10)"
                    : "rgba(245,158,11,0.10)",
                color: isLight
                  ? timeLeft < 60
                    ? "#9f1239"
                    : "#92400e"
                  : timeLeft < 60
                  ? "#fca5a5"
                  : "#fcd34d",
                "& .MuiChip-icon": { ml: 0.5, mr: -0.25 },
              }}
            />
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            overflow: "hidden",
          }}
        >
          {/* Columna principal: pregunta + opciones + acciones */}
          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {L ? (
        <Card
          sx={{
            flexShrink: 0,
            overflow: "hidden",
            background: isLight
              ? "linear-gradient(135deg, rgba(30,144,255,0.08) 0%, rgba(99,102,241,0.04) 50%, rgba(0,229,255,0.03) 100%)"
              : "linear-gradient(135deg, rgba(30,144,255,0.10) 0%, rgba(99,102,241,0.06) 50%, rgba(0,229,255,0.04) 100%)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, ...SCROLL_QUESTION }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5, flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                label={L.topic}
                sx={{
                  fontWeight: 700,
                  border: `1px solid ${isLight ? "rgba(8,145,178,0.45)" : "rgba(0,229,255,0.40)"}`,
                  backgroundColor: isLight ? "rgba(8,145,178,0.10)" : "rgba(0,229,255,0.10)",
                  color: isLight ? "#0e7490" : "#7dd3fc",
                }}
              />
              <Chip
                size="small"
                label={tDifficulty(L.difficulty, locale)}
                sx={{
                  border: `1px solid ${isLight ? "rgba(124,58,237,0.45)" : "rgba(168,85,247,0.40)"}`,
                  backgroundColor: isLight ? "rgba(124,58,237,0.10)" : "rgba(168,85,237,0.10)",
                  color: isLight ? "#6d28d9" : "#d8b4fe",
                  textTransform: "capitalize",
                }}
              />
              <Box sx={{ flex: 1 }} />
              <AudioPlayerBar
                track="question"
                question={currentQuestion}
                idleTooltipKey="listenQuestion"
                playAriaKey="playAudioAria"
              />
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
                  border: `1px solid ${modeValue(palette.border)}`,
                  background: palette.background,
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s ease",
                  boxShadow: modeValue(palette.shadow),
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
                  aria-hidden
                  sx={{
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: { xs: "0.95rem", sm: "1.05rem" },
                    background: palette.badgeBg,
                    border: `1px solid ${modeValue(palette.badgeBorder)}`,
                    color: modeValue(palette.badgeColor),
                    boxShadow: palette.badgeShadow,
                  }}
                >
                  {opt.id}
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

        {/* Botones de acción */}
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{ mt: 1, flexShrink: 0 }}
        >
          <Button
            variant="outlined"
            disabled={currentIdx === 0}
            onClick={goPrev}
            startIcon={<iconify-icon icon="mdi:chevron-left" width="1.2em" height="1.2em" />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("prev", locale)}
          </Button>
          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
          {!currentVerified ? (
            <Button
              variant="contained"
              disabled={!currentSelected}
              onClick={handleVerify}
              startIcon={<iconify-icon icon="mdi:check-decagram-outline" width="1.2em" height="1.2em" />}
              sx={{
                width: { xs: "100%", sm: "auto" },
                background: currentSelected
                  ? "linear-gradient(135deg, #1e90ff 0%, #6366f1 100%)"
                  : undefined,
                boxShadow: currentSelected && isLight
                  ? "0 6px 16px rgba(30,144,255,0.30)"
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
                width: { xs: "100%", sm: "auto" },
                background: "linear-gradient(135deg, #00e5ff 0%, #1e90ff 50%, #6366f1 100%)",
                boxShadow: isLight
                  ? "0 6px 18px rgba(30,144,255,0.30)"
                  : "0 0 24px rgba(30,144,255,0.40)",
                "&:hover": {
                  boxShadow: isLight
                    ? "0 10px 26px rgba(30,144,255,0.40)"
                    : "0 0 32px rgba(30,144,255,0.60)",
                },
              }}
            >
              {currentIdx === total - 1 ? t("finish", locale) : t("next", locale)}
            </Button>
          )}
        </Stack>
          </Box>

          {/* Panel derecho: justificación post-verificar */}
          {currentVerified && L ? (
            <Box
              sx={{
                width: { xs: "100%", md: 400 },
                flexShrink: 0,
                minHeight: { xs: 220, md: 0 },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Card
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  background: isCorrect
                    ? isLight
                      ? "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(255,255,255,0.85) 100%)"
                      : "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)"
                    : isLight
                    ? "linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(255,255,255,0.88) 100%)"
                    : "linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(185,28,28,0.06) 100%)",
                  border: isCorrect
                    ? `1px solid ${isLight ? "rgba(16,185,129,0.40)" : "rgba(16,185,129,0.40)"}`
                    : `1px solid ${isLight ? "rgba(239,68,68,0.40)" : "rgba(239,68,68,0.40)"}`,
                  boxShadow: isCorrect
                    ? isLight
                      ? "0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 18px rgba(16,185,129,0.10)"
                      : "0 0 28px rgba(16,185,129,0.18), inset 0 1px 0 rgba(255,255,255,0.04)"
                    : isLight
                    ? "0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 18px rgba(239,68,68,0.10)"
                    : "0 0 28px rgba(239,68,68,0.16), inset 0 1px 0 rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5, flexShrink: 0, flexWrap: "wrap", gap: 1 }}>
                    <Box
                      sx={{
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        borderRadius: 1.2,
                        background: isCorrect
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : "linear-gradient(135deg, #ef4444, #b91c1c)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isLight
                          ? "0 2px 6px rgba(0,0,0,0.18)"
                          : isCorrect
                          ? "0 0 14px rgba(16,185,129,0.45)"
                          : "0 0 14px rgba(239,68,68,0.45)",
                      }}
                    >
                      <iconify-icon
                        icon={isCorrect ? "mdi:check-circle-outline" : "mdi:close-circle-outline"}
                        width="1.3em"
                        height="1.3em"
                        style={{ color: "#fff" }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }}>
                      {isCorrect ? t("correct", locale) : t("wrong", locale)}
                    </Typography>
                  </Stack>

                  <Box sx={{ mb: 1.5, flexShrink: 0 }}>
                    <AudioPlayerBar
                      track="tip"
                      question={currentQuestion}
                      idleTooltipKey="listenTip"
                      playAriaKey="playTipAria"
                    />
                  </Box>

                  <Box sx={{ ...PANEL_SCROLL }}>
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
                          const letterCorrect = L.correctAnswer === letter;
                          const isPicked = currentSelected === letter;
                          return (
                            <Box
                              key={letter}
                              sx={{
                                display: "flex",
                                gap: 1,
                                p: { xs: 0.9, sm: 1.1 },
                                borderRadius: 1.5,
                                background: letterCorrect
                                  ? isLight
                                    ? "rgba(16,185,129,0.16)"
                                    : "rgba(16,185,129,0.10)"
                                  : isPicked
                                  ? isLight
                                    ? "rgba(239,68,68,0.14)"
                                    : "rgba(239,68,68,0.10)"
                                  : "transparent",
                                border: letterCorrect
                                  ? `1px solid ${
                                      isLight ? "rgba(16,185,129,0.45)" : "rgba(16,185,129,0.30)"
                                    }`
                                  : isPicked
                                  ? `1px solid ${
                                      isLight ? "rgba(239,68,68,0.45)" : "rgba(239,68,68,0.30)"
                                    }`
                                  : isLight
                                  ? "1px solid rgba(0,0,0,0.06)"
                                  : "1px solid transparent",
                                boxShadow: letterCorrect
                                  ? isLight
                                    ? "0 0 0 2px rgba(16,185,129,0.08)"
                                    : "0 0 12px rgba(16,185,129,0.18)"
                                  : isPicked
                                  ? isLight
                                    ? "0 0 0 2px rgba(239,68,68,0.08)"
                                    : "0 0 12px rgba(239,68,68,0.18)"
                                  : "none",
                              }}
                            >
                              <Typography
                                aria-hidden
                                sx={{
                                  fontWeight: 800,
                                  minWidth: 22,
                                  flexShrink: 0,
                                  color: letterCorrect
                                    ? isLight
                                      ? "#0f9d68"
                                      : "#10b981"
                                    : isPicked
                                    ? isLight
                                      ? "#d32f2f"
                                      : "#ef4444"
                                    : "text.primary",
                                }}
                              >
                                {letter}
                              </Typography>
                              <Typography sx={{ flex: 1, fontSize: "0.92rem", lineHeight: 1.55 }}>
                                {L.explanations[letter]}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function optionPalette(state: "idle" | "selected" | "correct" | "wrong" | "missed") {
  switch (state) {
    case "correct":
      return {
        border: "rgba(16,185,129,0.55)",
        background:
          "linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(5,150,105,0.06) 100%)",
        shadow: { light: "0 0 18px rgba(16,185,129,0.18)", dark: "0 0 24px rgba(16,185,129,0.30)" },
        badgeBg: "linear-gradient(135deg, #10b981, #059669)",
        badgeBorder: "rgba(16,185,129,0.70)",
        badgeColor: "#fff",
        badgeShadow: "0 0 10px rgba(16,185,129,0.45)",
      };
    case "wrong":
      return {
        border: "rgba(239,68,68,0.55)",
        background:
          "linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(185,28,28,0.06) 100%)",
        shadow: { light: "0 0 18px rgba(239,68,68,0.16)", dark: "0 0 24px rgba(239,68,68,0.30)" },
        badgeBg: "linear-gradient(135deg, #ef4444, #b91c1c)",
        badgeBorder: "rgba(239,68,68,0.70)",
        badgeColor: "#fff",
        badgeShadow: "0 0 10px rgba(239,68,68,0.45)",
      };
    case "selected":
      return {
        border: "rgba(0,229,255,0.55)",
        background:
          "linear-gradient(135deg, rgba(0,229,255,0.10) 0%, rgba(30,144,255,0.08) 100%)",
        shadow: { light: "0 0 14px rgba(0,229,255,0.16)", dark: "0 0 18px rgba(0,229,255,0.25)" },
        badgeBg: "linear-gradient(135deg, #00e5ff, #1e90ff)",
        badgeBorder: "rgba(0,229,255,0.70)",
        badgeColor: "#fff",
        badgeShadow: "0 0 10px rgba(0,229,255,0.45)",
      };
    default:
      return {
        border: { light: "rgba(30,144,255,0.30)", dark: "rgba(30,144,255,0.22)" },
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.40) 0%, rgba(11,18,32,0.55) 100%)",
        shadow: { light: "0 2px 8px rgba(30,144,255,0.10)", dark: "0 4px 12px rgba(0,0,0,0.20)" },
        badgeBg: "rgba(30,144,255,0.10)",
        badgeBorder: { light: "rgba(30,144,255,0.50)", dark: "rgba(30,144,255,0.40)" },
        badgeColor: { light: "#0f5d99", dark: "#7dd3fc" },
        badgeShadow: "none",
      };
  }
}