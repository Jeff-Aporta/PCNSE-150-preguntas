/**
 * Genera audio/{es|en}/qNNN-{clipKey}.mp3 + qNNN.segments.json con MiniMax T2A.
 *
 * Modos:
 *   --clips   (default) genera 5 clips de question + 7 de tip por pregunta
 *   --mono    genera el MP3 monolítico (qNNN.mp3 y qNNN-tip.mp3) — fallback runtime
 *
 * Uso:
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs --force
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs --clips --ids q001,q040
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs --mono --locale=en
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { synthesizeMinimax } from "./minimax-tts.mjs";
import {
  buildTtsPrompt, buildTipTtsPrompt,
  buildClipPrompts, buildTipClipPrompts,
  QUESTION_CLIP_KEYS, TIP_CLIP_KEYS,
} from "./tts-prompt.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDIO_ROOT = join(ROOT, "audio");
const QUESTIONS_PATH = join(ROOT, "data", "questions.json");
const QUESTIONS_EN_PATH = join(ROOT, "data", "questions.en.json");

const args = process.argv.slice(2);
const force = args.includes("--force");
const modeMono = args.includes("--mono");
const modeClips = args.includes("--clips") || !modeMono;
const localeArg = args.find((a) => a.startsWith("--locale="))?.slice(9) || "all";
const idsArg = args.find((a) => a.startsWith("--ids="))?.slice(6)?.split(",").filter(Boolean);

const LOCALES = localeArg === "all" ? ["es", "en"] : [localeArg];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function ffprobeDuration(file) {
  try {
    const out = execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", file,
    ], { stdio: ["ignore", "pipe", "ignore"] });
    const v = parseFloat(String(out).trim());
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch { return 0; }
}

async function ensureManifest(loc, qid, clipsList) {
  const manifestPath = join(AUDIO_ROOT, loc, `${qid}.segments.json`);
  // Fusiona con un manifest existente para no perder clips previos.
  let existing = null;
  if (existsSync(manifestPath)) {
    try { existing = JSON.parse(readFileSync(manifestPath, "utf8")); } catch {}
  }
  const map = new Map((existing?.clips || []).map((c) => [c.key, c]));
  for (const c of clipsList) map.set(c.key, c);
  const clips = [...map.values()];
  const totalDur = clips.reduce((s, c) => s + (c.durSec || 0), 0);
  writeFileSync(manifestPath, JSON.stringify({ version: 1, totalDur, clips }, null, 2));
}

async function generateClipsFor(q, loc, enMap) {
  const enRow = loc === "en" ? enMap.get(q.id) : null;
  const qPrompts = buildClipPrompts(q, loc, enRow);
  const tPrompts = buildTipClipPrompts(q, loc, enRow);
  const manifestClips = [];
  let missing = 0;

  for (const key of QUESTION_CLIP_KEYS) {
    const out = join(AUDIO_ROOT, loc, `${q.id}-${key}.mp3`);
    if (!force && existsSync(out) && statSync(out).size > 1024) {
      const dur = ffprobeDuration(out) || 0;
      manifestClips.push({ key, file: `audio/${loc}/${q.id}-${key}.mp3`, durSec: dur });
      continue;
    }
    process.stdout.write(`${q.id}-${key} [${loc}/q]… `);
    try {
      const mp3 = await synthesizeMinimax(qPrompts[key], {
        language_boost: loc === "en" ? "English" : "Spanish",
      });
      writeFileSync(out, mp3);
      const dur = ffprobeDuration(out) || 0;
      manifestClips.push({ key, file: `audio/${loc}/${q.id}-${key}.mp3`, durSec: dur });
      console.log(`OK (${(mp3.length / 1024).toFixed(1)} KB${dur ? `, ${dur.toFixed(2)}s` : ""})`);
      await sleep(1100);
    } catch (err) {
      missing++;
      console.log(`FAIL: ${err.message}`);
      await sleep(2000);
    }
  }

  for (const key of TIP_CLIP_KEYS) {
    const out = join(AUDIO_ROOT, loc, `${q.id}-${key}.mp3`);
    if (!force && existsSync(out) && statSync(out).size > 1024) {
      const dur = ffprobeDuration(out) || 0;
      manifestClips.push({ key, file: `audio/${loc}/${q.id}-${key}.mp3`, durSec: dur });
      continue;
    }
    process.stdout.write(`${q.id}-${key} [${loc}/t]… `);
    try {
      const mp3 = await synthesizeMinimax(tPrompts[key], {
        language_boost: loc === "en" ? "English" : "Spanish",
      });
      writeFileSync(out, mp3);
      const dur = ffprobeDuration(out) || 0;
      manifestClips.push({ key, file: `audio/${loc}/${q.id}-${key}.mp3`, durSec: dur });
      console.log(`OK (${(mp3.length / 1024).toFixed(1)} KB${dur ? `, ${dur.toFixed(2)}s` : ""})`);
      await sleep(1100);
    } catch (err) {
      missing++;
      console.log(`FAIL: ${err.message}`);
      await sleep(2000);
    }
  }

  await ensureManifest(loc, q.id, manifestClips);
  return missing;
}

async function generateMonoFor(q, loc, enMap) {
  const enRow = loc === "en" ? enMap.get(q.id) : null;
  for (const kind of ["question", "tip"]) {
    const out = join(AUDIO_ROOT, loc, kind === "tip" ? `${q.id}-tip.mp3` : `${q.id}.mp3`);
    if (!force && existsSync(out) && statSync(out).size > 1024) { continue; }
    const text = kind === "tip"
      ? buildTipTtsPrompt(q, loc, enRow)
      : buildTtsPrompt(q, loc, enRow);
    process.stdout.write(`${q.id} [${loc}/${kind}]… `);
    try {
      const mp3 = await synthesizeMinimax(text, { language_boost: loc === "en" ? "English" : "Spanish" });
      writeFileSync(out, mp3);
      console.log(`OK (${(mp3.length / 1024).toFixed(1)} KB)`);
      await sleep(1100);
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      await sleep(2000);
    }
  }
}

async function main() {
  const bank = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  let enMap = new Map();
  if (existsSync(QUESTIONS_EN_PATH)) {
    const enBank = JSON.parse(readFileSync(QUESTIONS_EN_PATH, "utf8"));
    for (const row of enBank.questions || []) enMap.set(row.id, row);
  }
  let questions = bank.questions || [];
  if (idsArg?.length) {
    const set = new Set(idsArg);
    questions = questions.filter((q) => set.has(q.id));
  }
  for (const loc of LOCALES) mkdirSync(join(AUDIO_ROOT, loc), { recursive: true });

  const mode = modeClips ? "clips" : "mono";
  console.log(`Generando TTS MiniMax (${mode}, ${LOCALES.join(", ")}) para ${questions.length} preguntas…`);

  for (const loc of LOCALES) {
    for (const q of questions) {
      if (loc === "en" && !enMap.has(q.id)) {
        console.warn(`SKIP ${q.id} [${loc}]: sin traducción`);
        continue;
      }
      if (modeClips) await generateClipsFor(q, loc, enMap);
      else await generateMonoFor(q, loc, enMap);
    }
  }
  console.log(`\nListo.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
