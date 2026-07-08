/**
 * William Quest — Boot Loader (minimal)
 *
 * 1) Cargar React+MUI via importmap (stack.mjs)
 * 2) Cargar vendor william-shared pre-construido
 * 3) Cargar app bundle pre-construido
 *
 * No usa Babel runtime. Todo está pre-compilado con esbuild en build time.
 *
 * Rutas relativas a import.meta.url para que funcione bajo cualquier
 * prefijo del servidor estático (Live Server, gh-pages, etc.).
 */
const BOOT_DIR = new URL(".", import.meta.url); // _dist/js/boot/
const ROOT = new URL("../../../", BOOT_DIR);     // raíz del proyecto (william_quest/)
                                              //   _dist/js/boot/  -> _dist/js/  -> _dist/  -> william_quest/

async function main() {
  try {
    // 1) Stack React + MUI + Emotion via importmap
    const stackUrl = new URL("./vendor/front-shared/stack.mjs", ROOT).href;
    const stackMod = await import(stackUrl);
    await stackMod.stackReady;
    if (!globalThis.React?.createElement || !globalThis.MaterialUI?.createTheme) {
      throw new Error("Stack React/MUI no quedó inicializado");
    }

    // 2) Vendor william-front (tema + UI + Icon)
    await runBundle(new URL("./_dist/js/william-front.bundle.js", ROOT).href);

    // 3) AppShell (layout)
    await runBundle(new URL("./_dist/js/app-shell.bundle.js", ROOT).href);

    if (!window.WilliamFront?.registerApp) {
      throw new Error("WilliamFront no se cargó correctamente");
    }
    window.WilliamFront.registerApp("WILLIAM");
    if (window.WilliamFront.Layout?.AppShell) {
      window.AppShell = window.WilliamFront.Layout.AppShell;
    }

    // 4) App principal
    await runBundle(new URL("./_dist/js/app.bundle.js", ROOT).href);

    console.log("[WilliamQuest] boot complete");
  } catch (err) {
    showBootError(err instanceof Error ? err.stack || err.message : String(err));
  }
}

async function runBundle(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar " + url + " (" + res.status + ")");
  const src = await res.text();
  // IIFE bundles: eval síncrono (AGENTS.md). Los <script> inline no disparan
  // onload → el await anterior colgaba tras el 1er bundle y la app quedaba
  // en "Cargando simulador PCNSE…" para siempre.
  // eslint-disable-next-line no-eval
  (0, eval)(src);
}

function showBootError(msg) {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      '<pre style="color:#ff8a80;padding:24px;font-family:monospace;white-space:pre-wrap">Error de arranque:\n' +
      msg +
      "</pre>";
  }
  console.error(msg);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}