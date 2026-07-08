/**
 * Traduce data/questions.json → data/questions.en.json (MiniMax text API).
 *
 * Uso:
 *   MINIMAX_API_KEY=sk-... node scripts/translate-questions-en.mjs
 *   MINIMAX_API_KEY=sk-... node scripts/translate-questions-en.mjs --from q050
 *   MINIMAX_API_KEY=sk-... node scripts/translate-questions-en.mjs --batch 5
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const QUESTIONS_PATH = join(ROOT, "data", "questions.json");
const OUT_PATH = join(ROOT, "data", "questions.en.json");

const args = process.argv.slice(2);
const fromId = args.find((a) => a.startsWith("--from="))?.slice(7);
const batchSize = parseInt(args.find((a) => a.startsWith("--batch="))?.slice(8) || "3", 10);

function chatBase() {
  return (process.env.MINIMAX_API_BASE_CHAT || "https://api.minimax.io/v1/text/chatcompletion_v2").replace(/\/$/, "");
}

async function minimaxChat(messages) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY no configurada");

  const groupId = process.env.MINIMAX_GROUP_ID;
  const url = groupId ? `${chatBase()}?GroupId=${encodeURIComponent(groupId)}` : chatBase();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MINIMAX_TEXT_MODEL || "MiniMax-Text-01",
      messages,
      temperature: 0.2,
      max_tokens: 8192,
    }),
  });

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`MiniMax chat respuesta inválida (${res.status}): ${raw.slice(0, 300)}`);
  }

  const baseResp = data.base_resp || data.baseResp;
  if (baseResp && baseResp.status_code !== 0 && baseResp.status_code !== undefined) {
    throw new Error(`MiniMax chat error ${baseResp.status_code}: ${baseResp.status_msg || "unknown"}`);
  }

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.reply ??
    data?.output?.text ??
    null;

  if (!content) throw new Error("MiniMax chat: sin contenido en respuesta");
  return content.trim();
}

function extractJson(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : text.trim();
  return JSON.parse(raw);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(batch) {
  const payload = batch.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    tip: q.tip,
    explanations: q.explanations,
  }));

  const system = `You translate PCNSE exam quiz content from Spanish to English.
Return ONLY valid JSON array. Keep technical terms (App-ID, User-ID, Panorama, WildFire, ssl, slack-base, etc.).
Preserve option ids A-D. Keep "Correcto/Incorrecto" style prefixes in explanations as "Correct/Incorrect".
Do not add markdown.`;

  const user = `Translate each item to English. Input:\n${JSON.stringify(payload)}`;

  const content = await minimaxChat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  const rows = extractJson(content);
  if (!Array.isArray(rows)) throw new Error("Expected JSON array from translator");
  return rows;
}

async function main() {
  const bank = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  let questions = bank.questions || [];
  if (fromId) {
    const idx = questions.findIndex((q) => q.id === fromId);
    if (idx < 0) throw new Error(`ID no encontrado: ${fromId}`);
    questions = questions.slice(idx);
  }

  let existing = { metadata: { language: "en", totalQuestions: 150 }, questions: [] };
  if (existsSync(OUT_PATH)) {
    existing = JSON.parse(readFileSync(OUT_PATH, "utf8"));
  }
  const done = new Set((existing.questions || []).map((q) => q.id));

  console.log(`Traduciendo ${questions.length} preguntas (batch=${batchSize}), ya hechas: ${done.size}`);

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize).filter((q) => !done.has(q.id));
    if (!batch.length) continue;

    const ids = batch.map((q) => q.id).join(", ");
    process.stdout.write(`Batch ${ids}… `);
    try {
      const translated = await translateBatch(batch);
      for (const row of translated) {
        if (!row?.id) continue;
        const idx = existing.questions.findIndex((q) => q.id === row.id);
        const entry = {
          id: row.id,
          question: row.question,
          options: row.options,
          tip: row.tip,
          explanations: row.explanations,
        };
        if (idx >= 0) existing.questions[idx] = entry;
        else existing.questions.push(entry);
        done.add(row.id);
      }
      existing.questions.sort((a, b) => a.id.localeCompare(b.id));
      existing.metadata = {
        exam: bank.metadata?.exam || "PCNSE",
        version: bank.metadata?.version || "2.0",
        language: "en",
        totalQuestions: existing.questions.length,
      };
      writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2), "utf8");
      console.log("OK");
      await sleep(1500);
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      await sleep(3000);
    }
  }

  console.log(`\nGuardado ${OUT_PATH} (${existing.questions.length} preguntas EN)`);
  if (existing.questions.length < 150) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
