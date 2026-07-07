/**
 * Carga lazy de assets por kit visual (CSS + JS opcional).
 */
import { kitCssUrl, kitJsUrl } from "../../core/config/cdn-assets.js";
import { ensureLazyStylesheet } from "../../core/util/lazy-assets.js";

const kitCssLoads = new Map();
const kitJsLoads = new Map();

/** Inyecta el CSS del kit una sola vez. */
export function ensureKitCss(kitId) {
  const id = String(kitId || "").trim();
  if (!id) return Promise.resolve();
  if (kitCssLoads.has(id)) return kitCssLoads.get(id);
  const p = ensureLazyStylesheet(kitCssUrl(id)).catch((err) => {
    kitCssLoads.delete(id);
    throw err;
  });
  kitCssLoads.set(id, p);
  return p;
}

/** Import dinámico del chunk JS del kit (_dist) o lazy-entry (dev). */
export function loadKitModule(kitId) {
  const id = String(kitId || "").trim();
  if (!id) return Promise.reject(new Error("kitId requerido"));
  if (kitJsLoads.has(id)) return kitJsLoads.get(id);
  const url = kitJsUrl(id);
  const p = import(/* @vite-ignore */ url).catch((err) => {
    kitJsLoads.delete(id);
    throw err;
  });
  kitJsLoads.set(id, p);
  return p;
}
