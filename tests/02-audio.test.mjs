/**
 * tests/02-audio.test.mjs — verify audio files per locale (es + en).
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "./_helpers.mjs";

const LOCALES = ["es", "en"];

async function listAudioIds(audioDir, suffix = "") {
  const ids = [];
  const re = suffix ? new RegExp(`^q(\\d{3})${suffix}\\.mp3$`) : /^q(\d{3})\.mp3$/;
  try {
    for (const f of await readdir(audioDir)) {
      const m = re.exec(f);
      if (m) ids.push("q" + m[1].padStart(3, "0"));
    }
  } catch {
    return [];
  }
  return ids.sort();
}

describe("audio coverage", () => {
  let questionsIds;
  let byLocale = {};
  let tipByLocale = {};

  before(async () => {
    const p = await paths();
    const data = await (await import("./_helpers.mjs")).readJson(p.questions);
    questionsIds = data.questions.map((q) => q.id).sort();
    for (const loc of LOCALES) {
      byLocale[loc] = await listAudioIds(join(p.audio, loc));
      tipByLocale[loc] = await listAudioIds(join(p.audio, loc), "-tip");
    }
  });

  for (const loc of LOCALES) {
    it(`${loc}: exactly 150 audio files exist (q001..q150)`, () => {
      assert.equal(byLocale[loc].length, 150, `expected 150 ${loc} audio files, found ${byLocale[loc].length}`);
      assert.equal(questionsIds.length, 150);
    });

    it(`${loc}: audio IDs match question IDs`, () => {
      const a = new Set(byLocale[loc]);
      const q = new Set(questionsIds);
      const onlyInAudio = [...a].filter((x) => !q.has(x));
      const onlyInQuestions = [...q].filter((x) => !a.has(x));
      assert.deepEqual(onlyInAudio, [], `${loc}: audio without question: ${onlyInAudio.join(", ")}`);
      assert.deepEqual(onlyInQuestions, [], `${loc}: question without audio: ${onlyInQuestions.join(", ")}`);
    });

    it(`${loc}: contiguous q001..q150`, () => {
      const nums = byLocale[loc].map((id) => parseInt(id.slice(1), 10));
      for (let i = 0; i < 150; i++) {
        assert.equal(nums[i], i + 1, `${loc} gap at ${i}: expected q${String(i + 1).padStart(3, "0")}, got ${byLocale[loc][i]}`);
      }
    });

    it(`${loc}: every file >1KB`, async () => {
      const p = await paths();
      for (const id of byLocale[loc]) {
        const full = join(p.audio, loc, id + ".mp3");
        const s = await stat(full);
        assert.ok(s.size > 1024, `${loc}/${id}.mp3 too small (${s.size} bytes)`);
      }
    });
  }

  for (const loc of LOCALES) {
    it(`${loc}: exactly 150 tip audio files exist (q001-tip..q150-tip)`, () => {
      assert.equal(tipByLocale[loc].length, 150, `expected 150 ${loc} tip audio files, found ${tipByLocale[loc].length}`);
    });

    it(`${loc}: tip audio IDs match question IDs`, () => {
      assert.deepEqual(tipByLocale[loc], questionsIds);
    });

    it(`${loc}: every tip file >1KB`, async () => {
      const p = await paths();
      for (const id of tipByLocale[loc]) {
        const full = join(p.audio, loc, id + "-tip.mp3");
        const s = await stat(full);
        assert.ok(s.size > 1024, `${loc}/${id}-tip.mp3 too small (${s.size} bytes)`);
      }
    });
  }
});
