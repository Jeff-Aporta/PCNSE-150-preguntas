/**
 * scripts/generate-audio-parallel.mjs
 *
 * Variante concurrente de generate-audio.mjs (PCNSE-150-preguntas).
 *
 * Lanza N=8 workers en paralelo para acelerar la generación de los
 * 3.600 clips (12 por pregunta × 150 × 2 locales). El rate-limit de
 * MiniMax T2A es 60 RPM con concurrencia limitada, asi que 8 workers
 * mantiene el throughput alto sin disparar el error 1041 (conn limit).
 *
 * Comportamiento:
 *  - Reanuda archivos ya generados (skip si mp3 > 1024 bytes).
 *  - Si una llamada falla, espera backoff y reintenta hasta 3 veces.
 *  - Mantiene los mismos paths y manifests que generate-audio.mjs.
 *
 * Uso:
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio-parallel.mjs
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio-parallel.mjs --workers=12
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
const localeArg = args.find((a) => a.startsWith("--locale="))?.slice(9) || "all";
const idsArg = args.find((a) => a.startsWith("--ids="))?.slice(6)?.split(",").filter(Boolean);
const workersArg = parseInt(args.find((a) => a.startsWith("--workers="))?.slice(10) || "8", 10);
const WORKERS = Math.max(1, Math.min(20, workersArg));
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

async function synthesizeWithRetry(text, opts, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await synthesizeMinimax(text, opts);
    } catch (err) {
      const msg = err.message || String(err);
      const isRateLimit = /1002|1041|1004/.test(msg);
      if (!isRateLimit || attempt === maxRetries) throw err;
      const backoffMs = 1500 * attempt + Math.random() * 500;
      process.stdout.write(`retry ${attempt}/${maxRetries} (${backoffMs | 0}ms) `);
      await sleep(backoffMs);
    }
  }
  throw new Error("unreachable");
}

/**
 * Pool genérico: procesa items con N workers concurrentes.
 * Devuelve un objeto { ok, fail } con conteos.
 */
async function runPool(items, workers, handler) {
  let next = 0;
  let ok = 0;
  let fail = 0;
  const total = items.length;
  async function worker(id) {
    while (true) {
      const idx = next++;
      if (idx >= total) return;
      const item = items[idx];
      try {
        await handler(item);
        ok++;
      } catch (err) {
        fail++;
        console.error(`[worker ${id}] item ${idx} failed: ${err.message}`);
      }
      const done = ok + fail;
      if (done % 25 === 0 || done === total) {
        process.stdout.write(`\r[pool] ${done}/${total}  ok=${ok} fail=${fail}     `);
        if (done === total) process.stdout.write("\n");
      }
    }
  }
  const ws = Array.from({ length: workers }, (_, i) => worker(i + 1));
  await Promise.all(ws);
  return { ok, fail };
}

async function generateClipsFor(q, loc, enMap) {
  const enRow = loc === "en" ? enMap.get(q.id) : null;
  const qPrompts = buildClipPrompts(q, loc, enRow);
  const tPrompts = buildTipClipPrompts(q, loc, enRow);
  const manifestClips = [];

  const tasks = [];
  for (const key of QUESTION_CLIP_KEYS) {
    tasks.push({
      kind: "q",
      key,
      text: qPrompts[key],
      out: join(AUDIO_ROOT, loc, `${q.id}-${key}.mp3`),
      relFile: `audio/${loc}/${q.id}-${key}.mp3`,
    });
  }
  for (const key of TIP_CLIP_KEYS) {
    tasks.push({
      kind: "t",
      key,
      text: tPrompts[key],
      out: join(AUDIO_ROOT, loc, `${q.id}-${key}.mp3`),
      relFile: `audio/${loc}/${q.id}-${key}.mp3`,
    });
  }

  let missing = 0;
  for (const t of tasks) {
    if (!force && existsSync(t.out) && statSync(t.out).size > 1024) {
      const dur = ffprobeDuration(t.out) || 0;
      manifestClips.push({ key: t.key, file: t.relFile, durSec: dur });
      continue;
    }
    try {
      const mp3 = await synthesizeWithRetry(t.text, {
        language_boost: loc === "en" ? "English" : "Spanish",
      });
      writeFileSync(t.out, mp3);
      const dur = ffprobeDuration(t.out) || 0;
      manifestClips.push({ key: t.key, file: t.relFile, durSec: dur });
      console.log(`${q.id}-${t.key} [${loc}/${t.kind}] OK (${(mp3.length / 1024).toFixed(1)} KB${dur ? `, ${dur.toFixed(2)}s` : ""})`);
    } catch (err) {
      missing++;
      console.log(`${q.id}-${t.key} [${loc}/${t.kind}] FAIL: ${err.message}`);
      await sleep(2500);
    }
  }
  await ensureManifest(loc, q.id, manifestClips);
  return missing;
}

async function main() {
  const bank = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  const enMap = new Map();
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

  console.log(`Generando TTS MiniMax paralelo (workers=${WORKERS}, locales=${LOCALES.join(",")}) para ${questions.length} preguntas…`);

  const startedAt = Date.now();
  let totalMissing = 0;

  for (const loc of LOCALES) {
    let pending = [];
    for (const q of questions) {
      if (loc === "en" && !enMap.has(q.id)) {
        console.warn(`SKIP ${q.id} [${loc}]: sin traducción`);
        continue;
      }
      // Skip preguntas ya completas (12 clips + manifest existentes).
      const manifestPath = join(AUDIO_ROOT, loc, `${q.id}.segments.json`);
      if (!force && existsSync(manifestPath)) {
        try {
          const m = JSON.parse(readFileSync(manifestPath, "utf8"));
          if (m.clips && m.clips.length === 12) {
            const allPresent = m.clips.every((c) => existsSync(join(ROOT, c.file)));
            if (allPresent) continue;
          }
        } catch {}
      }
      pending.push(q);
    }
    console.log(`[${loc}] ${pending.length} preguntas pendientes…`);

    // Procesa preguntas en pool. Cada handler ejecuta los 12 clips en serie
    // (orden estable), pero las preguntas avanzan en paralelo.
    const { ok, fail } = await runPool(pending, WORKERS, async (q) => {
      const missing = await generateClipsFor(q, loc, enMap);
      totalMissing += missing;
    });
    console.log(`[${loc}] preguntas completas: ${ok}, fallidas: ${fail}`);
  }

  const elapsed = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log(`\nListo en ${elapsed} min. Clips faltantes totales: ${totalMissing}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
