/**
 * Loader compartido para apps eval (system-login, conversations, …).
 * Config: globalThis.__APP_BOOT__ = { files: string[], localFs?, Babel? }
 */
import { startEvalApp, showBootErr } from "./boot-loader.mjs";

function readBootConfig() {
  if (globalThis.__APP_BOOT__?.files?.length) return globalThis.__APP_BOOT__;
  const el = document.getElementById("app-boot");
  if (el?.textContent) {
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      throw new Error("JSON inválido en #app-boot: " + (e instanceof Error ? e.message : e));
    }
  }
  return null;
}

const cfg = readBootConfig();
if (!cfg?.files?.length) {
  showBootErr(new Error("Falta config de arranque: __APP_BOOT__.files o #app-boot"));
} else {
  startEvalApp(cfg.files, cfg).catch(showBootErr);
}
