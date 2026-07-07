/**
 * Resolución de URLs CDN — fuente (dev) vs _dist minificado (producción jsDelivr).
 * @module cdn-assets
 */
import { FRONT_SHARED_REF } from "./constants.js";

const JSDELIVR_CDN = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + FRONT_SHARED_REF + "/cdn";

/** Raíz `cdn/` sin barra final (local Live Server). */
export function resolveCdnRoot() {
  try {
    const meta = new URL(import.meta.url);
    if (
      meta.protocol === "file:"
      && typeof location !== "undefined"
      && /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname)
    ) {
      return new URL("../../../../", meta).href.replace(/\/?$/, "");
    }
  } catch (_) { /* ignore */ }
  return JSDELIVR_CDN;
}

/** `true` → artefactos en cdn/_dist/ (minificados). Fuente solo con `__ISA_CDN_SRC__`. */
export function useCdnDist() {
  if (typeof globalThis !== "undefined" && globalThis.__ISA_CDN_SRC__) return false;
  return true;
}

export const CDN_ROOT = resolveCdnRoot();
export const CDN_DIST_ROOT = CDN_ROOT + "/_dist";
export const CDN_ISA_ROOT = CDN_ROOT + "/isa";
export const CDN_DIST_ISA = CDN_DIST_ROOT + "/isa";

function distCss(rel) {
  return CDN_DIST_ISA + "/css/" + rel.replace(/\.css$/i, "") + ".min.css";
}

function distJs(rel) {
  return CDN_DIST_ISA + "/js/" + rel.replace(/\.js$/i, "") + ".min.js";
}

/** URL CSS ISA — `rel` p. ej. `base.css`, `kits/neon-glass/neon-glass.css`. */
export function isaCssUrl(rel) {
  const path = String(rel || "").replace(/^\//, "");
  if (useCdnDist()) {
    if (path.includes("kits/")) {
      const kit = path.match(/kits\/([^/]+)/)?.[1];
      if (kit) return distCss("kits/" + kit);
    }
    const base = path.replace(/^css\//, "").replace(/\.css$/i, "");
    return distCss(base);
  }
  return CDN_ISA_ROOT + "/css/" + path.replace(/^css\//, "");
}

/** URL JS ISA — `rel` p. ej. `js/index.js`, `index.js`. */
export function isaJsUrl(rel) {
  const path = String(rel || "").replace(/^\//, "").replace(/^isa\/js\//, "");
  if (useCdnDist()) return distJs(path);
  return CDN_ISA_ROOT + "/js/" + path;
}

/** CSS de kit look & feel (un archivo por kit). */
export function kitCssUrl(kitId) {
  return isaCssUrl("kits/" + kitId + "/neon-glass.css");
}

/** Chunk JS lazy del kit (solo en _dist). */
export function kitJsUrl(kitId) {
  if (useCdnDist()) return distJs("kits/" + kitId);
  return CDN_ISA_ROOT + "/js/ui/kits/" + kitId + "/lazy-entry.js";
}

/** Punto de entrada ISAFront. */
export function isaIndexUrl() {
  return isaJsUrl("index.js");
}
