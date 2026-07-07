/**
 * Init síncrono del tema — cargar desde index.html justo después de JeffAppMeta.apply.
 * Usa la misma theme.lsKey que ISAFront.registerApp (via JeffAppMeta.cfg).
 */
(function (global) {
  "use strict";

  function resolveThemeKey() {
    const doc = global.document;
    const fromMeta = doc?.querySelector('meta[name="app-theme-ls-key"]')?.getAttribute("content");
    if (fromMeta) return String(fromMeta).trim();
    const cfg = global.AppMeta?.cfg;
    if (cfg?.theme?.lsKey) return String(cfg.theme.lsKey);
    if (cfg?.themeLsKey) return String(cfg.themeLsKey);
    return "app:theme";
  }

  function readMode(key) {
    let mode = "dark";
    try {
      const v = global.localStorage.getItem(key);
      if (v === "light" || v === "dark") mode = v;
    } catch {
      /* ignore */
    }
    return mode;
  }

  function applyMode(mode) {
    const doc = global.document;
    if (!doc) return;
    doc.documentElement.setAttribute("data-mui-color-scheme", mode);
    doc.documentElement.style.colorScheme = mode;
  }

  const lsKey = resolveThemeKey();
  applyMode(readMode(lsKey));

  global.ThemeInit = { lsKey, readMode, applyMode };
})(typeof window !== "undefined" ? window : globalThis);
