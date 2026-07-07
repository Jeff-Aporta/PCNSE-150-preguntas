/**
 * API mínima para loaders de cada app — delega en boot-helper + boot-module-graph.
 */
import { importBootHelper } from "./boot-resolver.mjs";

export { FRONT_SHARED_REF, cdnAsset, importBootHelper, importBootLoader, isDevHost } from "./boot-resolver.mjs";

export function getBabel() {
  const Babel = globalThis.Babel;
  if (!Babel?.transform) throw new Error("Babel standalone no cargó — revisa @babel/standalone en index.html");
  return Babel;
}

export function showBootErr(err) {
  const root = document.getElementById("root");
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  if (root) {
    root.innerHTML = '<pre style="color:#ff8a80;padding:24px;font-family:monospace">Error de arranque:\n' + msg + "</pre>";
  }
  console.error(err);
}

export function mountBoot(bootFn) {
  const run = () => bootFn().catch(showBootErr);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
}

/**
 * Apps con grafo ESM (Paty ISA, jagudeloe).
 * @param {{ localFs?: string, transpile?: string[], modules?: string[], entry?: string, Babel?: unknown }} opts
 */
export async function runIsaBoot(opts) {
  const Babel = opts.Babel || getBabel();
  const helper = await importBootHelper(opts.localFs);
  const graph = await helper.importShared("boot-module-graph.mjs");
  const { importShared, assertStack, loadIsaFront, loadSharedUi, transpileFiles } = helper;

  const stackMod = await importShared("stack.mjs");
  await stackMod.stackReady;
  assertStack();
  await loadIsaFront();
  await loadSharedUi(Babel);
  if (opts.transpile?.length) await transpileFiles(opts.transpile, Babel);

  const chain = [...(opts.modules || [])];
  if (opts.entry) chain.push(opts.entry);
  if (!chain.length) return;
  if (chain.length === 1) return graph.importAppEntry(chain[0], Babel);
  return graph.importAppModules(chain, Babel);
}

/**
 * Apps simples — eval clásico (system-login, conversations, …).
 * @param {{ localFs?: string, files: string[], Babel?: unknown }} opts
 */
export async function runEvalBoot(opts) {
  const helper = await importBootHelper(opts.localFs);
  await helper.bootApp({ files: opts.files, Babel: opts.Babel || getBabel() });
}
