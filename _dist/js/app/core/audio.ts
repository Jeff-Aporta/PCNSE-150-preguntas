/**
 * core/audio.ts — Reproductor TTS: MP3 estático o fallback MiniMax vía /api/tts (dev).
 */
import type { Question } from "./quiz.ts";
import type { AppLocale } from "./locale.ts";
import { getAppLocale } from "./locale.ts";
import { localizeQuestion, questionAudioPath, questionTipAudioPath } from "./question-i18n.ts";
import { buildTtsPrompt, buildTipTtsPrompt, fetchTtsAudioBlob, resolveAssetUrl } from "./tts.ts";

export type AudioTrack = "question" | "tip";

type PlaybackCb = (playing: boolean, track: AudioTrack | null) => void;
type ProgressCb = (currentTime: number, duration: number, track: AudioTrack | null) => void;

let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
let currentTrack: AudioTrack | null = null;
let legacyPlaybackListener: PlaybackCb | null = null;
let legacyProgressListener: ProgressCb | null = null;
const playbackSubs = new Set<PlaybackCb>();
const progressSubs = new Set<ProgressCb>();

export function setPlaybackListener(fn: PlaybackCb | null) {
  legacyPlaybackListener = fn;
}

export function setProgressListener(fn: ProgressCb | null) {
  legacyProgressListener = fn;
}

export function subscribePlayback(fn: PlaybackCb): () => void {
  playbackSubs.add(fn);
  return () => playbackSubs.delete(fn);
}

export function subscribeProgress(fn: ProgressCb): () => void {
  progressSubs.add(fn);
  return () => progressSubs.delete(fn);
}

function emitPlayback(playing: boolean, track: AudioTrack | null) {
  legacyPlaybackListener?.(playing, track);
  playbackSubs.forEach((fn) => fn(playing, track));
}

function emitProgress(currentTime: number, duration: number, track: AudioTrack | null) {
  legacyProgressListener?.(currentTime, duration, track);
  progressSubs.forEach((fn) => fn(currentTime, duration, track));
}

function syncPlayback(audio: HTMLAudioElement | null) {
  if (!audio) {
    emitPlayback(false, null);
    return;
  }
  emitPlayback(!audio.paused && !audio.ended, currentTrack);
}

function syncProgress(audio: HTMLAudioElement | null) {
  if (!audio) {
    emitProgress(0, 0, null);
    return;
  }
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  emitProgress(audio.currentTime, duration, currentTrack);
}

function bindPlaybackEvents(audio: HTMLAudioElement) {
  const sync = () => syncPlayback(audio);
  const progress = () => syncProgress(audio);
  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  audio.addEventListener("ended", () => {
    sync();
    progress();
  });
  audio.addEventListener("timeupdate", progress);
  audio.addEventListener("loadedmetadata", progress);
  audio.addEventListener("durationchange", progress);
}

export { resolveAssetUrl, buildTtsPrompt, buildTipTtsPrompt, questionAudioPath };

export function playAudio(url: string): HTMLAudioElement {
  stopAudio();
  const audio = new Audio(resolveAssetUrl(url));
  audio.preload = "auto";
  currentAudio = audio;
  currentTrack = null;
  audio.play().catch((err) => {
    console.warn("[audio] play() failed:", err);
  });
  return audio;
}

const LEGACY_AUDIO = (id: string) => `audio/${id}.mp3`;

function audioCandidates(q: Question, loc: AppLocale): string[] {
  const primary = questionAudioPath(q.id, loc);
  if (loc === "en") return [primary];
  return [primary, LEGACY_AUDIO(q.id)];
}

/** Comprueba existencia sin HEAD (Live Server a veces no lo soporta en MP3). */
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
    syncPlayback(audio);
    syncProgress(audio);
    return audio;
  }

  console.info(`[audio] MP3 no encontrado (${track}), generando TTS MiniMax:`, q.id, loc);
  const blob = await fetchTtsAudioBlob(buildPrompt(q, loc), loc);
  const blobUrl = URL.createObjectURL(blob);
  currentBlobUrl = blobUrl;
  const audio = new Audio(blobUrl);
  bindPlaybackEvents(audio);
  currentAudio = audio;
  currentTrack = track;
  await audio.play();
  syncPlayback(audio);
  syncProgress(audio);
  return audio;
}

/** Reproduce narración (pregunta + opciones) en el idioma activo. */
export async function playQuestionAudio(q: Question, locale?: AppLocale): Promise<HTMLAudioElement> {
  const loc = locale ?? getAppLocale();
  return playFromStaticOrTts("question", audioCandidates(q, loc), q, loc, buildTtsPrompt);
}

/** Reproduce justificación (tip + explicaciones) en el idioma activo. */
export async function playTipAudio(q: Question, locale?: AppLocale): Promise<HTMLAudioElement> {
  const loc = locale ?? getAppLocale();
  return playFromStaticOrTts("tip", [questionTipAudioPath(q.id, loc)], q, loc, buildTipTtsPrompt);
}

export function seekAudio(timeSec: number) {
  if (!currentAudio) return;
  const max = Number.isFinite(currentAudio.duration) ? currentAudio.duration : timeSec;
  try {
    currentAudio.currentTime = Math.max(0, Math.min(timeSec, max));
  } catch {}
  syncProgress(currentAudio);
}

export function pauseAudio() {
  if (currentAudio && !currentAudio.paused) {
    try {
      currentAudio.pause();
    } catch {}
  }
}

export function resumeAudio(): Promise<void> {
  if (!currentAudio) return Promise.resolve();
  return currentAudio.play().then(() => undefined);
}

export function isAudioPlaying(track?: AudioTrack): boolean {
  if (!currentAudio || currentAudio.paused || currentAudio.ended) return false;
  return track ? currentTrack === track : true;
}

export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio;
}

export function getCurrentTrack(): AudioTrack | null {
  return currentTrack;
}

export function stopAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  currentTrack = null;
  syncPlayback(null);
  syncProgress(null);
}
