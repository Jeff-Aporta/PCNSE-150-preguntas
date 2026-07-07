/**
 * Estado de navegación en ?s= (JSON → base64url). Factory por app.
 *
 * opts:
 *   param, debounceMs, maxValue, maxB64Len, historyKey
 *   initial() → estado por defecto
 *   normalize(raw, prev) → estado normalizado
 *   slimForUrl(state) → recorte antes de escribir URL
 *   onInit(state, api) → tras leer URL (p.ej. sync gateway)
 *   gatewayEvents[] + onGatewayChange(api) → reaccionar a cambio Local/Prod
 *   brandHomeReset(api) → reset personalizado al pulsar marca en AppShell
 */
import { registerBrandHomeHandler } from "./brand-home.js";

export { goBrandHome, BRAND_HOME_EVENT, registerBrandHomeHandler } from "./brand-home.js";

export function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function b64urlDecode(str) {
  let b = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return decodeURIComponent(escape(atob(b)));
}

function slimByMaxValue(state, maxValue) {
  const out = {};
  Object.keys(state || {}).forEach((k) => {
    const v = state[k];
    if (v == null) return;
    if (typeof v === "string") {
      if (v.length <= maxValue) out[k] = v;
    } else if (typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (typeof v === "object" && JSON.stringify(v).length <= maxValue) {
      out[k] = v;
    }
  });
  return out;
}

export function createUrlState(opts = {}) {
  const PARAM = opts.param || "s";
  const debounceMs = opts.debounceMs ?? 300;
  const maxValue = opts.maxValue;
  const maxB64Len = opts.maxB64Len;
  const historyKey = opts.historyKey ?? null;

  let state = typeof opts.initial === "function" ? opts.initial() : {};
  /** @type {Array<(s: object) => void>} */
  let listeners = [];
  let writeTimer = null;

  function getSnapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  function slim(stateIn) {
    if (typeof opts.slimForUrl === "function") return opts.slimForUrl(stateIn);
    if (maxValue) return slimByMaxValue(stateIn, maxValue);
    return stateIn;
  }

  function normalize(raw) {
    if (typeof opts.normalize === "function") return opts.normalize(raw, state);
    return raw && typeof raw === "object" ? raw : state;
  }

  function readUrl() {
    const raw = new URLSearchParams(location.search).get(PARAM);
    if (!raw) return null;
    try {
      return JSON.parse(b64urlDecode(raw));
    } catch {
      return null;
    }
  }

  function updateUrl() {
    try {
      let payload = state;
      if (maxB64Len) {
        let enc = b64urlEncode(JSON.stringify(payload));
        if (enc.length > maxB64Len) {
          payload = slim(payload);
          enc = b64urlEncode(JSON.stringify(payload));
        }
        if (enc.length > maxB64Len) return;
      }
      const slimmed = slim(payload);
      const json = JSON.stringify(slimmed);
      const url = new URL(location.href);
      if (json === "{}") url.searchParams.delete(PARAM);
      else url.searchParams.set(PARAM, b64urlEncode(json));
      history.replaceState(historyKey ? { [historyKey]: true } : null, "", url);
    } catch (e) {
      console.warn("urlState: no se pudo escribir ?" + PARAM + "=", e);
    }
  }

  function scheduleWrite() {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(updateUrl, debounceMs);
  }

  function notify() {
    listeners.forEach((fn) => {
      try { fn(getSnapshot()); } catch { /* ignore */ }
    });
  }

  function merge(partial) {
    if (!partial || typeof partial !== "object") return getSnapshot();
    if (typeof opts.merge === "function") {
      state = opts.merge(state, partial);
    } else if (maxValue) {
      state = slimByMaxValue({ ...state, ...partial }, maxValue);
    } else {
      state = { ...state, ...partial };
    }
    notify();
    scheduleWrite();
    return getSnapshot();
  }

  function hrefFor(partial) {
    let next = getSnapshot();
    if (partial && typeof partial === "object") {
      if (typeof opts.merge === "function") {
        next = opts.merge(next, partial);
      } else if (maxValue) {
        next = slimByMaxValue({ ...next, ...partial }, maxValue);
      } else {
        next = { ...next, ...partial };
      }
    }
    try {
      const slimmed = slim(next);
      const json = JSON.stringify(slimmed);
      const url = new URL(location.href);
      if (json === "{}") url.searchParams.delete(PARAM);
      else url.searchParams.set(PARAM, b64urlEncode(json));
      return url.href;
    } catch {
      return location.href;
    }
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter((f) => f !== fn); };
  }

  function reset() {
    state = typeof opts.initial === "function" ? opts.initial() : {};
    notify();
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = null;
    updateUrl();
    return getSnapshot();
  }

  const api = {
    PARAM,
    MAX_VALUE: maxValue,
    get: getSnapshot,
    getSnapshot,
    merge,
    mergePartial: merge,
    hrefFor,
    reset,
    subscribe,
  };

  function init() {
    try {
      const raw = readUrl();
      if (raw) state = normalize(raw);
    } catch (e) {
      console.warn("urlState: ?" + PARAM + "= inválido", e);
    }
    if (typeof opts.onInit === "function") opts.onInit(state, api);
    const gwEvents = opts.gatewayEvents;
    if (Array.isArray(gwEvents) && typeof opts.onGatewayChange === "function") {
      const onGw = () => opts.onGatewayChange(state, api);
      gwEvents.forEach((ev) => window.addEventListener(ev, onGw));
    }
    window.addEventListener("popstate", () => {
      const raw = readUrl();
      state = raw ? normalize(raw) : (typeof opts.initial === "function" ? opts.initial() : {});
      notify();
    });
    return getSnapshot();
  }

  api.boot = init();

  registerBrandHomeHandler({
    param: PARAM,
    reset:
      typeof opts.brandHomeReset === "function"
        ? () => opts.brandHomeReset(api)
        : () => api.reset(),
  });

  return api;
}
