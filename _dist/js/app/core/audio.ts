/**
 * core/audio.ts — Reproductor TTS: MP3 estático o fallback MiniMax vía /api/tts (dev).
 */
import type { Question } from "./quiz.ts";
import type { AppLocale } from "./locale.ts";
import { getAppLocale } from "./locale.ts";
import { localizeQuestion, questionAudioPath } from "./question-i18n.ts";
import { buildTtsPrompt, fetchTtsAudioBlob, resolveAssetUrl } from "./tts.ts";

let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
let onPlaybackChange: ((playing: boolean) => void) | null = null;

export function setPlaybackListener(fn: ((playing: boolean) => void) | null) {
  onPlaybackChange = fn;
}

function syncPlayback(audio: HTMLAudioElement | null) {
  onPlaybackChange?.(!!audio && !audio.paused && !audio.ended);
}

function bindPlaybackEvents(audio: HTMLAudioElement) {
  const sync = () => syncPlayback(audio);
  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  audio.addEventListener("ended", sync);
}

export { resolveAssetUrl, buildTtsPrompt, questionAudioPath };

export function playAudio(url: string): HTMLAudioElement {
  stopAudio();
  const audio = new Audio(resolveAssetUrl(url));
  audio.preload = "auto";
  currentAudio = audio;
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

/** Reproduce narración (pregunta + opciones) en el idioma activo. */
export async function playQuestionAudio(q: Question, locale?: AppLocale): Promise<HTMLAudioElement> {
  stopAudio();
  const loc = locale ?? getAppLocale();

  for (const path of audioCandidates(q, loc)) {
    const staticUrl = resolveAssetUrl(path);
    if (!(await assetExists(staticUrl))) continue;
    const audio = new Audio(staticUrl);
    audio.preload = "auto";
    bindPlaybackEvents(audio);
    currentAudio = audio;
    await audio.play();
    syncPlayback(audio);
    return audio;
  }

  console.info("[audio] MP3 no encontrado, generando TTS MiniMax:", q.id, loc);
  const blob = await fetchTtsAudioBlob(buildTtsPrompt(q, loc), loc);
  const blobUrl = URL.createObjectURL(blob);
  currentBlobUrl = blobUrl;
  const audio = new Audio(blobUrl);
  bindPlaybackEvents(audio);
  currentAudio = audio;
  await audio.play();
  syncPlayback(audio);
  return audio;
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

export function isAudioPlaying(): boolean {
  return !!currentAudio && !currentAudio.paused && !currentAudio.ended;
}

export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio;
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
  syncPlayback(null);
}
