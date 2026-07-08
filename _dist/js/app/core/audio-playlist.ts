/**
 * core/audio-playlist.ts — Reproductor virtual de clips concatenados.
 *
 * Una "pregunta" se narra con 11 clips MP3 separados (stmt, A, B, C, D, ttip,
 * correct, wrong, EA, EB, EC, ED) en vez de un solo audio monolítico. Esto
 * permite que el shuffle de opciones (A–D rebarajadas por sesión) reproduzca
 * la opción que el usuario VE en cada slot, y que el slider del timeline
 * salte entre archivos con un currentTime virtual acumulado.
 *
 * Si el manifest JSON no existe (audios viejos), el runtime cae al modo
 * monolítico de `core/audio.ts` (graceful fallback — sin romper GH Pages).
 */
import type { AnswerId, Question } from "./quiz.ts";
import type { AppLocale } from "./locale.ts";
import { getAppLocale } from "./locale.ts";
import { localizeQuestion } from "./question-i18n.ts";
import { buildClipPrompts, buildTipClipPrompts } from "./tts.ts";
import { resolveAssetUrl, fetchTtsAudioBlob } from "./tts.ts";

export type AudioTrack = "question" | "tip";

export type ClipKey =
  | "stmt" | "A" | "B" | "C" | "D"
  | "ttip" | "correct" | "wrong"
  | "EA" | "EB" | "EC" | "ED";

export type ClipMeta = { key: ClipKey; file: string; durSec: number };
export type Manifest = { version: 1; totalDur: number; clips: ClipMeta[] };

type PlaybackCb = (playing: boolean, track: AudioTrack | null) => void;
type ProgressCb = (virtualTime: number, totalDur: number, track: AudioTrack | null) => void;

const playbackSubs = new Set<PlaybackCb>();
const progressSubs = new Set<ProgressCb>();

let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrls: string[] = [];
let currentTrack: AudioTrack | null = null;
let currentManifest: Manifest | null = null;
let currentClipIdx = 0;
let currentOffsets: number[] = [];

function emitPlayback(playing: boolean, track: AudioTrack | null) {
  playbackSubs.forEach((fn) => fn(playing, track));
}

function emitProgress(virtualTime: number, totalDur: number, track: AudioTrack | null) {
  progressSubs.forEach((fn) => fn(virtualTime, totalDur, track));
}

/** Emisión expuesta para que el modo monolítico (fallback) sincronice la UI. */
export function emitPlaybackExternal(playing: boolean, track: AudioTrack | null) {
  emitPlayback(playing, track);
}
export function emitProgressExternal(virtualTime: number, totalDur: number, track: AudioTrack | null) {
  emitProgress(virtualTime, totalDur, track);
}

export function subscribePlayback(fn: PlaybackCb): () => void {
  playbackSubs.add(fn);
  return () => playbackSubs.delete(fn);
}

export function subscribeProgress(fn: ProgressCb): () => void {
  progressSubs.add(fn);
  return () => progressSubs.delete(fn);
}

function revokeBlobs() {
  for (const u of currentBlobUrls) URL.revokeObjectURL(u);
  currentBlobUrls = [];
}

function manifestPath(qid: string, loc: AppLocale): string {
  return `audio/${loc}/${qid}.segments.json`;
}

async function fetchManifest(qid: string, loc: AppLocale): Promise<Manifest | null> {
  try {
    const res = await fetch(resolveAssetUrl(manifestPath(qid, loc)), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Manifest;
  } catch {
    return null;
  }
}

function computeOffsets(clips: ClipMeta[]): number[] {
  const offs: number[] = [];
  let acc = 0;
  for (const c of clips) { offs.push(acc); acc += c.durSec; }
  return offs;
}

function virtualTimeOf(idx: number, clipTime: number): number {
  return currentOffsets[idx] + Math.max(0, clipTime);
}

function findClipAtVirtual(v: number): number {
  if (!currentManifest) return 0;
  const clips = currentManifest.clips;
  for (let i = clips.length - 1; i >= 0; i--) {
    if (v >= currentOffsets[i]) return i;
  }
  return 0;
}

function bindAudioEvents(audio: HTMLAudioElement) {
  audio.addEventListener("play", () => emitPlayback(true, currentTrack));
  audio.addEventListener("pause", () => emitPlayback(false, currentTrack));
  audio.addEventListener("ended", onClipEnded);
  audio.addEventListener("timeupdate", onTimeUpdate);
  audio.addEventListener("loadedmetadata", onTimeUpdate);
  audio.addEventListener("error", onClipError);
}

function unbindAudioEvents(audio: HTMLAudioElement) {
  audio.removeEventListener("play", () => emitPlayback(true, currentTrack));
  audio.removeEventListener("pause", () => emitPlayback(false, currentTrack));
  audio.removeEventListener("ended", onClipEnded);
  audio.removeEventListener("timeupdate", onTimeUpdate);
  audio.removeEventListener("loadedmetadata", onTimeUpdate);
  audio.removeEventListener("error", onClipError);
}

function onTimeUpdate() {
  if (!currentAudio || !currentManifest) return;
  const t = currentAudio.currentTime;
  const vt = virtualTimeOf(currentClipIdx, t);
  emitProgress(vt, currentManifest.totalDur, currentTrack);
}

function onClipEnded() {
  if (!currentManifest) return;
  if (currentClipIdx < currentManifest.clips.length - 1) {
    void loadAndPlayClip(currentClipIdx + 1);
  } else {
    emitPlayback(false, currentTrack);
    emitProgress(currentManifest.totalDur, currentManifest.totalDur, currentTrack);
  }
}

function onClipError() {
  console.warn("[audio-playlist] clip error, stopping");
  emitPlayback(false, currentTrack);
}

async function loadAndPlayClip(idx: number) {
  if (!currentManifest) return;
  if (currentAudio) unbindAudioEvents(currentAudio);
  currentClipIdx = idx;
  const meta = currentManifest.clips[idx];
  const url = resolveAssetUrl(meta.file);
  const audio = new Audio(url);
  audio.preload = "auto";
  bindAudioEvents(audio);
  currentAudio = audio;
  try {
    await audio.play();
  } catch (err) {
    console.warn("[audio-playlist] play() failed:", err);
  }
  onTimeUpdate();
}

function buildQuestionOrder(q: Question, loc: AppLocale): ClipKey[] {
  const L = localizeQuestion(q, loc);
  // stmt + opciones en el ORDEN VISIBLE (post-shuffle) → cada slot
  // apunta a la letra canónica. Manifest guarda siempre A,B,C,D canónicos.
  const slotToCanonical = L.options.map((o) => o.id) as AnswerId[];
  return ["stmt", ...slotToCanonical];
}

function buildTipOrder(_q: Question, loc: AppLocale, isCorrect: boolean): ClipKey[] {
  // ttip + correct/wrong + EA..ED (en orden canónico; las explicaciones son
  // por letra, no por slot rebarajado).
  return [isCorrect ? "ttip" : "ttip", isCorrect ? "correct" : "wrong", "EA", "EB", "EC", "ED"];
}

export async function playQuestionClips(q: Question, locale?: AppLocale): Promise<boolean> {
  const loc = locale ?? getAppLocale();
  const manifest = await fetchManifest(q.id, loc);
  if (!manifest) return false;

  // Reordenar clips al orden visible de la sesión barajada.
  const order = buildQuestionOrder(q, loc);
  const byKey = new Map(manifest.clips.map((c) => [c.key, c]));
  const ordered: ClipMeta[] = order
    .map((k) => byKey.get(k))
    .filter((c): c is ClipMeta => !!c);
  if (ordered.length !== order.length) return false;

  const totalDur = ordered.reduce((s, c) => s + c.durSec, 0);
  currentManifest = { version: 1, totalDur, clips: ordered };
  currentOffsets = computeOffsets(ordered);
  currentTrack = "question";

  // Si todo el manifest está en MP3 estáticos, OK. Si algún clip falta,
  // fallback: regenera TTS al vuelo para los huecos.
  for (let i = 0; i < ordered.length; i++) {
    const c = ordered[i];
    const url = resolveAssetUrl(c.file);
    try {
      const head = await fetch(url, { method: "GET", headers: { Range: "bytes=0-511" }, cache: "no-store" });
      if (!head.ok && head.status !== 206) throw new Error("missing");
    } catch {
      const prompts = buildClipPrompts(q, loc);
      const prompt = prompts[c.key];
      if (!prompt) continue;
      const blob = await fetchTtsAudioBlob(prompt, loc);
      const blobUrl = URL.createObjectURL(blob);
      currentBlobUrls.push(blobUrl);
      // Sustituir el file por blob URL para este clip.
      ordered[i] = { ...c, file: blobUrl };
      currentManifest.clips[i] = ordered[i];
    }
  }

  await loadAndPlayClip(0);
  return true;
}

export async function playTipClips(q: Question, isCorrect: boolean, locale?: AppLocale): Promise<boolean> {
  const loc = locale ?? getAppLocale();
  const manifest = await fetchManifest(q.id, loc);
  if (!manifest) return false;

  const order = buildTipOrder(q, loc, isCorrect);
  const byKey = new Map(manifest.clips.map((c) => [c.key, c]));
  const ordered: ClipMeta[] = order
    .map((k) => byKey.get(k))
    .filter((c): c is ClipMeta => !!c);
  if (ordered.length !== order.length) return false;

  const totalDur = ordered.reduce((s, c) => s + c.durSec, 0);
  currentManifest = { version: 1, totalDur, clips: ordered };
  currentOffsets = computeOffsets(ordered);
  currentTrack = "tip";

  for (let i = 0; i < ordered.length; i++) {
    const c = ordered[i];
    const url = resolveAssetUrl(c.file);
    try {
      const head = await fetch(url, { method: "GET", headers: { Range: "bytes=0-511" }, cache: "no-store" });
      if (!head.ok && head.status !== 206) throw new Error("missing");
    } catch {
      const prompts = buildTipClipPrompts(q, loc, isCorrect);
      const prompt = prompts[c.key];
      if (!prompt) continue;
      const blob = await fetchTtsAudioBlob(prompt, loc);
      const blobUrl = URL.createObjectURL(blob);
      currentBlobUrls.push(blobUrl);
      ordered[i] = { ...c, file: blobUrl };
      currentManifest.clips[i] = ordered[i];
    }
  }

  await loadAndPlayClip(0);
  return true;
}

export function pauseClips() {
  if (currentAudio && !currentAudio.paused) {
    try { currentAudio.pause(); } catch {}
  }
}

export function resumeClips(): Promise<void> {
  if (!currentAudio) return Promise.resolve();
  return currentAudio.play().then(() => undefined);
}

export function isClipsPlaying(): boolean {
  return !!currentAudio && !currentAudio.paused && !currentAudio.ended;
}

export function seekClips(virtualSec: number) {
  if (!currentManifest || !currentAudio) return;
  const idx = findClipAtVirtual(virtualSec);
  const local = Math.max(0, virtualSec - currentOffsets[idx]);
  if (idx !== currentClipIdx) {
    void loadAndPlayClip(idx).then(() => {
      if (currentAudio) {
        try { currentAudio.currentTime = local; } catch {}
      }
    });
  } else {
    try { currentAudio.currentTime = local; } catch {}
    onTimeUpdate();
  }
}

export function stopClips() {
  if (currentAudio) {
    unbindAudioEvents(currentAudio);
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
    currentAudio = null;
  }
  revokeBlobs();
  currentManifest = null;
  currentOffsets = [];
  currentTrack = null;
  currentClipIdx = 0;
  emitPlayback(false, null);
  emitProgress(0, 0, null);
}

export function getCurrentTrack(): AudioTrack | null {
  return currentTrack;
}

export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio;
}
