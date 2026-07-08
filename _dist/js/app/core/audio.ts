/**
 * core/audio.ts — Modo monolítico (fallback).
 *
 * Si los clips fragmentados + manifest no existen, reproducimos el MP3
 * monolítico (qNNN.mp3 / qNNN-tip.mp3) tal como antes. Cuando el manifest
 * está disponible, `core/audio-playlist.ts` toma el control.
 */
import type { Question } from "./quiz.ts";
import type { AppLocale } from "./locale.ts";
import { getAppLocale } from "./locale.ts";
import { questionAudioPath, questionTipAudioPath } from "./question-i18n.ts";
import { buildTtsPrompt, buildTipTtsPrompt, resolveAssetUrl, fetchTtsAudioBlob } from "./tts.ts";
import {
  playQuestionClips, playTipClips, pauseClips, resumeClips, isClipsPlaying,
  seekClips, stopClips, getCurrentAudio as getCurrentClipsAudio, getCurrentTrack as getCurrentClipsTrack,
  subscribePlayback as playlistSubscribePlayback,
  subscribeProgress as playlistSubscribeProgress,
  emitPlaybackExternal, emitProgressExternal,
} from "./audio-playlist.ts";

export type AudioTrack = "question" | "tip";

let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
let currentTrack: AudioTrack | null = null;

function emitPlayback(playing: boolean, track: AudioTrack | null) {
  emitPlaybackExternal(playing, track);
}
function emitProgress(cur: number, dur: number, track: AudioTrack | null) {
  emitProgressExternal(cur, dur, track);
}

// Re-exponer suscripciones del playlist (la UI no debe notar el cambio).
export const subscribePlayback = playlistSubscribePlayback;
export const subscribeProgress = playlistSubscribeProgress;

const LEGACY_AUDIO = (id: string) => `audio/${id}.mp3`;

function audioCandidates(q: Question, loc: AppLocale): string[] {
  const primary = questionAudioPath(q.id, loc);
  if (loc === "en") return [primary];
  return [primary, LEGACY_AUDIO(q.id)];
}

async function assetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-511" }, cache: "no-store" });
    if (!res.ok && res.status !== 206) return false;
    const ct = res.headers.get("content-type") || "";
    return ct.includes("audio") || ct.includes("octet-stream") || ct === "";
  } catch {
    return false;
  }
}

function bindPlaybackEvents(audio: HTMLAudioElement) {
  const sync = () => emitPlayback(!audio.paused && !audio.ended, currentTrack);
  const progress = () => {
    const d = Number.isFinite(audio.duration) ? audio.duration : 0;
    emitProgress(audio.currentTime, d, currentTrack);
  };
  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  audio.addEventListener("ended", () => { sync(); progress(); });
  audio.addEventListener("timeupdate", progress);
  audio.addEventListener("loadedmetadata", progress);
  audio.addEventListener("durationchange", progress);
}

async function playFromStaticOrTts(
  track: AudioTrack,
  paths: string[],
  q: Question,
  loc: AppLocale,
  buildPrompt: (q: Question, locale: AppLocale) => string
): Promise<HTMLAudioElement> {
  stopAudio();
  for (const path of paths) {
    const staticUrl = resolveAssetUrl(path);
    if (!(await assetExists(staticUrl))) continue;
    const audio = new Audio(staticUrl);
    audio.preload = "auto";
    bindPlaybackEvents(audio);
    currentAudio = audio;
    currentTrack = track;
    await audio.play();
    emitPlayback(!audio.paused && !audio.ended, currentTrack);
    emitProgress(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0, currentTrack);
    return audio;
  }
  const blob = await fetchTtsAudioBlob(buildPrompt(q, loc), loc);
  const blobUrl = URL.createObjectURL(blob);
  currentBlobUrl = blobUrl;
  const audio = new Audio(blobUrl);
  bindPlaybackEvents(audio);
  currentAudio = audio;
  currentTrack = track;
  await audio.play();
  emitPlayback(!audio.paused && !audio.ended, currentTrack);
  emitProgress(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0, currentTrack);
  return audio;
}

export async function playQuestionAudio(q: Question, locale?: AppLocale): Promise<HTMLAudioElement | null> {
  const loc = locale ?? getAppLocale();
  // 1) Intentar playlist virtual.
  stopAudio();
  if (await playQuestionClips(q, loc)) return getCurrentClipsAudio();
  // 2) Fallback monolítico.
  return playFromStaticOrTts("question", audioCandidates(q, loc), q, loc, buildTtsPrompt);
}

export async function playTipAudio(
  q: Question,
  isCorrect: boolean = false,
  locale?: AppLocale
): Promise<HTMLAudioElement | null> {
  const loc = locale ?? getAppLocale();
  stopAudio();
  if (await playTipClips(q, isCorrect, loc)) return getCurrentClipsAudio();
  return playFromStaticOrTts("tip", [questionTipAudioPath(q.id, loc)], q, loc, buildTipTtsPrompt);
}

export function seekAudio(timeSec: number) {
  // Si el playlist está activo, traduce el time virtual a un seek por clip.
  if (getCurrentClipsTrack() !== null) {
    seekClips(timeSec);
    return;
  }
  if (!currentAudio) return;
  const max = Number.isFinite(currentAudio.duration) ? currentAudio.duration : timeSec;
  try { currentAudio.currentTime = Math.max(0, Math.min(timeSec, max)); } catch {}
  const d = Number.isFinite(currentAudio.duration) ? currentAudio.duration : 0;
  emitProgress(currentAudio.currentTime, d, currentTrack);
}

export function pauseAudio() {
  if (getCurrentClipsTrack() !== null) { pauseClips(); return; }
  if (currentAudio && !currentAudio.paused) {
    try { currentAudio.pause(); } catch {}
  }
}

export function resumeAudio(): Promise<void> {
  if (getCurrentClipsTrack() !== null) return resumeClips();
  if (!currentAudio) return Promise.resolve();
  return currentAudio.play().then(() => undefined);
}

export function isAudioPlaying(track?: AudioTrack): boolean {
  if (getCurrentClipsTrack() !== null) return isClipsPlaying() && (track ? getCurrentClipsTrack() === track : true);
  if (!currentAudio || currentAudio.paused || currentAudio.ended) return false;
  return track ? currentTrack === track : true;
}

export function getCurrentAudio(): HTMLAudioElement | null {
  return getCurrentClipsAudio() || currentAudio;
}

export function getCurrentTrack(): AudioTrack | null {
  return getCurrentClipsTrack() || currentTrack;
}

export function stopAudio() {
  stopClips();
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
    currentAudio = null;
  }
  if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
  currentTrack = null;
  emitPlayback(false, null);
  emitProgress(0, 0, null);
}

export { resolveAssetUrl, buildTtsPrompt, buildTipTtsPrompt, questionAudioPath };
