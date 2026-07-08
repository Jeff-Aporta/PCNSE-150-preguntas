/**
 * tests/10-runtime-contract.test.mjs — invariantes de arranque, audio e i18n en código fuente.
 * Evita regresiones documentadas en AGENTS.md §6.8–6.10.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { paths } from './_helpers.mjs';

async function readSrc(root, rel) {
  return readFile(join(root, rel), 'utf8');
}

describe('runtime contract — boot loader', () => {
  it('loader.mjs uses eval for IIFE bundles (not inline script onload)', async () => {
    const p = await paths();
    const src = await readSrc(p.root, '_dist/js/boot/loader.mjs');
    assert.match(src, /\(0,\s*eval\)\(src\)/, 'must eval IIFE bundles synchronously');
    assert.doesNotMatch(src, /createElement\(['"]script['"]\)[\s\S]*onload/, 'inline script onload never fires for IIFE');
    assert.match(src, /import\.meta\.url/, 'paths must be relative to import.meta.url');
  });

  it('index.html sets dynamic <base href> for subpath deploy', async () => {
    const p = await paths();
    const html = await readSrc(p.root, 'index.html');
    assert.match(html, /createElement\(['"]base['"]\)/);
    assert.match(html, /document\.head\.appendChild\(b\)/);
  });

  it('stack.mjs exposes jsx on window.React for esbuild shims', async () => {
    const p = await paths();
    const src = await readSrc(p.root, 'vendor/front-shared/stack.mjs');
    assert.match(src, /window\.React/);
    assert.match(src, /jsx|jsxs/);
  });
});

describe('runtime contract — i18n UI', () => {
  it('App resolves AppShell from globalThis and mounts LocaleToolbar', async () => {
    const p = await paths();
    const app = await readSrc(p.root, '_dist/js/app/App.tsx');
    assert.match(app, /resolveAppShell/);
    assert.match(app, /toolbarExtra=\{<LocaleToolbar/);
  });

  it('william-front registers Locale + LangSwitch', async () => {
    const p = await paths();
    const src = await readSrc(p.root, 'vendor/william-shared/william-front.js');
    assert.match(src, /bag\.Locale\s*=/);
    assert.match(src, /LangSwitch/);
    assert.match(src, /william-quest:locale|ns\.toLowerCase\(\)\s*\+\s*":locale"/);
  });

  it('quiz.ts merges questions.en.json and sets audio/es path', async () => {
    const p = await paths();
    const src = await readSrc(p.root, '_dist/js/app/core/quiz.ts');
    assert.match(src, /questions\.en\.json/);
    assert.match(src, /audio\/es\//);
  });
});

describe('runtime contract — audio playback', () => {
  it('audio.ts: locale paths, no HEAD-only check, playback listener', async () => {
    const p = await paths();
    const src = await readSrc(p.root, '_dist/js/app/core/tts.ts');
    const audio = await readSrc(p.root, '_dist/js/app/core/audio.ts');
    assert.match(src, /Opcion|Option/);
    assert.match(src, /L\.options/);
    assert.match(audio, /questionAudioPath/);
    assert.match(audio, /setPlaybackListener/);
    assert.match(audio, /bindPlaybackEvents/);
    assert.match(audio, /Range.*bytes=0-511/);
    assert.match(audio, /if \(loc === "en"\) return \[primary\]/);
    assert.doesNotMatch(audio, /method:\s*['"]HEAD['"]/);
  });

  it('QuizView wires setPlaybackListener and play/pause toggle', async () => {
    const p = await paths();
    const src = await readSrc(p.root, '_dist/js/app/views/QuizView.tsx');
    assert.match(src, /setPlaybackListener/);
    assert.match(src, /handleAudioToggle/);
    assert.match(src, /mdi:pause/);
    assert.match(src, /playQuestionAudio\(currentQuestion,\s*locale\)/);
  });

  it('generate-audio imports shared tts-prompt.mjs', async () => {
    const p = await paths();
    const src = await readSrc(p.root, 'scripts/generate-audio.mjs');
    assert.match(src, /from ['"]\.\/tts-prompt\.mjs['"]/);
    assert.doesNotMatch(src, /function buildTtsPrompt\(/);
  });
});

describe('runtime contract — Icon component', () => {
  it('william-front Icon passes style object (not string) to iconify-icon', async () => {
    const p = await paths();
    const src = await readSrc(p.root, 'vendor/william-shared/william-front.js');
    assert.match(src, /typeof style === "object"/);
    assert.match(src, /style:\s*styleObj/);
  });
});
