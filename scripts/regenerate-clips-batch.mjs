/**
 * scripts/regenerate-clips-batch.mjs — Genera batch.json para `matrix_batch_text_to_audio`.
 *
 * Uso:
 *   node scripts/regenerate-clips-batch.mjs              # genera batches en batches/
 *   node scripts/regenerate-clips-batch.mjs --ids q001   # solo una pregunta
 *   node scripts/regenerate-clips-batch.mjs --locale en  # solo EN
 *   node scripts/regenerate-clips-batch.mjs --out batches
 *
 *   mavis mcp call matrix matrix_batch_text_to_audio --file batches/batch-0001.json
 *   # → mueve los MP3 a audio/{es|en}/qNNN-{key}.mp3 según el `output` sugerido.
 *
 * Tras ejecutar todos los batches, corre `node scripts/generate-audio.mjs --clips`
 * en modo "manifest only" pasando --manifest-only (TODO) o usa consolidate-clips.mjs.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildClipPrompts, buildTipClipPrompts,
  QUESTION_CLIP_KEYS, TIP_CLIP_KEYS,
} from "./tts-prompt.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const QUESTIONS_PATH = join(ROOT, "data", "questions.json");
const QUESTIONS_EN_PATH = join(ROOT, "data", "questions.en.json");

const args = process.argv.slice(2);
const idsArg = args.find((a) => a.startsWith("--ids="))?.slice(6)?.split(",").filter(Boolean);
const localeArg = args.find((a) => a.startsWith("--locale="))?.slice(9);
const outArg = args.find((a) => a.startsWith("--out="))?.slice(6) || join(ROOT, "batches");
const batchSize = 10; // matrix_batch_text_to_audio cap.

const LOCALES = localeArg ? [localeArg] : ["es", "en"];

const VOICE = "English_Trustworth_Man";
const SPEED = 0.95;

function getL10nQuestion(q, loc, enMap) {
  if (loc === "en") {
    const en = enMap.get(q.id);
    if (!en) return null;
    return { ...q, question: en.question, options: en.options, tip: en.tip, explanations: en.explanations };
  }
  return q;
}

function buildRequests(questions, enMap) {
  const requests = [];
  for (const loc of LOCALES) {
    for (const q of questions) {
      const L = getL10nQuestion(q, loc, enMap);
      if (!L) continue;
      const qPrompts = buildClipPrompts(q, loc, enMap.get(q.id));
      const tPrompts = buildTipClipPrompts(q, loc, enMap.get(q.id));
      for (const key of QUESTION_CLIP_KEYS) {
        requests.push({
          text: qPrompts[key],
          voice_id: VOICE,
          speed: SPEED,
          emotion: "neutral",
          _meta: { id: q.id, loc, kind: "q", key, out: `audio/${loc}/${q.id}-${key}.mp3` },
        });
      }
      for (const key of TIP_CLIP_KEYS) {
        requests.push({
          text: tPrompts[key],
          voice_id: VOICE,
          speed: SPEED,
          emotion: "neutral",
          _meta: { id: q.id, loc, kind: "t", key, out: `audio/${loc}/${q.id}-${key}.mp3` },
        });
      }
    }
  }
  return requests;
}

function main() {
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

  const requests = buildRequests(questions, enMap);
  mkdirSync(outArg, { recursive: true });

  // Strip _meta de los payloads que van al MCP (es metadata local).
  const totalBatches = Math.ceil(requests.length / batchSize);
  console.log(`Generando ${totalBatches} batches de hasta ${batchSize} requests (${requests.length} total)…`);
  for (let i = 0; i < totalBatches; i++) {
    const slice = requests.slice(i * batchSize, (i + 1) * batchSize);
    const out = {
      requests: slice.map(({ _meta, ...rest }) => rest),
      _meta: slice.map((r) => r._meta),
    };
    const file = join(outArg, `batch-${String(i + 1).padStart(4, "0")}.json`);
    writeFileSync(file, JSON.stringify(out, null, 2));
  }
  console.log(`\nPara invocar el MCP:`);
  console.log(`  for %f in (batches\\batch-*.json) do mavis mcp call matrix matrix_batch_text_to_audio --file %f`);
  console.log(`\nLas respuestas devuelven archivos locales en C:\\ContaPyme\\matrix-media-*.mp3`);
  console.log(`Usa scripts/consolidate-clips.mjs para moverlos a audio/{es|en}/ usando _meta.`);
}

main();
