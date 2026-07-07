/**
 * Markdown + HTML inline/bloques → HTML (marked GFM; fallback plaintext).
 * Convención compartida: markdown estándar, HTML semántico y {{variables}} (sugar en capas superiores).
 * CommonMark pasa HTML crudo; tablas GFM se preprocesan porque marked ≥9 no las incluye en el núcleo.
 * @module markdown
 */
import { ensureMarked } from "./lazy-assets.js";

let markedConfigured = false;

function configureMarked() {
  if (markedConfigured || typeof window.marked?.use !== "function") return;
  window.marked.use({
    gfm: true,
    breaks: false,
    pedantic: false,
  });
  const ext = globalThis["extended-tables"];
  if (typeof ext === "function") {
    try {
      window.marked.use(ext());
    } catch { /* ignore */ }
  }
  markedConfigured = true;
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseTableRow(line) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed.startsWith("|")) return null;
  let inner = trimmed;
  if (inner.endsWith("|")) inner = inner.slice(0, -1);
  inner = inner.slice(1);
  return inner.split("|").map((c) => c.trim());
}

function isSeparatorRow(cells) {
  return Array.isArray(cells) && cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function cellAlignStyle(sepCell) {
  const c = String(sepCell ?? "");
  const left = c.startsWith(":");
  const right = c.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return "left";
}

function renderTableCell(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return "";
  try {
    if (typeof window.marked?.parseInline === "function") {
      configureMarked();
      return window.marked.parseInline(raw, { gfm: true, breaks: false });
    }
  } catch { /* ignore */ }
  return escHtml(raw);
}

function gfmTableBlockToHtml(lines) {
  const header = parseTableRow(lines[0]);
  const sep = parseTableRow(lines[1]);
  if (!header || !sep || !isSeparatorRow(sep)) return lines.join("\n");

  const aligns = sep.map(cellAlignStyle);
  let html = "<table><thead><tr>";
  header.forEach((cell, i) => {
    const align = aligns[i] || "left";
    html += `<th style="text-align:${align}">${renderTableCell(cell)}</th>`;
  });
  html += "</tr></thead><tbody>";
  for (let r = 2; r < lines.length; r += 1) {
    const row = parseTableRow(lines[r]);
    if (!row) break;
    html += "<tr>";
    row.forEach((cell, i) => {
      const align = aligns[i] || "left";
      html += `<td style="text-align:${align}">${renderTableCell(cell)}</td>`;
    });
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}

/**
 * Convierte bloques de tabla GFM (`| col |` + `|---|---|`) a HTML antes de marked.
 * @param {string} src
 * @returns {string}
 */
export function preprocessGfmTables(src) {
  const lines = String(src ?? "").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*\|/.test(lines[i])) {
      const block = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        block.push(lines[i]);
        i += 1;
      }
      const sep = parseTableRow(block[1]);
      if (block.length >= 2 && isSeparatorRow(sep)) {
        out.push(gfmTableBlockToHtml(block));
      } else {
        out.push(...block);
      }
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join("\n");
}

function wrapTables(html) {
  return String(html)
    .replace(/<table(\s|>)/g, '<div class="md-table-wrap"><table$1')
    .replace(/<\/table>/g, "</table></div>");
}

function plaintextFallback(src) {
  return String(src)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
}

/**
 * @param {string} src
 * @returns {string}
 */
export function mdToHtml(src) {
  if (!src) return "";
  if (typeof window.marked === "undefined") {
    ensureMarked().catch(() => { /* fallback plaintext */ });
  }
  const prepared = preprocessGfmTables(String(src));
  try {
    if (typeof window.marked?.parse === "function") {
      configureMarked();
      const html = window.marked.parse(prepared, {
        async: false,
        gfm: true,
        breaks: false,
        pedantic: false,
      });
      return wrapTables(html);
    }
  } catch { /* ignore */ }
  return plaintextFallback(prepared);
}
