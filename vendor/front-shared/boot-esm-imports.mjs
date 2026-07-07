/**
 * Bare imports para blobs Babel — shims locales apuntan a window.React/MUI (stack.mjs).
 * Evita duplicar React (esm.sh absoluto vs import map → hooks #321 / render #130).
 */

/** @param {string} cdnBase …/front-shared@ref/cdn/ */
export async function loadVersions(cdnBase) {
  const base = String(cdnBase || "").replace(/\/?$/, "/");
  const res = await fetch(base + "versions.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar versions.json (" + res.status + ")");
  return res.json();
}

/** @param {Record<string, string>} _v @param {string} cdnBase */
export function buildBareImports(_v, cdnBase) {
  const base = String(cdnBase || "").replace(/\/?$/, "/");
  return {
    react: base + "react-shim.mjs",
    "react-dom": base + "react-shim.mjs",
    "react-dom/client": base + "react-dom-client-shim.mjs",
    "react/jsx-runtime": base + "react-shim.mjs",
    "@emotion/react": "@emotion/react",
    "@emotion/styled": "@emotion/styled",
    "@mui/material": "@mui/material",
  };
}

/** @param {string} spec @param {Record<string, string>} _v */
export function resolveMuiSubimport(spec, _v) {
  if (!spec.startsWith("@mui/material/")) return null;
  return spec;
}
