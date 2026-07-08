/**
 * tests/02-audio.test.mjs — verify per-clip MP3 + manifest JSON per locale.
 *
 * Estructura nueva (audio fragmentado):
 *   audio/{es|en}/qNNN-{stmt|A|B|C|D|ttip|correct|wrong|EA|EB|EC|ED}.mp3
 *   audio/{es|en}/qNNN.segments.json   ← manifest con offsets
 *
 * Los monolíticos qNNN.mp3 / qNNN-tip.mp3 son FALLBACK runtime; los tests
 * los exigen si no hay manifest, y los clips + manifest si ya se regeneró.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readdir, stat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "./_helpers.mjs";

const LOCALES = ["es", "en"];
const CLIP_KEYS = ["stmt", "A", "B", "C", "D", "ttip", "correct", "wrong", "EA", "EB", "EC", "ED"];

async function listFiles(audioDir) {
  try { return await readdir(audioDir); } catch { return []; }
}

describe("audio coverage — clip fragments + manifest", () => {
  let questionsIds;
  let byLocale = {};

  before(async () => {
    const p = await paths();
    const data = await (await import("./_helpers.mjs")).readJson(p.questions);
    questionsIds = data.questions.map((q) => q.id).sort();
    for (const loc of LOCALES) byLocale[loc] = await listFiles(join(p.audio, loc));
  });

  for (const loc of LOCALES) {
    it(`${loc}: 150 manifests OR 150 monolíticos (clip regenerado o fallback)`, () => {
      const files = byLocale[loc] || [];
      const manifests = files.filter((f) => f.endsWith(".segments.json"));
      const monoFallback = files.filter((f) => /^q\d{3}\.mp3$/.test(f));
      const tipFallback = files.filter((f) => /^q\d{3}-tip\.mp3$/.test(f));
      if (manifests.length) {
        const ids = manifests.map((f) => f.replace(/\.segments\.json$/, "")).sort();
        assert.deepEqual(ids, questionsIds, `${loc} manifest ids mismatch`);
      } else {
        assert.equal(monoFallback.length, 150, `${loc}: sin manifest y sin 150 monolíticos`);
        assert.equal(tipFallback.length, 150, `${loc}: sin manifest y sin 150 tip monolíticos`);
      }
    });
  }

  for (const loc of LOCALES) {
    it(`${loc}: 12 clips per question when manifest is present`, () => {
      const files = byLocale[loc] || [];
      const hasManifest = files.some((f) => f.endsWith(".segments.json"));
      if (!hasManifest) return; // skip: todavía no se ha regenerado
      for (const key of CLIP_KEYS) {
        const re = new RegExp(`^q\\d{3}-${key}\\.mp3$`);
        const ids = files.filter((f) => re.test(f))
          .map((f) => f.replace(new RegExp(`-${key}\\.mp3$`), ""))
          .sort();
        assert.deepEqual(ids, questionsIds, `${loc}/${key} missing or extra`);
      }
    });

    it(`${loc}: every clip file >1KB (cuando manifest presente)`, async () => {
      const files = byLocale[loc] || [];
      const hasManifest = files.some((f) => f.endsWith(".segments.json"));
      if (!hasManifest) return;
      const p = await paths();
      for (const key of CLIP_KEYS) {
        for (const id of questionsIds) {
          const full = join(p.audio, loc, `${id}-${key}.mp3`);
          const s = await stat(full);
          assert.ok(s.size > 1024, `${loc}/${id}-${key}.mp3 too small (${s.size} bytes)`);
        }
      }
    });
  }

  it("manifest JSON shape is valid when present (version 1, clips array, totalDur)", async () => {
    const p = await paths();
    for (const loc of LOCALES) {
      const sample = join(p.audio, loc, "q001.segments.json");
      try {
        const m = JSON.parse(await readFile(sample, "utf8"));
        assert.equal(m.version, 1);
        assert.ok(Array.isArray(m.clips));
        assert.equal(m.clips.length, CLIP_KEYS.length);
        assert.ok(m.clips.every((c) => CLIP_KEYS.includes(c.key) && c.file && c.durSec >= 0));
        assert.ok(m.totalDur >= 0);
      } catch (e) {
        if (e.code === "ENOENT") return; // sin manifest todavía: skip
        throw e;
      }
    }
  });
});
