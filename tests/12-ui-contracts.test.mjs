/**
 * tests/12-ui-contracts.test.mjs — invariantes de UI / navegación / audio tip.
 * Captura regresiones ya sufridas: tabs sin disabled, play idle ancho, tip player.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "./_helpers.mjs";

async function read(rel) {
  const p = await paths();
  return readFile(join(p.root, rel), "utf8");
}

describe("UI contracts — nav tabs", () => {
  it("NavTabRow passes disabled to MUI.Tab", async () => {
    const src = await read("vendor/william-shared/app-shell.jsx");
    assert.match(src, /disabled:\s*!!t\.disabled/);
  });

  it("App allows quiz tab without session; results gated on result", async () => {
    const src = await read("_dist/js/app/App.tsx");
    assert.match(src, /id === "results" && !state\.result/);
    assert.doesNotMatch(src, /id === "quiz" && !state\.session/);
    assert.match(src, /disabled:\s*!state\.result/);
  });
});

describe("UI contracts — audio players", () => {
  it("AudioPlayerBar uses circular 1:1 buttons and shrinks when idle", async () => {
    const src = await read("_dist/js/app/components/AudioPlayerBar.tsx");
    assert.match(src, /aspectRatio:\s*["']1\s*\/\s*1["']/);
    assert.match(src, /borderRadius:\s*["']50%["']/);
    assert.match(src, /showTimeline/);
    assert.match(src, /width:\s*showTimeline/);
    assert.match(src, /flex:\s*showTimeline/);
  });

  it("QuizView has question + tip AudioPlayerBar and right explanation panel", async () => {
    const src = await read("_dist/js/app/views/QuizView.tsx");
    assert.match(src, /track="question"/);
    assert.match(src, /track="tip"/);
    assert.match(src, /width:\s*\{\s*xs:\s*["']100%["'],\s*md:\s*400\s*\}/);
    assert.match(src, /flexDirection:\s*\{\s*xs:\s*["']column["'],\s*md:\s*["']row["']\s*\}/);
  });

  it("audio.ts exposes playTipAudio + clip path delegates to playlist", async () => {
    const audio = await read("_dist/js/app/core/audio.ts");
    const i18n = await read("_dist/js/app/core/question-i18n.ts");
    const playlist = await read("_dist/js/app/core/audio-playlist.ts");
    assert.match(audio, /export async function playTipAudio/);
    assert.match(audio, /playTipClips/);
    assert.match(playlist, /export async function playTipClips/);
    assert.match(audio, /subscribePlayback/);
  });

  it("generate-audio supports --clips and per-fragment prompts", async () => {
    const gen = await read("scripts/generate-audio.mjs");
    const prompt = await read("scripts/tts-prompt.mjs");
    assert.match(gen, /--clips/);
    assert.match(gen, /buildClipPrompts|buildTipClipPrompts/);
    assert.match(prompt, /export function buildClipPrompts/);
    assert.match(prompt, /export function buildTipClipPrompts/);
    assert.match(prompt, /QUESTION_CLIP_KEYS|TIP_CLIP_KEYS/);
  });
});
