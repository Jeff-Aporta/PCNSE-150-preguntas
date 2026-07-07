import { MAIN_ORCHESTRATOR_LS_KEY } from "../config/constants.js";

/** Claves localStorage legacy → gateway:local */
export const GATEWAY_LEGACY_LS_KEYS = {
  "jeff:gateway-local": "",
  "patyia-apptools:gateway-local": "",
  "patyia-apptools:lab-local": "",
};

/**
 * Migra preferencia Local/Prod desde claves legacy hacia gateway:local.
 * @param {Record<string, string>} legacyKeys claves a revisar (valores ignorados)
 * @param {string} [targetKey] clave destino (default gateway:local)
 */
export function migrateLegacyGatewayKeys(legacyKeys = GATEWAY_LEGACY_LS_KEYS, targetKey = MAIN_ORCHESTRATOR_LS_KEY) {
  try {
    const host = globalThis.location?.hostname || "";
    const isDev = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    const hasTarget = localStorage.getItem(targetKey) != null;
    let legacy = null;
    for (const key of Object.keys(legacyKeys)) {
      const v = localStorage.getItem(key);
      if (v != null) {
        legacy = v;
        break;
      }
    }
    if (!hasTarget && legacy != null) {
      localStorage.setItem(targetKey, legacy === "1" ? "1" : "0");
      for (const key of Object.keys(legacyKeys)) localStorage.removeItem(key);
    } else if (isDev && !hasTarget && legacy == null) {
      localStorage.setItem(targetKey, "1");
    }
  } catch {
    /* ignore */
  }
}
