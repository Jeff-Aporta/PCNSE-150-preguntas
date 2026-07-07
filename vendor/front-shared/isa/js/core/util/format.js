/** Fecha/hora → texto en locale y zona horaria del navegador. */

const CONTAPYME_EMAIL_SUFFIX = /@contapyme\.com$/i;

export const CONTAPYME_LOGIN_DOMAIN = "@contapyme.com";

/** Login ContaPyme: minúsculas; añade @contapyme.com si falta el dominio. */
export function normalizeContapymeLoginId(value) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (s.includes("@")) return s.toLowerCase();
  return `${s.toLowerCase()}${CONTAPYME_LOGIN_DOMAIN}`;
}

function titleCaseWord(word) {
  const s = String(word || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Quita el dominio corporativo (jagudeloe@contapyme.com → jagudeloe). */
export function stripContapymeEmail(value) {
  return String(value ?? "").trim().replace(CONTAPYME_EMAIL_SUFFIX, "");
}

/** Valor visible en el campo Usuario tras blur (minúsculas, sin @contapyme.com). */
export function formatContapymeLoginInput(value) {
  const id = normalizeContapymeLoginId(value);
  if (!id) return "";
  return stripContapymeEmail(id) || id;
}

/** Nombre legible para tooltip/menú — sin mayúsculas sostenidas. */
export function formatSessionDisplayName(value) {
  const cleaned = stripContapymeEmail(value);
  const raw = cleaned || String(value ?? "").trim();
  if (!raw) return "";
  if (/\s/.test(raw)) return raw.split(/\s+/).filter(Boolean).map(titleCaseWord).join(" ");
  return titleCaseWord(raw);
}

/** Etiqueta compacta del chip de sesión — solo primer nombre. */
export function formatSessionChipLabel(value, fallback = "Usuario") {
  const display = formatSessionDisplayName(value);
  if (!display) return fallback;
  return display.split(/\s+/).filter(Boolean)[0] || fallback;
}

/** Etiqueta del header de sesión: displayName si existe; si no, chipLabel del login id. */
export function resolveSessionHeaderLabel(displayName, username, fallback = "Usuario") {
  const dn = String(displayName ?? "").trim();
  if (dn) return formatSessionChipLabel(dn, fallback);
  return formatSessionChipLabel(username, fallback);
}

function parseInput(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO / timestamp → «10 jun 2026, 10:37:59» (hora local). */
export function formatLocalDateTime(value) {
  const d = parseInput(value);
  if (!d) return value == null ? "" : String(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Fecha (sin hora) → «10 jun 2026». */
export function formatLocalDate(value) {
  const d = parseInput(value);
  if (!d) return value == null ? "" : String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
