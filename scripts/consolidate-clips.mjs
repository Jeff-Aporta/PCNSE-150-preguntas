/**
 * scripts/consolidate-clips.mjs — Mueve los MP3 devueltos por el MCP matrix a su destino final.
 *
 * El MCP `matrix_batch_text_to_audio` devuelve success_items con `output_url` apuntando a
 * un path local tipo `C:\ContaPyme\matrix-media-<ts>-<hash>.mp3`. Este script lee el
 * resultado de cada batch (guardado en batches/results-*.json) y mueve cada MP3 a
 * `audio/{es|en}/qNNN-{key}.mp3` usando el `_meta` que dejó `regenerate-clips-batch.mjs`.
 *
 * Uso:
 *   node scripts/consolidate-clips.mjs
 *   node scripts/consolidate-clips.mjs --results-dir batches --audio audio
 *
 * Formato esperado de cada results file (escrito a mano tras cada llamada al MCP):
 *   {
 *     "responses": [
 *       { "_meta": {id, loc, key, out}, "output_url": "C:\\ContaPyme\\matrix-media-...mp3" },
 *       ...
 *     ]
 *   }
 */
import { renameSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const args = process.argv.slice(2);
const resultsArg = args.find((a) => a.startsWith("--results-dir="))?.slice(15) || join(ROOT, "batches");
const audioArg = args.find((a) => a.startsWith("--audio="))?.slice(8) || join(ROOT, "audio");

const files = readdirSync(resultsArg).filter((f) => f.startsWith("results-") && f.endsWith(".json"));
let moved = 0, missing = 0, dup = 0;

for (const f of files) {
  const data = JSON.parse(readFileSync(join(resultsArg, f), "utf8"));
  for (const r of (data.responses || [])) {
    const src = r.output_url || r.local_path;
    const meta = r._meta;
    if (!src || !meta?.out) { missing++; continue; }
    const dst = join(audioArg, meta.out.replace(/^audio[\\/]/, ""));
    mkdirSync(dirname(dst), { recursive: true });
    if (!existsSync(src)) { console.warn(`MISSING src: ${src}`); missing++; continue; }
    if (existsSync(dst) && statSync(dst).size > 1024) { dup++; continue; }
    try { renameSync(src, dst); moved++; }
    catch (e) { console.warn(`FAIL ${src} → ${dst}: ${e.message}`); missing++; }
  }
}
console.log(`Moved ${moved} | already-present ${dup} | missing ${missing}`);
console.log(`\nAhora corre: node scripts/generate-audio.mjs --clips (para regenerar manifests)`);
