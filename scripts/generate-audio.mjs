/**
 * Genera audio/{es|en}/qNNN.mp3 con MiniMax T2A (pregunta + opciones A–D).
 *
 * Uso:
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs --force
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs --locale=en
 *   MINIMAX_API_KEY=sk-... node scripts/generate-audio.mjs --ids q001,q040
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { synthesizeMinimax } from "./minimax-tts.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDIO_ROOT = join(ROOT, "audio");
const QUESTIONS_PATH = join(ROOT, "data", "questions.json");
const QUESTIONS_EN_PATH = join(ROOT, "data", "questions.en.json");

const args = process.argv.slice(2);
const force = args.includes("--force");
const localeArg = args.find((a) => a.startsWith("--locale="))?.slice(9) || "all";
const idsArg = args.find((a) => a.startsWith("--ids="))?.slice(6)?.split(",").filter(Boolean);

const LOCALES = localeArg === "all" ? ["es", "en"] : [localeArg];

function buildTtsPrompt(q, locale, enRow) {
  const num = q.id.replace(/^q/i, "");
  const topic = q.topic;
  const question = locale === "en" && enRow ? enRow.question : q.question;
  const options = locale === "en" && enRow ? enRow.options : q.options;
  const opts = options
    .map((o) => (locale === "en" ? `Option ${o.id}. ${o.text}` : `Opcion ${o.id}. ${o.text}`))
    .join(" ");
  if (locale === "en") {
    return `Question ${num}. Topic ${topic}. ${question}. ${opts}`;
  }
  return `Pregunta ${num}. ${topic}. ${question}. ${opts}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

  for (const loc of LOCALES) {
    mkdirSync(join(AUDIO_ROOT, loc), { recursive: true });
  }

  console.log(`Generando TTS MiniMax (${LOCALES.join(", ")}) para ${questions.length} preguntas…`);
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const loc of LOCALES) {
    for (const q of questions) {
      if (loc === "en" && !enMap.has(q.id)) {
        console.warn(`SKIP ${q.id} [en]: sin traducción en questions.en.json`);
        skip++;
        continue;
      }
      const out = join(AUDIO_ROOT, loc, `${q.id}.mp3`);
      if (!force && existsSync(out) && statSync(out).size > 1024) {
        skip++;
        continue;
      }
      const text = buildTtsPrompt(q, loc, enMap.get(q.id));
      process.stdout.write(`${q.id} [${loc}]… `);
      try {
        const mp3 = await synthesizeMinimax(text, {
          language_boost: loc === "en" ? "English" : "Spanish",
        });
        writeFileSync(out, mp3);
        ok++;
        console.log(`OK (${(mp3.length / 1024).toFixed(1)} KB)`);
        await sleep(1100);
      } catch (err) {
        fail++;
        console.log(`FAIL: ${err.message}`);
        await sleep(2000);
      }
    }
  }

  console.log(`\nListo: ${ok} generados, ${skip} omitidos, ${fail} fallidos.`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
