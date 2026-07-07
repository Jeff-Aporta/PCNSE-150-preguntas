/**
 * Carga diferida de scripts y hojas de estilo — compartido entre fronts ISA.
 * @module lazy-assets
 */
import { CDN_BASE, CODEMIRROR_CDN, MARKED_CDN_URL } from "../config/constants.js";
import { isaCssUrl } from "../config/cdn-assets.js";

const LAZY_CSS_ATTR = "data-isa-lazy-href";
const LAZY_SCRIPT_ATTR = "data-isa-lazy-src";
const LAZY_SCRIPT_READY = "data-isa-lazy-ready";

const CM_STYLES = [
  isaCssUrl("code-mirror.css"),
  CODEMIRROR_CDN + "/codemirror.min.css",
  CODEMIRROR_CDN + "/theme/dracula.min.css",
  CODEMIRROR_CDN + "/addon/fold/foldgutter.min.css",
];

const CM_SCRIPTS_BASE = [
  CODEMIRROR_CDN + "/codemirror.min.js",
  CODEMIRROR_CDN + "/mode/javascript/javascript.min.js",
  CODEMIRROR_CDN + "/addon/fold/foldcode.min.js",
  CODEMIRROR_CDN + "/addon/fold/foldgutter.min.js",
  CODEMIRROR_CDN + "/addon/fold/brace-fold.min.js",
];

const CM_SCRIPT_SQL = CODEMIRROR_CDN + "/mode/sql/sql.min.js";

/**
 * Inyecta una hoja de estilo una sola vez (dedupe por href).
 * @param {string} href
 * @returns {Promise<void>}
 */
export function ensureLazyStylesheet(href) {
  const url = String(href || "").trim();
  if (!url) return Promise.resolve();
  const sel = `link[${LAZY_CSS_ATTR}="${url}"]`;
  if (document.querySelector(sel)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute(LAZY_CSS_ATTR, url);
    link.onload = () => resolve();
    link.onerror = () => reject(new Error("CSS no cargó: " + url));
    document.head.appendChild(link);
  });
}

/**
 * Carga un script clásico (dedupe por src; encadena si ya está en vuelo).
 * @param {string} src
 * @returns {Promise<void>}
 */
export function loadLazyScript(src) {
  const url = String(src || "").trim();
  if (!url) return Promise.resolve();
  const sel = `script[${LAZY_SCRIPT_ATTR}="${url}"]`;
  const existing = document.querySelector(sel);
  if (existing) {
    return existing.getAttribute(LAZY_SCRIPT_READY) === "1"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Script no cargó: " + url)), { once: true });
        });
  }

  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = url;
    el.async = false;
    el.setAttribute(LAZY_SCRIPT_ATTR, url);
    el.onload = () => {
      el.setAttribute(LAZY_SCRIPT_READY, "1");
      resolve();
    };
    el.onerror = () => reject(new Error("Script no cargó: " + url));
    document.head.appendChild(el);
  });
}

/**
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
export async function loadLazyScriptsSequential(urls) {
  for (const src of urls) await loadLazyScript(src);
}

let cmLoad = null;

/**
 * CodeMirror 5 + modo JS + addons fold (orden fijo).
 * @param {{ sql?: boolean }} [opts] — incluir modo SQL (p. ej. jagudeloe).
 * @returns {Promise<void>}
 */
export function ensureCodeMirrorLoaded(opts = {}) {
  if (typeof window.CodeMirror !== "undefined") return Promise.resolve();
  if (cmLoad) return cmLoad;

  const scripts = opts.sql
    ? [CM_SCRIPTS_BASE[0], CM_SCRIPT_SQL, ...CM_SCRIPTS_BASE.slice(1)]
    : CM_SCRIPTS_BASE.slice();

  cmLoad = (async () => {
    await Promise.all(CM_STYLES.map(ensureLazyStylesheet));
    await loadLazyScriptsSequential(scripts);
    if (typeof window.CodeMirror === "undefined") {
      throw new Error("CodeMirror no quedó disponible tras la carga lazy");
    }
  })().catch((err) => {
    cmLoad = null;
    throw err;
  });

  return cmLoad;
}

let markedLoad = null;

/** Carga marked desde CDN (una vez). */
export function ensureMarked() {
  if (typeof window.marked !== "undefined") return Promise.resolve();
  if (markedLoad) return markedLoad;

  markedLoad = loadLazyScript(MARKED_CDN_URL).catch((err) => {
    markedLoad = null;
    throw err;
  });
  return markedLoad;
}

/** Solo CSS compartido ISA + CDN de CodeMirror (sin scripts). */
export function ensureCodeMirrorStyles() {
  return Promise.all(CM_STYLES.map(ensureLazyStylesheet));
}
