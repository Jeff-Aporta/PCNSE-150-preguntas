/**
 * components/AudioPlayerBar.tsx — Reproductor con timeline, stop y play/pause.
 */
import { useState, useEffect, useCallback } from "react";
import { Stack, IconButton, Tooltip, Slider, Typography } from "@mui/material";
import type { Question } from "../core/quiz.ts";
import type { AudioTrack } from "../core/audio.ts";
import {
  playQuestionAudio,
  playTipAudio,
  stopAudio,
  pauseAudio,
  resumeAudio,
  seekAudio,
  getCurrentAudio,
  getCurrentTrack,
  isAudioPlaying,
  subscribePlayback,
  subscribeProgress,
} from "../core/audio.ts";
import { useAppLocale } from "./LocaleToolbar.tsx";
import { t } from "../core/ui-i18n.ts";

type Props = {
  track: AudioTrack;
  question: Question | null;
  idleTooltipKey: "listenQuestion" | "listenTip";
  playAriaKey: "playAudioAria" | "playTipAria";
  isCorrect?: boolean; // solo para track="tip": decide correct.mp3 vs wrong.mp3
};

function formatAudioTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AudioPlayerBar({ track, question, idleTooltipKey, playAriaKey, isCorrect = false }: Props) {
  const { locale } = useAppLocale();
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribePlayback((isPlaying, active) => {
      if (active !== track) {
        setPlaying(false);
        if (active) {
          setCurrent(0);
          setDuration(0);
        }
        return;
      }
      setPlaying(isPlaying);
    });
  }, [track]);

  useEffect(() => {
    return subscribeProgress((cur, dur, active) => {
      if (active !== track) return;
      setCurrent(cur);
      setDuration(dur);
    });
  }, [track]);

  useEffect(() => {
    setError(null);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    if (getCurrentTrack() === track) stopAudio();
  }, [question?.id, locale, track]);

  const handleStop = useCallback(() => {
    if (getCurrentTrack() === track) stopAudio();
  }, [track]);

  const handleSeek = useCallback(
    (_: Event, value: number | number[]) => {
      if (getCurrentTrack() !== track) return;
      const next = Array.isArray(value) ? value[0] : value;
      seekAudio(next);
      setCurrent(next);
    },
    [track]
  );

  const handleToggle = useCallback(async () => {
    if (!question || loading) return;
    if (isAudioPlaying(track)) {
      pauseAudio();
      return;
    }
    const audio = getCurrentAudio();
    if (getCurrentTrack() === track && audio && audio.paused && audio.currentTime > 0 && !audio.ended) {
      try {
        await resumeAudio();
      } catch (err) {
        console.error("[WilliamQuest] audio resume:", err);
      }
      return;
    }
    if (getCurrentTrack() !== track) stopAudio();
    setError(null);
    setLoading(true);
    try {
      if (track === "question") await playQuestionAudio(question, locale);
      else await playTipAudio(question, isCorrect, locale);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error("[WilliamQuest] audio:", err);
    } finally {
      setLoading(false);
    }
  }, [question, loading, locale, track]);

  const showTimeline = duration > 0 || current > 0;
  const showStop = current > 0 && getCurrentTrack() === track;
  const circleBtn = {
    width: 40,
    height: 40,
    minWidth: 40,
    padding: 0,
    borderRadius: "50%",
    aspectRatio: "1 / 1",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  } as const;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
      spacing={0.75}
      sx={{
        minWidth: 0,
        width: showTimeline ? { xs: "100%", sm: 340 } : "auto",
        maxWidth: { xs: "100%", sm: 340 },
        flex: showTimeline ? { xs: "1 1 100%", sm: "0 1 auto" } : "0 0 auto",
        alignSelf: "flex-start",
      }}
    >
      {showTimeline && (
        <>
          <Typography
            variant="caption"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary", flexShrink: 0, minWidth: 32 }}
          >
            {formatAudioTime(current)}
          </Typography>
          <Slider
            size="small"
            value={current}
            min={0}
            max={duration > 0 ? duration : Math.max(current, 1)}
            step={0.1}
            onChange={handleSeek}
            disabled={loading || duration <= 0 || getCurrentTrack() !== track}
            aria-label={t("seekAudioAria", locale)}
            sx={{
              flex: 1,
              minWidth: 72,
              color: "#00e5ff",
              "& .MuiSlider-thumb": { width: 12, height: 12 },
              "& .MuiSlider-rail": { opacity: 0.28 },
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary", flexShrink: 0, minWidth: 32 }}
          >
            {formatAudioTime(duration)}
          </Typography>
          {showStop && (
            <Tooltip title={t("stopAudioAria", locale)}>
              <IconButton
                size="small"
                onClick={handleStop}
                disabled={loading}
                aria-label={t("stopAudioAria", locale)}
                sx={{
                  ...circleBtn,
                  border: "1px solid rgba(239,68,68,0.45)",
                  backgroundColor: "rgba(239,68,68,0.10)",
                  "&:hover": { backgroundColor: "rgba(239,68,68,0.18)" },
                }}
              >
                <iconify-icon icon="mdi:stop" width="1.15em" height="1.15em" style={{ display: "block" }} />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
      <Tooltip
        title={error || (loading ? t("generatingAudio", locale) : playing ? t("pauseAudioAria", locale) : t(idleTooltipKey, locale))}
      >
        <span style={{ display: "inline-flex", flexShrink: 0 }}>
          <IconButton
            onClick={handleToggle}
            disabled={loading || !question}
            sx={{
              ...circleBtn,
              background: playing
                ? "linear-gradient(135deg, rgba(0,229,255,0.32), rgba(30,144,255,0.32))"
                : "linear-gradient(135deg, rgba(0,229,255,0.18), rgba(30,144,255,0.18))",
              border: `1px solid ${playing ? "rgba(0,229,255,0.70)" : "rgba(0,229,255,0.40)"}`,
              opacity: loading ? 0.6 : 1,
              boxShadow: playing ? "0 0 22px rgba(0,229,255,0.50)" : "none",
              animation: playing ? "wq-audio-pulse 1.4s ease-in-out infinite" : "none",
              "@keyframes wq-audio-pulse": {
                "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 18px rgba(0,229,255,0.40)" },
                "50%": { transform: "scale(1.06)", boxShadow: "0 0 28px rgba(0,229,255,0.65)" },
              },
              "&:hover": {
                boxShadow: "0 0 16px rgba(0,229,255,0.45)",
                background: "linear-gradient(135deg, rgba(0,229,255,0.28), rgba(30,144,255,0.28))",
              },
            }}
            aria-label={playing ? t("pauseAudioAria", locale) : t(playAriaKey, locale)}
          >
            <iconify-icon
              icon={loading ? "mdi:loading" : playing ? "mdi:pause" : "mdi:play"}
              width="1.35em"
              height="1.35em"
              style={{ display: "block" }}
            />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
