/**
 * scripts/build.mjs — Build all bundles via esbuild.
 *
 * Strategy: custom esbuild plugin "bare-to-window" replaces bare imports
 * (react, react-dom, @mui/material, @emotion/*) with virtual modules that
 * re-export from window.* (set up by stack.mjs + WilliamFront).
 */
import { build } from "esbuild";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Mapa: specifier → nombre del global en window
const BARE_TO_GLOBAL = {
  react: "React",
  "react/jsx-runtime": "React",
  "react-dom": "ReactDOM",
  "react-dom/client": "ReactDOM",
  "@emotion/react": "EmotionReact",
  "@emotion/styled": "EmotionStyled",
};

const MUI_SUBMODULES = [
  "@mui/material",
];

function buildShimContent(globalName) {
  // Exporta TODO lo que window[globalName] tiene como named exports
  // Más un default = window[globalName]
  return `
const G = window.${globalName};
if (!G) throw new Error("Build shim: window.${globalName} no está disponible. ¿stack.mjs cargó?");
module.exports = G;
module.exports.default = G;
module.exports.__esModule = true;
// Re-export de TODO lo que tenga window[globalName]
for (const key of Object.keys(G)) {
  module.exports[key] = G[key];
}
`;
}

function buildMuiShim() {
  // Para @mui/material, exporta TODO window.MaterialUI
  return `
const M = window.MaterialUI;
if (!M) throw new Error("Build shim: window.MaterialUI no está disponible");
module.exports = M;
module.exports.default = M;
module.exports.__esModule = true;
for (const key of Object.keys(M)) {
  module.exports[key] = M[key];
}
`;
}

function buildEmotionShim(which) {
  const g = which === "react" ? "EmotionReact" : "EmotionStyled";
  return `
const G = window.${g};
module.exports = G || {};
module.exports.default = G || {};
module.exports.__esModule = true;
if (G) for (const key of Object.keys(G)) module.exports[key] = G[key];
`;
}

function buildReactShim() {
  return `
const R = window.React;
if (!R) throw new Error("Build shim: window.React no está disponible");
module.exports = R;
module.exports.default = R;
module.exports.__esModule = true;
for (const key of Object.keys(R)) {
  module.exports[key] = R[key];
}
`;
}

const bareToWindowPlugin = {
  name: "bare-to-window",
  setup(build) {
    const filter = /^(@mui\/material|@mui\/material\/.*|react|react-dom|react-dom\/client|react\/jsx-runtime|@emotion\/(react|styled))$/;
    build.onResolve({ filter }, (args) => {
      return {
        path: args.path,
        namespace: "bare-to-window",
      };
    });
    build.onLoad({ filter: /.*/, namespace: "bare-to-window" }, (args) => {
      const path = args.path;
      if (path === "@mui/material" || path.startsWith("@mui/material/")) {
        return { contents: buildMuiShim(), loader: "js" };
      }
      if (path === "react" || path === "react/jsx-runtime") {
        return { contents: buildReactShim(), loader: "js" };
      }
      if (path === "react-dom" || path === "react-dom/client") {
        return { contents: buildShimContent("ReactDOM"), loader: "js" };
      }
      if (path === "@emotion/react") return { contents: buildEmotionShim("react"), loader: "js" };
      if (path === "@emotion/styled") return { contents: buildEmotionShim("styled"), loader: "js" };
      return { contents: "module.exports = {};", loader: "js" };
    });
  },
};

async function buildApp() {
  const out = resolve(ROOT, "_dist/js/app.bundle.js");
  mkdirSync(dirname(out), { recursive: true });
  await build({
    entryPoints: [resolve(ROOT, "_dist/js/app/main.tsx")],
    bundle: true,
    format: "iife",
    outfile: out,
    target: "es2020",
    minify: true,
    sourcemap: false,
    loader: { ".ts": "ts", ".tsx": "tsx", ".js": "js", ".jsx": "jsx" },
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: { "~william": resolve(ROOT, "vendor/william-shared") },
    plugins: [bareToWindowPlugin],
    banner: {
      js: `/* William Quest app bundle (built ${new Date().toISOString()}) */`,
    },
    logLevel: "info",
  });
  report(out);
}

async function buildWilliamFront() {
  const out = resolve(ROOT, "_dist/js/william-front.bundle.js");
  mkdirSync(dirname(out), { recursive: true });
  await build({
    entryPoints: [resolve(ROOT, "vendor/william-shared/william-front.js")],
    bundle: true,
    format: "iife",
    outfile: out,
    target: "es2020",
    minify: true,
    sourcemap: false,
    plugins: [bareToWindowPlugin],
    alias: { "~william": resolve(ROOT, "vendor/william-shared") },
    banner: { js: `/* William Quest: WilliamFront (built ${new Date().toISOString()}) */` },
    logLevel: "info",
  });
  report(out);
}

async function buildAppShell() {
  const out = resolve(ROOT, "_dist/js/app-shell.bundle.js");
  mkdirSync(dirname(out), { recursive: true });
  await build({
    entryPoints: [resolve(ROOT, "vendor/william-shared/app-shell.jsx")],
    bundle: true,
    format: "iife",
    outfile: out,
    target: "es2020",
    minify: true,
    sourcemap: false,
    plugins: [bareToWindowPlugin],
    alias: { "~william": resolve(ROOT, "vendor/william-shared") },
    banner: { js: `/* William Quest: AppShell (built ${new Date().toISOString()}) */` },
    logLevel: "info",
  });
  report(out);
}

function report(path) {
  const size = readFileSync(path).length;
  console.log(`  ${path.replace(ROOT + "\\", "")}  (${(size / 1024).toFixed(1)} KB)`);
}

(async () => {
  console.log("Building William Quest bundles...");
  try {
    await buildWilliamFront();
    await buildAppShell();
    await buildApp();
    console.log("✓ All bundles built.");
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
})();