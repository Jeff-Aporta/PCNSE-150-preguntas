/**
 * views/ResultsView.tsx — Pantalla de resultados: score + revisión detallada.
 */
import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  Divider,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import type { Question, QuizResult } from "../core/quiz.ts";
import { saveStats } from "../core/stats.ts";

type Props = {
  result: QuizResult;
  questions: Question[];
  onRetry: () => void;
  onHome: () => void;
};

const optionLetters: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

export function ResultsView({ result, questions, onRetry, onHome }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const scoreColor = scoreColorFor(result.scorePercent);
  const scoreLabel = scoreLabelFor(result.scorePercent);

  // Save stats once on mount (in case score improves)
  saveStats(result.scorePercent);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        p: { xs: 1.5, sm: 3 },
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 880, display: "flex", flexDirection: "column", gap: 2.5, py: 1 }}>
        {/* Score hero */}
        <Card
          sx={{
            background: "linear-gradient(135deg, rgba(30,144,255,0.18) 0%, rgba(99,102,241,0.10) 50%, rgba(168,85,247,0.08) 100%)",
            border: `1px solid ${scoreColor.border}`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px ${scoreColor.glow}`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={3}>
              <Box
                sx={{
                  width: { xs: 110, sm: 140 },
                  height: { xs: 110, sm: 140 },
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  background: scoreColor.bg,
                  border: `2px solid ${scoreColor.border}`,
                  boxShadow: `0 0 36px ${scoreColor.glow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
                  mx: { xs: "auto", sm: 0 },
                }}
              >
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "2rem", sm: "2.6rem" }, color: scoreColor.text, lineHeight: 1 }}>
                  {result.scorePercent}%
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "0.7rem", color: scoreColor.text, opacity: 0.85, letterSpacing: 0.5, textTransform: "uppercase", mt: 0.5 }}>
                  Score
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, textAlign: { xs: "center", sm: "left" } }}>
                  {scoreLabel}
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary", mb: 1.5, textAlign: { xs: "center", sm: "left" } }}>
                  {result.correctCount} de {result.totalQuestions} correctas · {formatDuration(result.durationUsedSec)} usado
                  {result.durationUsedSec >= result.session.durationSec ? " (tiempo agotado)" : ""}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={result.scorePercent}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(255,255,255,0.10)",
                    "& .MuiLinearProgress-bar": {
                      background: scoreColor.barBg,
                      boxShadow: `0 0 16px ${scoreColor.glow}`,
                    },
                  }}
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5, opacity: 0.4 }} />

            {/* Topic breakdown */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, mb: 1.2 }}>
                Desempeño por tema
              </Typography>
              <Stack spacing={1}>
                {Object.entries(result.topicBreakdown)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([topic, { correct, total }]) => {
                    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                    return (
                      <Box key={topic}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>{topic}</Typography>
                          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                            {correct}/{total} · {pct}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 5,
                            borderRadius: 2,
                            backgroundColor: "rgba(255,255,255,0.06)",
                            "& .MuiLinearProgress-bar": {
                              background:
                                pct >= 80
                                  ? "linear-gradient(90deg, #10b981, #34d399)"
                                  : pct >= 60
                                  ? "linear-gradient(90deg, #1e90ff, #00e5ff)"
                                  : pct >= 40
                                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                  : "linear-gradient(90deg, #ef4444, #f87171)",
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
              </Stack>
            </Box>

            <Divider sx={{ my: 2.5, opacity: 0.4 }} />

            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
              <Button
                variant="contained"
                onClick={onRetry}
                startIcon={<iconify-icon icon="mdi:restart" width="1.2em" height="1.2em" />}
                sx={{
                  background: "linear-gradient(135deg, #1e90ff 0%, #6366f1 100%)",
                  boxShadow: "0 0 20px rgba(30,144,255,0.40)",
                }}
              >
                Reintentar
              </Button>
              <Button
                variant="outlined"
                onClick={onHome}
                startIcon={<iconify-icon icon="mdi:home-outline" width="1.2em" height="1.2em" />}
              >
                Volver al inicio
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Detalle por pregunta */}
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              <iconify-icon icon="mdi:format-list-checkbox" width="1.2em" height="1.2em" style={{ verticalAlign: "middle", marginRight: 8 }} />
              Revisión detallada
            </Typography>
            <Stack spacing={1.2}>
              {result.session.questions.map((q, idx) => {
                const ans = result.answers.find((a) => a.questionId === q.id);
                const correct = ans?.correct || false;
                const isOpen = expanded === q.id;
                return (
                  <Box
                    key={q.id}
                    sx={{
                      border: "1px solid",
                      borderColor: correct ? "rgba(16,185,129,0.32)" : "rgba(239,68,68,0.32)",
                      borderRadius: 2,
                      background: correct
                        ? "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.02) 100%)"
                        : "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(185,28,28,0.02) 100%)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      onClick={() => setExpanded(isOpen ? null : q.id)}
                      sx={{
                        cursor: "pointer",
                        p: { xs: 1.5, sm: 2 },
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.03)" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          background: correct
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : "linear-gradient(135deg, #ef4444, #b91c1c)",
                          boxShadow: correct
                            ? "0 0 14px rgba(16,185,129,0.45)"
                            : "0 0 14px rgba(239,68,68,0.45)",
                        }}
                      >
                        <iconify-icon
                          icon={correct ? "mdi:check-bold" : "mdi:close-thick"}
                          width="1.1em"
                          height="1.1em"
                          style={{ color: "#fff" }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>
                          Pregunta {idx + 1} · {q.topic}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: "0.92rem", sm: "0.98rem" },
                            fontWeight: 500,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {q.question}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        {ans ? (
                          <Chip
                            size="small"
                            label={`Tu: ${ans.selected}`}
                            sx={{
                              fontWeight: 700,
                              border: `1px solid ${correct ? "rgba(16,185,129,0.40)" : "rgba(239,68,68,0.40)"}`,
                              backgroundColor: correct ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                            }}
                          />
                        ) : null}
                        <Chip
                          size="small"
                          label={`OK: ${q.correctAnswer}`}
                          sx={{
                            fontWeight: 700,
                            border: "1px solid rgba(16,185,129,0.40)",
                            backgroundColor: "rgba(16,185,129,0.10)",
                            color: "#6ee7b7",
                          }}
                        />
                        <iconify-icon
                          icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                          width="1.4em"
                          height="1.4em"
                          style={{ color: "rgba(255,255,255,0.45)" }}
                        />
                      </Stack>
                    </Box>
                    <Collapse in={isOpen}>
                      <Box sx={{ p: { xs: 1.5, sm: 2 }, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <Typography sx={{ mb: 1.5, lineHeight: 1.55, fontWeight: 500 }}>
                          {q.question}
                        </Typography>
                        <Box sx={{ mb: 1.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}
                          >
                            Tip del porqué
                          </Typography>
                          <Typography sx={{ lineHeight: 1.6 }}>{q.tip}</Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.6 }}
                          >
                            Explicación por opción
                          </Typography>
                          <Stack spacing={0.7}>
                            {optionLetters.map((L) => {
                              const isC = q.correctAnswer === L;
                              const isPicked = ans?.selected === L;
                              return (
                                <Box
                                  key={L}
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    p: 1,
                                    borderRadius: 1.2,
                                    background: isC
                                      ? "rgba(16,185,129,0.08)"
                                      : isPicked
                                      ? "rgba(239,68,68,0.08)"
                                      : "transparent",
                                    border: isC
                                      ? "1px solid rgba(16,185,129,0.28)"
                                      : isPicked
                                      ? "1px solid rgba(239,68,68,0.28)"
                                      : "1px solid transparent",
                                  }}
                                >
                                  <Typography sx={{ fontWeight: 800, minWidth: 22 }}>
                                    {L}
                                    {isC ? " ✓" : isPicked ? " ✗" : ""}
                                  </Typography>
                                  <Typography sx={{ flex: 1, fontSize: "0.92rem", lineHeight: 1.5 }}>
                                    {q.explanations[L]}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function scoreColorFor(p: number) {
  if (p >= 80) {
    return {
      bg: "linear-gradient(135deg, rgba(16,185,129,0.30) 0%, rgba(5,150,105,0.20) 100%)",
      border: "rgba(16,185,129,0.55)",
      glow: "rgba(16,185,129,0.30)",
      text: "#6ee7b7",
      barBg: "linear-gradient(90deg, #10b981, #34d399)",
    };
  }
  if (p >= 60) {
    return {
      bg: "linear-gradient(135deg, rgba(30,144,255,0.30) 0%, rgba(99,102,241,0.20) 100%)",
      border: "rgba(30,144,255,0.55)",
      glow: "rgba(30,144,255,0.30)",
      text: "#7dd3fc",
      barBg: "linear-gradient(90deg, #1e90ff, #00e5ff)",
    };
  }
  if (p >= 40) {
    return {
      bg: "linear-gradient(135deg, rgba(245,158,11,0.30) 0%, rgba(217,119,6,0.20) 100%)",
      border: "rgba(245,158,11,0.55)",
      glow: "rgba(245,158,11,0.30)",
      text: "#fcd34d",
      barBg: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    };
  }
  return {
    bg: "linear-gradient(135deg, rgba(239,68,68,0.30) 0%, rgba(185,28,28,0.20) 100%)",
    border: "rgba(239,68,68,0.55)",
    glow: "rgba(239,68,68,0.30)",
    text: "#fca5a5",
    barBg: "linear-gradient(90deg, #ef4444, #f87171)",
  };
}

function scoreLabelFor(p: number) {
  if (p >= 90) return "¡Excelente! Listo para el examen";
  if (p >= 80) return "Muy bien, casi listo";
  if (p >= 60) return "Vas bien, sigue practicando";
  if (p >= 40) return "Necesitas reforzar varios temas";
  return "A repasar con calma — tú puedes";
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}