/**
 * William Quest — Boot Loader (minimal)
 *
 * 1) Cargar React+MUI via importmap (stack.mjs)
 * 2) Cargar vendor william-shared pre-construido
 * 3) Cargar app bundle pre-construido
 *
 * No usa Babel runtime. Todo está pre-compilado con esbuild en build time.
 */
const FRONT_SHARED_BASE = "/vendor/front-shared/";

async function main() {
  try {
    // 1) Stack React + MUI + Emotion via importmap
    const stackMod = await import(FRONT_SHARED_BASE + "stack.mjs");
    await stackMod.stackReady;
    if (!globalThis.React?.createElement || !globalThis.MaterialUI?.createTheme) {
      throw new Error("Stack React/MUI no quedó inicializado");
    }

    // 2) Vendor william-front (tema + UI + Icon)
    await runBundle("/_dist/js/william-front.bundle.js");

    // 3) AppShell (layout)
    await runBundle("/_dist/js/app-shell.bundle.js");

    if (!window.WilliamFront?.registerApp) {
      throw new Error("WilliamFront no se cargó correctamente");
    }
    window.WilliamFront.registerApp("WILLIAM");
    if (window.WilliamFront.Layout?.AppShell) {
      window.AppShell = window.WilliamFront.Layout.AppShell;
    }

    // 4) App principal
    await runBundle("/_dist/js/app.bundle.js");

    console.log("[WilliamQuest] boot complete");
  } catch (err) {
    showBootError(err instanceof Error ? err.stack || err.message : String(err));
  }
}

async function runBundle(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar " + url + " (" + res.status + ")");
  const src = await res.text();
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