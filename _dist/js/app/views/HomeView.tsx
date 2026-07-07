/**
 * views/HomeView.tsx — Pantalla de inicio.
 * Selector de modo (todas / por tema) y arranque del quiz.
 */
import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from "@mui/material";
import type { Question } from "../core/quiz.ts";

const NS = "WILLIAM";

type Props = {
  questions: Question[];
  stats: { lastScore?: number; totalAttempts: number };
  onStart: (session: { mode: "all" | "topic"; topic?: string; totalQuestions: number; questions: Question[]; startedAt: number; durationSec: number }) => void;
};

export function HomeView({ questions, stats, onStart }: Props) {
  const topics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => set.add(q.topic));
    return Array.from(set).sort();
  }, [questions]);

  const [mode, setMode] = useState<"all" | "topic">("all");
  const [topic, setTopic] = useState<string>("");

  const selectedTopic = topic || topics[0] || "";
  const visibleCount = mode === "all" ? questions.length : questions.filter((q) => q.topic === selectedTopic).length;

  const handleStart = () => {
    const filtered =
      mode === "all" ? questions.slice() : questions.filter((q) => q.topic === selectedTopic);
    filtered.sort((a, b) => a.id.localeCompare(b.id));
    onStart({
      mode,
      topic: mode === "topic" ? selectedTopic : undefined,
      totalQuestions: filtered.length,
      questions: filtered,
      startedAt: Date.now(),
      durationSec: Math.max(300, filtered.length * 90),
    });
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        p: { xs: 2, sm: 4 },
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 880, display: "flex", flexDirection: "column", gap: 3, py: 2 }}>
        {/* Hero */}
        <Card
          sx={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(30,144,255,0.18) 0%, rgba(99,102,241,0.10) 50%, rgba(0,229,255,0.08) 100%)",
            border: "1px solid rgba(30,144,255,0.30)",
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px rgba(30,144,255,0.10)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #1e90ff, #6366f1, #00e5ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 28px rgba(30,144,255,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                <iconify-icon icon="mdi:shield-lock-outline" width="2em" height="2em" style={{ color: "#fff" }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
                  Simulador PCNSE
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.4 }}>
                  Palo Alto Networks Certified Security Engineer · {questions.length} preguntas reales
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body1" sx={{ color: "text.primary", lineHeight: 1.65, mt: 2 }}>
              Practica con preguntas tipo examen sobre <strong>App-ID, User-ID, Content-ID, NAT, VPN, Panorama, HA, Decryption, WildFire</strong> y <strong>Troubleshooting</strong>.
              Cada pregunta tiene audio en español, tips del porqué la respuesta es correcta y explicación de las opciones incorrectas.
            </Typography>

            <Stack direction="row" spacing={1.2} sx={{ mt: 2.5, flexWrap: "wrap", gap: 1 }}>
              <Chip
                icon={<iconify-icon icon="mdi:headphones" width="1.1em" height="1.1em" />}
                label="Audio en español"
                size="small"
                sx={{
                  border: "1px solid rgba(0,229,255,0.45)",
                  backgroundColor: "rgba(0,229,255,0.10)",
                  color: "#7dd3fc",
                }}
              />
              <Chip
                icon={<iconify-icon icon="mdi:lightbulb-on-outline" width="1.1em" height="1.1em" />}
                label="Tips y explicaciones"
                size="small"
                sx={{
                  border: "1px solid rgba(245,158,11,0.45)",
                  backgroundColor: "rgba(245,158,11,0.10)",
                  color: "#fcd34d",
                }}
              />
              <Chip
                icon={<iconify-icon icon="mdi:school-outline" width="1.1em" height="1.1em" />}
                label="Lenguaje sencillo"
                size="small"
                sx={{
                  border: "1px solid rgba(16,185,129,0.45)",
                  backgroundColor: "rgba(16,185,129,0.10)",
                  color: "#6ee7b7",
                }}
              />
              <Chip
                icon={<iconify-icon icon="mdi:chart-line" width="1.1em" height="1.1em" />}
                label="Score final"
                size="small"
                sx={{
                  border: "1px solid rgba(168,85,247,0.45)",
                  backgroundColor: "rgba(168,85,247,0.10)",
                  color: "#d8b4fe",
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Selector */}
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              <iconify-icon icon="mdi:cog-outline" width="1.2em" height="1.2em" style={{ verticalAlign: "middle", marginRight: 8 }} />
              Configura tu simulacro
            </Typography>

            <RadioGroup
              value={mode}
              onChange={(e) => setMode(e.target.value as "all" | "topic")}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="all"
                control={<Radio sx={{ color: "primary.main" }} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Todas las preguntas ({questions.length})</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Simulacro completo tipo PCNSE
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="topic"
                control={<Radio sx={{ color: "primary.main" }} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Por tema</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Practica un tema específico
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            {mode === "topic" && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}>
                  Tema:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {topics.map((t) => {
                    const count = questions.filter((q) => q.topic === t).length;
                    const selected = t === selectedTopic;
                    return (
                      <Chip
                        key={t}
                        label={`${t} · ${count}`}
                        onClick={() => setTopic(t)}
                        variant={selected ? "filled" : "outlined"}
                        sx={{
                          cursor: "pointer",
                          fontWeight: selected ? 700 : 500,
                          ...(selected
                            ? {
                                background:
                                  "linear-gradient(135deg, rgba(30,144,255,0.30) 0%, rgba(99,102,241,0.22) 100%)",
                                border: "1px solid rgba(30,144,255,0.55)",
                                color: "#fff",
                                boxShadow: "0 0 14px rgba(30,144,255,0.30)",
                              }
                            : {
                                border: "1px solid rgba(30,144,255,0.30)",
                                backgroundColor: "rgba(30,144,255,0.06)",
                              }),
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2, opacity: 0.5 }} />

            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {visibleCount} pregunta{visibleCount !== 1 ? "s" : ""} · tiempo sugerido {Math.round(Math.max(300, visibleCount * 90) / 60)} min
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.7 }}>
                  {stats.totalAttempts > 0 ? (
                    <>
                      Último score: <strong>{stats.lastScore}%</strong> · {stats.totalAttempts} intento
                      {stats.totalAttempts !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <>Sin intentos aún</>
                  )}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleStart}
                disabled={visibleCount === 0}
                startIcon={<iconify-icon icon="mdi:play-circle-outline" width="1.2em" height="1.2em" />}
                sx={{
                  px: 4,
                  py: 1.4,
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #1e90ff 0%, #6366f1 60%, #00e5ff 100%)",
                  boxShadow: "0 0 32px rgba(30,144,255,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
                  "&:hover": {
                    boxShadow: "0 0 40px rgba(30,144,255,0.65), inset 0 1px 0 rgba(255,255,255,0.22)",
                  },
                }}
              >
                Empezar simulacro
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Cómo se evalúa */}
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
              <iconify-icon icon="mdi:information-outline" width="1.2em" height="1.2em" style={{ verticalAlign: "middle", marginRight: 8 }} />
              Cómo se evalúa
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, color: "text.secondary", lineHeight: 1.85 }}>
              <li>Lee la pregunta o pulsa el botón de audio para escucharla.</li>
              <li>Selecciona la opción que creas correcta (A, B, C o D).</li>
              <li>Tras seleccionar, verás si acertaste y por qué.</li>
              <li>Al finalizar verás tu score, qué temas reforzar y la explicación completa.</li>
              <li>Tip: el examen PCNSE real es exigente; aquí practicamos como tal, con lenguaje claro.</li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}