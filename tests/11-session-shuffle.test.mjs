/**
 * tests/11-session-shuffle.test.mjs — cada sesión debe desordenar preguntas.
 * Mitiga regresión: sort por id vuelve a filtrar/ordenar sin Fisher–Yates.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "./_helpers.mjs";
import { shuffleArray } from "../scripts/shuffle.mjs";

describe("session shuffle", () => {
  it("shuffleArray permutes with a seeded RNG and preserves membership", () => {
    const input = ["q001", "q002", "q003", "q004", "q005", "q006", "q007", "q008"];
    let n = 0;
    const rng = () => {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      return (n % 10000) / 10000;
    };
    const a = shuffleArray(input.slice(), rng);
    const b = shuffleArray(input.slice(), () => {
      // second independent stream
      return 0.42;
    });
    assert.deepEqual([...a].sort(), [...input].sort());
    assert.notDeepEqual(a, input);
    assert.deepEqual([...b].sort(), [...input].sort());
  });

  it("shuffleArray is not a no-op for n>=3 across many RNG values", () => {
    const base = Array.from({ length: 20 }, (_, i) => `q${String(i + 1).padStart(3, "0")}`);
    let different = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let s = seed;
      const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return (s % 100000) / 100000;
      };
      const out = shuffleArray(base.slice(), rng);
      if (out.join(",") !== base.join(",")) different++;
    }
    assert.ok(different >= 35, `expected most shuffles to differ from sorted input, got ${different}/40`);
  });

  it("quiz.ts buildSession shuffles (does not sort by id)", async () => {
    const p = await paths();
    const src = await readFile(join(p.root, "_dist/js/app/core/quiz.ts"), "utf8");
    assert.match(src, /function shuffleArray/);
    assert.match(src, /shuffleArray\(selected\)/);
    assert.doesNotMatch(src, /selected\.sort\(\s*\(a,\s*b\)\s*=>\s*a\.id\.localeCompare/);
  });

  it("HomeView starts via buildSession (no local id sort)", async () => {
    const p = await paths();
    const src = await readFile(join(p.root, "_dist/js/app/views/HomeView.tsx"), "utf8");
    assert.match(src, /buildSession\(/);
    assert.doesNotMatch(src, /filtered\.sort\(\s*\(a,\s*b\)\s*=>\s*a\.id\.localeCompare/);
    assert.doesNotMatch(src, /\.sort\(\s*\(a,\s*b\)\s*=>\s*a\.id\.localeCompare/);
  });

  it("scripts/shuffle.mjs stays in sync with quiz.ts Fisher–Yates loop", async () => {
    const p = await paths();
    const quiz = await readFile(join(p.root, "_dist/js/app/core/quiz.ts"), "utf8");
    const shared = await readFile(join(p.root, "scripts/shuffle.mjs"), "utf8");
    for (const src of [quiz, shared]) {
      assert.match(src, /for \(let i = arr\.length - 1; i > 0; i--\)/);
      assert.match(src, /Math\.floor\(rng\(\) \* \(i \+ 1\)\)/);
    }
  });
});
