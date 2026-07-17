/**
 * tests/13-option-shuffle.test.mjs — sistema de orden de opciones.
 *
 * PCNSE-150-preguntas (voz clonada del autor Jeff-Aporta) desactiva el
 * shuffle de opciones A–D por sesion por coherencia con el sistema de
 * audios pregrabados por letra canonica (ver AGENTS.md §6.14-historical).
 * `shuffleQuestionOptions` se mantiene como codigo disponible para una
 * futura regeneracion por slot visible (16 clips por pregunta).
 *
 * - `shuffleQuestionOptions` se exporta (codigo legacy, marcado deprecated).
 * - `buildSession` NO llama a `shuffleQuestionOptions` (orden canonico).
 * - `retryQuiz` reordena preguntas pero NO baraja opciones.
 * - `AppShell/HomeView` muestran siempre A, B, C, D canonicos.
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

describe("option order (canonico, sin shuffle por sesion)", () => {
  it("quiz.ts keeps shuffleQuestionOptions exported for future use (deprecated comment)", async () => {
    const src = await read("_dist/js/app/core/quiz.ts");
    assert.match(src, /export function shuffleQuestionOptions/);
    assert.match(src, /letters\[\s*pairs\.findIndex\(/);
    assert.match(src, /shuffleQuestionOptions\s*—\s*DEPRECATED/i);
  });

  it("buildSession orders by id and DOES NOT shuffle options (audio coherente)", async () => {
    const src = await read("_dist/js/app/core/quiz.ts");
    assert.match(src, /sort\(\s*\(a,\s*b\)\s*=>\s*a\.id\.localeCompare/);
    assert.doesNotMatch(
      src,
      /selected = selected\.map\(\s*\(q\)\s*=>\s*shuffleQuestionOptions\(q\)/,
      "buildSession should NOT shuffle options per session (audio coherence)"
    );
  });

  it("retryQuiz reorders questions but keeps options canonical", async () => {
    const src = await read("_dist/js/app/App.tsx");
    assert.match(src, /shuffleArray\(/);
    assert.doesNotMatch(
      src,
      /shuffleQuestionOptions\(q\)/,
      "retryQuiz should not call shuffleQuestionOptions (audio coherence)"
    );
  });

  it("QuizView uses canonicalQuestion (not shuffled) for justification panel", async () => {
    const src = await read("_dist/js/app/views/QuizView.tsx");
    assert.match(src, /canonicalQuestion/);
    assert.match(src, /LC\.explanations\[letter\]/);
  });

  it("AGENTS.md documents the option-canonical decision (audio coherence)", async () => {
    const src = await read("AGENTS.md");
    assert.match(src, /coheren[ct]e|can[oó]nic[ao]/i);
  });
});
