import { cdnAsset } from "./boot-resolver.mjs";
import { showBootErr } from "./boot-loader.mjs";

/**
 * @param {{ files: string[], localFs?: string, Babel?: unknown }} config
 */
export function bootEvalApp(config) {
  globalThis.__APP_BOOT__ = config;
  const local = new URL("./boot-eval-loader.mjs", import.meta.url).href;
  const cdn = cdnAsset("boot-eval-loader.mjs");
  return import(local).catch(() => import(cdn)).catch(showBootErr);
}
