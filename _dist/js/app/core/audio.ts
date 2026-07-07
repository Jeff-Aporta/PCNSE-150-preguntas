/**
 * core/audio.ts — Reproductor simple para los audios TTS.
 */

let currentAudio: HTMLAudioElement | null = null;

export function playAudio(url: string): HTMLAudioElement {
  stopAudio();
  const audio = new Audio(url);
  audio.preload = "auto";
  currentAudio = audio;
  audio.play().catch((err) => {
    console.warn("[audio] play() failed:", err);
  });
  return audio;
}

export function stopAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
}

export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio;
}