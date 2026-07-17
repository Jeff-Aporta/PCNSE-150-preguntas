/**
 * views/HomeView.tsx — Pantalla de inicio.
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
import { useTheme } from "@mui/material/styles";
import type { Question, QuizSession } from "../core/quiz.ts";
import { buildSession } from "../core/quiz.ts";
import { useAppLocale } from "../components/LocaleToolbar.tsx";
import { t, tf } from "../core/ui-i18n.ts";
import { CARD_SHELL, CARD_SCROLL_BODY, CHIP_PAD } from "../core/card-scroll.ts";

type Props = {
  questions: Question[];
  stats: { lastScore?: number; totalAttempts: number };
  onStart: (session: QuizSession) => void;
};

const HERO_CARD_SX = {
  ...CARD_SHELL,
  background:
    "linear-gradient(135deg, rgba(30,144,255,0.18) 0%, rgba(99,102,241,0.10) 50%, rgba(0,229,255,0.08) 100%)",
  border: "1px solid rgba(30,144,255,0.30)",
  backdropFilter: "blur(16px) saturate(160%)",
  WebkitBackdropFilter: "blur(16px) saturate(160%)",
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px rgba(30,144,255,0.10)",
} as const;

export function HomeView({ questions, stats, onStart }: Props) {
  const { locale } = useAppLocale();
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
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
    onStart(buildSession(mode, mode === "topic" ? selectedTopic : undefined, questions));
  };

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
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Card sx={HERO_CARD_SX}>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 }, ...CARD_SCROLL_BODY }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  width: { xs: 44, sm: 56 },
                  height: { xs: 44, sm: 56 },
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #1e90ff, #6366f1, #00e5ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isLight
                    ? "0 6px 18px rgba(30,144,255,0.30), inset 0 1px 0 rgba(255,255,255,0.35)"
                    : "0 0 28px rgba(30,144,255,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
                  flexShrink: 0,
                }}
              >
                <iconify-icon
                  icon="mdi:shield-lock-outline"
                  width="2em"
                  height="2em"
                  style={{ color: "#fff" }}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, fontSize: { xs: "1.55rem", sm: "2.125rem" } }}>
                  {t("heroTitle", locale)}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.4 }}>
                  {tf("heroSubtitle", locale, { count: questions.length })}
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body1" sx={{ color: "text.primary", lineHeight: 1.65, mt: 2 }}>
              {t("heroBody", locale)}
            </Typography>

            <Stack direction="row" spacing={1.2} sx={{ mt: 2.5, flexWrap: "wrap", gap: 1.2 }}>
              <Chip
                component="a"
                href="https://youtu.be/GveWyFrTQNg"
                target="_blank"
                rel="noopener noreferrer"
                clickable
                icon={<iconify-icon icon="mdi:youtube" width="1.1em" height="1.1em" />}
                label={t("chipVideo", locale)}
                size="small"
                sx={{
                  ...CHIP_PAD,
                  border: `1px solid rgba(239,68,68,0.45)`,
                  backgroundColor: "rgba(239,68,68,0.10)",
                  color: isLight ? "#b91c1c" : "#fca5a5",
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { backgroundColor: "rgba(239,68,68,0.18)" },
                }}
              />
              <Chip
                icon={<iconify-icon icon="mdi:headphones" width="1.1em" height="1.1em" />}
                label={t("chipAudio", locale)}
                size="small"
                sx={{
                  ...CHIP_PAD,
                  border: `1px solid ${isLight ? "rgba(8,145,178,0.40)" : "rgba(0,229,255,0.45)"}`,
                  backgroundColor: isLight ? "rgba(8,145,178,0.10)" : "rgba(0,229,255,0.10)",
                  color: isLight ? "#0e7490" : "#7dd3fc",
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={<iconify-icon icon="mdi:lightbulb-on-outline" width="1.1em" height="1.1em" />}
                label={t("chipTips", locale)}
                size="small"
                sx={{
                  ...CHIP_PAD,
                  border: `1px solid ${isLight ? "rgba(180,83,9,0.40)" : "rgba(245,158,11,0.45)"}`,
                  backgroundColor: isLight ? "rgba(180,83,9,0.10)" : "rgba(245,158,11,0.10)",
                  color: isLight ? "#92400e" : "#fcd34d",
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={<iconify-icon icon="mdi:school-outline" width="1.1em" height="1.1em" />}
                label={t("chipSimple", locale)}
                size="small"
                sx={{
                  ...CHIP_PAD,
                  border: `1px solid ${isLight ? "rgba(5,150,105,0.40)" : "rgba(16,185,129,0.45)"}`,
                  backgroundColor: isLight ? "rgba(5,150,105,0.10)" : "rgba(16,185,129,0.10)",
                  color: isLight ? "#047857" : "#6ee7b7",
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={<iconify-icon icon="mdi:chart-line" width="1.1em" height="1.1em" />}
                label={t("chipScore", locale)}
                size="small"
                sx={{
                  ...CHIP_PAD,
                  border: `1px solid ${isLight ? "rgba(124,58,237,0.40)" : "rgba(168,85,247,0.45)"}`,
                  backgroundColor: isLight ? "rgba(124,58,237,0.10)" : "rgba(168,85,247,0.10)",
                  color: isLight ? "#6d28d9" : "#d8b4fe",
                  fontWeight: 600,
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={CARD_SHELL}>
          <CardContent sx={{ p: { xs: 2, sm: 3 }, ...CARD_SCROLL_BODY }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              <iconify-icon icon="mdi:cog-outline" width="1.2em" height="1.2em" style={{ verticalAlign: "middle", marginRight: 8 }} />
              {t("configTitle", locale)}
            </Typography>

            <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as "all" | "topic")} sx={{ mb: 2 }}>
              <FormControlLabel value="all" control={<Radio sx={{ color: "primary.main" }} />} label={<Box><Typography sx={{ fontWeight: 600 }}>{tf("modeAll", locale, { count: questions.length })}</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>{t("modeAllHint", locale)}</Typography></Box>} />
              <FormControlLabel value="topic" control={<Radio sx={{ color: "primary.main" }} />} label={<Box><Typography sx={{ fontWeight: 600 }}>{t("modeTopic", locale)}</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>{t("modeTopicHint", locale)}</Typography></Box>} />
            </RadioGroup>

            {mode === "topic" && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}>
                  {t("topicLabel", locale)}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {topics.map((tp) => {
                    const count = questions.filter((q) => q.topic === tp).length;
                    const selected = tp === selectedTopic;
                    return (
                      <Chip
                        key={tp}
                        label={`${tp} · ${count}`}
                        onClick={() => setTopic(tp)}
                        variant={selected ? "filled" : "outlined"}
                        sx={{
                          ...CHIP_PAD,
                          cursor: "pointer",
                          fontWeight: selected ? 700 : 500,
                          ...(selected
                            ? {
                                background: isLight
                                  ? "linear-gradient(135deg, rgba(30,144,255,0.20) 0%, rgba(99,102,241,0.15) 100%)"
                                  : "linear-gradient(135deg, rgba(30,144,255,0.30) 0%, rgba(99,102,241,0.22) 100%)",
                                border: `1px solid ${isLight ? "rgba(30,144,255,0.55)" : "rgba(30,144,255,0.55)"}`,
                                color: isLight ? "#0c4a82" : "#fff",
                                fontWeight: 700,
                                boxShadow: isLight
                                  ? "0 1px 0 rgba(255,255,255,0.7) inset"
                                  : "0 0 14px rgba(30,144,255,0.30)",
                              }
                            : {
                                border: `1px solid ${isLight ? "rgba(30,144,255,0.40)" : "rgba(30,144,255,0.30)"}`,
                                backgroundColor: isLight ? "rgba(30,144,255,0.06)" : "rgba(30,144,255,0.06)",
                                color: "text.primary",
                              }),
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2, opacity: 0.5 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ width: "100%", gap: { xs: 1.5, sm: 2 } }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {tf("questionsCount", locale, { count: visibleCount, min: Math.round(Math.max(300, visibleCount * 90) / 60) })}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.7 }}>
                  {stats.totalAttempts > 0 ? tf("lastScore", locale, { score: stats.lastScore ?? 0, attempts: stats.totalAttempts }) : t("noAttempts", locale)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleStart}
                disabled={visibleCount === 0}
                startIcon={<iconify-icon icon="mdi:play-circle-outline" width="1.2em" height="1.2em" />}
                sx={{
                  flexShrink: 0,
                  ml: { xs: 0, sm: "auto" },
                  px: { xs: 2.5, sm: 4 },
                  py: 1.4,
                  fontSize: { xs: "0.98rem", sm: "1.02rem" },
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #1e90ff 0%, #6366f1 60%, #00e5ff 100%)",
                  boxShadow: isLight
                    ? "0 6px 18px rgba(30,144,255,0.30), inset 0 1px 0 rgba(255,255,255,0.35)"
                    : "0 0 32px rgba(30,144,255,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
                  "&:hover": {
                    boxShadow: isLight
                      ? "0 10px 26px rgba(30,144,255,0.40), inset 0 1px 0 rgba(255,255,255,0.45)"
                      : "0 0 40px rgba(30,144,255,0.65), inset 0 1px 0 rgba(255,255,255,0.22)",
                  },
                }}
              >
                {t("startQuiz", locale)}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={CARD_SHELL}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 }, ...CARD_SCROLL_BODY }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
              <iconify-icon icon="mdi:information-outline" width="1.2em" height="1.2em" style={{ verticalAlign: "middle", marginRight: 8 }} />
              {t("howTitle", locale)}
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, color: "text.secondary", lineHeight: 1.85 }}>
              <li>{t("how1", locale)}</li>
              <li>{t("how2", locale)}</li>
              <li>{t("how3", locale)}</li>
              <li>{t("how4", locale)}</li>
              <li>{t("how5", locale)}</li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
