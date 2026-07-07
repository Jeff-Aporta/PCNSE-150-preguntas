/** Reset de estado al pulsar marca (logo + nombre) en AppShell. */
export const BRAND_HOME_EVENT = "isa:brand-home";

/** @typedef {{ param?: string, reset: () => unknown }} BrandHomeHandler */

function handlers() {
  if (typeof window === "undefined") return /** @type {BrandHomeHandler[]} */ ([]);
  window.ISAFront = window.ISAFront || {};
  window.ISAFront._brandHomeHandlers = window.ISAFront._brandHomeHandlers || [];
  return window.ISAFront._brandHomeHandlers;
}

/** @param {BrandHomeHandler} entry */
export function registerBrandHomeHandler(entry) {
  handlers().push(entry);
}

/** Reinicia estados ?s= registrados, limpia la URL y notifica a la app. */
export function goBrandHome() {
  if (typeof window === "undefined") return;
  const list = handlers();
  list.forEach((h) => {
    try { h.reset(); } catch (e) { console.warn("goBrandHome reset", e); }
  });
  try {
    const url = new URL(location.href);
    let changed = false;
    list.forEach((h) => {
      if (h.param && url.searchParams.has(h.param)) {
        url.searchParams.delete(h.param);
        changed = true;
      }
    });
    if (changed) history.replaceState(null, "", url);
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(BRAND_HOME_EVENT, { bubbles: true }));
}
