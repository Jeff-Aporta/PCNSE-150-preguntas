/** Factory API local/online — URL desde constants.js (main-orchestrator). */
import {
  MAIN_ORCHESTRATOR_EVENT,
  MAIN_ORCHESTRATOR_LS_KEY,
  MAIN_ORCHESTRATOR_URL_LOCAL,
  MAIN_ORCHESTRATOR_URL_PROD,
} from "./constants.js";

/**
 * Primera visita en localhost → orquestador local por defecto.
 * Si ya hay preferencia ("0" o "1"), no se sobrescribe (persiste tras F5).
 */
export function initGatewayPreference(opts = {}) {
  const lsKey = opts.lsKey || MAIN_ORCHESTRATOR_LS_KEY;
  try {
    if (localStorage.getItem(lsKey) != null) return;
  } catch {
    return;
  }
  const host = globalThis.location?.hostname || "";
  const isDev = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  if (!isDev) return;
  try {
    localStorage.setItem(lsKey, "1");
  } catch {
    /* ignore */
  }
}

export function createApiConfig(opts = {}) {
  const local = opts.local || MAIN_ORCHESTRATOR_URL_LOCAL;
  const online = opts.online || MAIN_ORCHESTRATOR_URL_PROD;
  const lsKey = opts.lsKey || MAIN_ORCHESTRATOR_LS_KEY;
  const evt = opts.event || opts.evt || MAIN_ORCHESTRATOR_EVENT;

  function isLocal() {
    try {
      return localStorage.getItem(lsKey) === "1";
    } catch (e) {
      return false;
    }
  }

  function setLocal(on) {
    try {
      localStorage.setItem(lsKey, on ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
    window.dispatchEvent(new Event(evt));
  }

  function base() {
    return (isLocal() ? local : online).replace(/\/$/, "");
  }

  function apiUrl(path) {
    return base() + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function label() {
    return isLocal() ? "Local" : "Producción";
  }

  /** Texto auxiliar para errores de conexión (sin nombres de servicio). */
  function connectionHint() {
    return isLocal() ? " Comprueba que el entorno local esté activo." : "";
  }

  return { isLocal, setLocal, base, apiUrl, label, connectionHint, EVENT: evt, ONLINE: online, LOCAL: local, lsKey };
}

export function registerConfig(ns, opts) {
  initGatewayPreference(opts);
  window[ns] = window[ns] || {};
  window[ns].Config = createApiConfig(opts);
}
