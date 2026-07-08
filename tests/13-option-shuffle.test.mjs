/**
 * tests/13-option-shuffle.test.mjs — cada pregunta baraja sus opciones A–D por sesión
 * (examen real no presenta siempre la misma letra como correcta).
 * ID de pregunta se preserva; correctAnswer y explanations se remapean.
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

describe("option shuffle", () => {
  it("quiz.ts exposes shuffleQuestionOptions that remaps correctAnswer", async () => {
    const src = await read("_dist/js/app/core/quiz.ts");
    assert.match(src, /export function shuffleQuestionOptions/);
    assert.match(src, /letters\[\s*pairs\.findIndex\(/);
  });

  it("buildSession keeps question order by id and shuffles options", async () => {
    const src = await read("_dist/js/app/core/quiz.ts");
    assert.match(src, /sort\(\s*\(a,\s*b\)\s*=>\s*a\.id\.localeCompare/);
    assert.match(src, /selected = selected\.map\(\s*\(q\)\s*=>\s*shuffleQuestionOptions\(q\)/);
  });

  it("retryQuiz reshuffles options (not order)", async () => {
    const src = await read("_dist/js/app/App.tsx");
    assert.match(src, /shuffleQuestionOptions\(q\)/);
    assert.match(src, /shuffleArray\(/);
  });

  it("scripts/shuffle.mjs stays in sync with quiz.ts Fisher–Yates loop", async () => {
    const [quiz, shared] = await Promise.all([
      read("_dist/js/app/core/quiz.ts"),
      read("scripts/shuffle.mjs"),
    ]);
    for (const src of [quiz, shared]) {
      assert.match(src, /for \(let i = arr\.length - 1; i > 0; i--\)/);
      assert.match(src, /Math\.floor\(rng\(\) \* \(i \+ 1\)\)/);
    }
  });

  it("explanations move with the option text (option-only check is enforced upstream)", async () => {
    const src = await read("_dist/js/app/core/quiz.ts");
    assert.match(src, /newExplanations\[newLetter\]\s*=\s*q\.explanations\[oldLetter\]/);
  });

  it("AGENTS.md §6.13 reflects the option-only shuffle contract", async () => {
    const src = await read("AGENTS.md");
    assert.match(src, /shuffle|Desorden/i);
    assert.match(src, /examen real/i);
  });
});
