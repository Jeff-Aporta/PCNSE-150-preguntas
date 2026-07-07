/**
 * Grafo ESM runtime — TS/JSX vía Babel standalone + blob URLs.
 * Bare imports resueltos con versions.json (mismo pin que stack.mjs / import map).
 */
import { buildBareImports, loadVersions, resolveMuiSubimport } from "./boot-esm-imports.mjs";

const blobUrls = new Map();
let cdnBase = "";
let versionsPromise = null;

export function initModuleGraph(base) {
  cdnBase = String(base || "").replace(/\/?$/, "/");
  versionsPromise = null;
}

async function getVersions() {
  if (!cdnBase) throw new Error("initModuleGraph(cdnBase) antes de importAppEntry");
  if (!versionsPromise) versionsPromise = loadVersions(cdnBase);
  return versionsPromise;
}

export function resolvePath(fromFile, spec) {
  if (!spec.startsWith(".")) return spec;
  const base = fromFile.includes("/") ? fromFile.replace(/\/[^/]*$/, "/") : "";
  const merged = (base + spec).split("/");
  const out = [];
  for (const part of merged) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

export function babelPresets(file) {
  const reactClassic = ["react", { runtime: "classic" }];
  if (file.endsWith(".jsx")) return [reactClassic];
  if (file.endsWith(".tsx")) return ["typescript", reactClassic];
  if (file.endsWith(".ts")) return ["typescript"];
  return ["typescript"];
}

export function parseImports(source) {
  const specs = new Set();
  const re = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source))) specs.add(m[1] || m[2]);
  return [...specs];
}

export function rewriteImports(source, urlMap) {
  let out = source;
  for (const [spec, url] of urlMap) {
    const esc = spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(`(\\bfrom\\s*|\\bimport\\s*)(['"])${esc}\\2`, "g"),
      `$1$2${url}$2`,
    );
  }
  return out;
}

async function resolveSpecifier(spec, fromFile, Babel, compiling, bareImports, versions) {
  if (spec.startsWith(".")) {
    const dep = resolvePath(fromFile, spec);
    return compileModule(dep, Babel, compiling, bareImports, versions);
  }
  if (bareImports[spec]) return bareImports[spec];
  const mui = resolveMuiSubimport(spec, versions);
  if (mui) return mui;
  return spec;
}

async function compileModule(file, Babel, compiling, bareImports, versions) {
  if (blobUrls.has(file)) return blobUrls.get(file);
  if (compiling.has(file)) throw new Error("Dependencia circular: " + file);
  compiling.add(file);

  const res = await fetch(file, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar " + file + " (" + res.status + ")");
  let source = await res.text();

  const urlMap = new Map();
  for (const spec of parseImports(source)) {
    const resolved = await resolveSpecifier(spec, file, Babel, compiling, bareImports, versions);
    urlMap.set(spec, resolved);
  }

  source = rewriteImports(source, urlMap);
  const code = Babel.transform(source, {
    presets: babelPresets(file),
    sourceType: "module",
    filename: file,
  }).code;

  const blob = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  blobUrls.set(file, blob);
  compiling.delete(file);
  return blob;
}

/** @param {string} entry @param {unknown} Babel */
export async function importAppEntry(entry, Babel) {
  if (!Babel?.transform) throw new Error("Babel standalone no cargó");
  const versions = await getVersions();
  const bareImports = buildBareImports(versions, cdnBase);
  blobUrls.clear();
  const url = await compileModule(entry, Babel, new Set(), bareImports, versions);
  return import(url);
}

/** Importa en orden (side effects + entry). Un solo grafo blob. */
export async function importAppModules(entries, Babel) {
  if (!Babel?.transform) throw new Error("Babel standalone no cargó");
  const versions = await getVersions();
  const bareImports = buildBareImports(versions);
  blobUrls.clear();
  const compiling = new Set();
  let lastMod;
  for (const entry of entries) {
    const url = await compileModule(entry, Babel, compiling, bareImports, versions);
    lastMod = await import(url);
  }
  return lastMod;
}
