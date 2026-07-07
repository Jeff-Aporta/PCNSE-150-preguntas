import { sanitizeUserMessage } from "../util/sanitize-user-message.js";

export const DEFAULT_FETCH_TIMEOUT_MS = 45000;

export function isDevHost() {
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function localDevHint(isLocal) {
  if (!isDevHost() || !isLocal) return "";
  return " Comprueba que el entorno local esté activo.";
}

export function sanitizeApiError(raw, fallback = "No se pudo completar la operación") {
  return sanitizeUserMessage(raw, fallback);
}

/** Path relativo del front → /api/... */
export function normalizeApiPath(path) {
  const p = String(path || "").trim();
  const rel = p.startsWith("/") ? p : "/" + p;
  return rel.startsWith("/api") ? rel : "/api" + rel;
}

export function apiUrl(cfg, path, baseOverride) {
  const full = normalizeApiPath(path);
  const base = (baseOverride || cfg.getApiBase?.() || cfg.Config.base()).replace(/\/$/, "");
  return base + full;
}

export function wrapFetchError(e, hint = "") {
  if (e instanceof Error && e.name === "AbortError") return new Error("La operación tardó demasiado." + hint);
  if (e instanceof TypeError || (e instanceof Error && /fetch|network|failed/i.test(e.message))) {
    return new Error("No se pudo conectar con el servidor." + hint);
  }
  return e instanceof Error ? e : new Error(String(e));
}

export async function fetchRaw(url, opts = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
  } finally {
    clearTimeout(timer);
  }
}

export function encodeSqlQueryParam(sql) {
  const trimmed = String(sql ?? "").trim();
  const bytes = new TextEncoder().encode(trimmed);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function rowVal(row, key) {
  if (!row || typeof row !== "object") return undefined;
  const k = String(key || "");
  if (Object.prototype.hasOwnProperty.call(row, k)) return row[k];
  const lower = k.toLowerCase();
  for (const rk of Object.keys(row)) {
    if (rk.toLowerCase() === lower) return row[rk];
  }
  return undefined;
}

/**
 * Cliente HTTP multi-base con tokens de servicio por capacidad (estilo labFetch).
 * @param {object} opts Session, Config, getApiBase, localDirect, orchOnline, serviceAuthHeaders, handleApiError, clearSession, isLocal
 */
export function createCapFetch(opts = {}) {
  const {
    Session,
    Config,
    getApiBase = () => Config.base(),
    localDirect = [],
    remoteDirect = [],
    orchOnline = null,
    orchOnlineInLocal = true,
    serviceAuthHeaders = null,
    handleApiError = null,
    clearSession = null,
    isLocal = () => Config.isLocal(),
    fetchTimeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  } = opts;

  function devHint() {
    return localDevHint(isLocal());
  }

  function directBaseFor(path) {
    if (!isDevHost() || !isLocal()) return null;
    for (const entry of localDirect) {
      if (entry.test(path)) return String(entry.base).replace(/\/$/, "");
    }
    return null;
  }

  function basesFor(path) {
    const bases = [String(getApiBase()).replace(/\/$/, "")];
    const direct = directBaseFor(path);
    if (direct && bases.indexOf(direct) < 0) bases.push(direct);
    if (isDevHost() && isLocal() && orchOnline && orchOnlineInLocal) {
      const prod = String(orchOnline).replace(/\/$/, "");
      if (bases.indexOf(prod) < 0) bases.push(prod);
    }
    if (!isLocal() && remoteDirect.length) {
      for (const entry of remoteDirect) {
        if (entry.test(path) && bases.indexOf(String(entry.base).replace(/\/$/, "")) < 0) {
          bases.push(String(entry.base).replace(/\/$/, ""));
        }
      }
    }
    return bases;
  }

  async function parseJsonResponse(res, cap) {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(sanitizeApiError(text || res.statusText, "Respuesta no válida del servidor"));
    }

    if (res.status === 403) {
      const err = new Error(sanitizeApiError(data.error, "Permiso denegado"));
      err.code = "FORBIDDEN";
      err.status = 403;
      err.data = data;
      if (cap && handleApiError) handleApiError(err, cap);
      throw err;
    }
    if (res.status === 401) {
      if (clearSession) clearSession();
      const err = new Error(sanitizeApiError(data.error ?? data.hint, "Sesión no válida"));
      err.status = 401;
      err.data = data;
      throw err;
    }
    if (res.status === 404) {
      const serverErr = String(data?.error ?? "").trim();
      let msg;
      if (/verify-access|autorizaci|verificaci/i.test(serverErr)) {
        msg = "No se pudo verificar permisos AppTools. Cierra sesión, vuelve a entrar y comprueba tu rol en system-login.";
      } else if (/^not found$/i.test(serverErr)) {
        msg = "Recurso o operación no encontrada en el servidor." + devHint();
      } else if (serverErr) {
        msg = sanitizeApiError(serverErr, "Recurso no encontrado.");
      } else {
        msg = "Recurso no encontrado." + devHint();
      }
      const err = new Error(msg);
      err.status = 404;
      err.data = data;
      throw err;
    }
    if (!res.ok || data.ok === false) {
      const err = new Error(sanitizeApiError(data.error ?? data.output ?? res.statusText, "Error HTTP " + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function capFetch(path, init = {}, cap = null) {
    const apiPath = normalizeApiPath(path);
    const bases = basesFor(path);
    const method = (init.method || "GET").toUpperCase();
    const headers = Object.assign({}, init.headers || {});
    if (Session.isLoggedIn()) Object.assign(headers, Session.authHeader(), Session.appHeader());
    if (cap && serviceAuthHeaders) Object.assign(headers, await serviceAuthHeaders(cap));

    let lastErr = null;
    for (let bi = 0; bi < bases.length; bi++) {
      const url = bases[bi] + apiPath;
      let res;
      try {
        res = await fetchRaw(url, Object.assign({}, init, { method, headers }), fetchTimeoutMs);
      } catch (e) {
        lastErr = wrapFetchError(e, devHint());
        if (bi < bases.length - 1) continue;
        throw lastErr;
      }
      try {
        return await parseJsonResponse(res, cap);
      } catch (e) {
        lastErr = e;
        if (bi < bases.length - 1 && (e.status === 404 || e.status === 502 || e.status === 503)) continue;
        throw e;
      }
    }
    throw lastErr || new Error("No se pudo conectar con el servidor." + devHint());
  }

  return {
    capFetch,
    apiUrl: (path, baseOverride) => apiUrl({ Config, getApiBase }, path, baseOverride),
    basesFor,
    normalizeApiPath,
    encodeSqlQueryParam,
    rowVal,
  };
}

/** Mensajes UI para fallos de permiso/capacidad. */
export function humanPermissionError(err, cap, blockReason) {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const msg = sanitizeApiError(raw, "");
  if (!msg || /verificaci[oó]n de permisos|verify-access|servicio de auth/i.test(raw)) {
    return (typeof blockReason === "function" ? blockReason(cap) : "") || "No se pudo verificar el permiso para esta operación";
  }
  if (/permiso|denegad|forbidden|sin permiso/i.test(msg)) {
    return (typeof blockReason === "function" ? blockReason(cap) : "") || msg;
  }
  return msg || (typeof blockReason === "function" ? blockReason(cap) : "") || "No se pudo completar la operación";
}

/** Toast helper para errores de API con código FORBIDDEN/NO_SESSION. */
export function handleApiError(err, cap, deps = {}) {
  const { blockReason, clearSession, toastWarning, toastError } = deps;
  if (err?.code === "FORBIDDEN" || /permiso|denegad|verificaci[oó]n de permisos/i.test(String(err?.message))) {
    if (toastWarning) toastWarning(humanPermissionError(err, cap, blockReason));
    return;
  }
  if (/401|sesi[oó]n|expirad|no autorizado/i.test(String(err?.message))) {
    if (clearSession) clearSession();
    if (toastWarning) toastWarning("Sesión expirada. Vuelve a iniciar sesión.");
    return;
  }
  if (toastError) toastError(sanitizeApiError(err instanceof Error ? err.message : String(err)));
}

/** @deprecated usar createCapFetch */
export function createApiFetch(options) {
  return createCapFetch(options);
}

export function basesFor(path, opts = {}) {
  const { gatewayBase, orchOnline = null, localDirect = [], isLocal = false, isDev = isDevHost() } = opts;
  const bases = [String(gatewayBase || "").replace(/\/$/, "")];
  if (orchOnline && bases.indexOf(orchOnline) < 0) bases.push(orchOnline);
  if (isDev && isLocal) {
    for (const entry of localDirect) {
      if (entry.test(path) && bases.indexOf(entry.base) < 0) bases.push(entry.base);
    }
  }
  return bases;
}

export async function parseJsonResponse(res, dev, fallback = "Error HTTP ") {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errBody = data != null && typeof data === "object" ? data : null;
    let msg = sanitizeApiError(errBody?.error, fallback + res.status);
    if (res.status === 401) msg = "Sesión requerida o expirada.";
    if (res.status === 403) msg = "No tienes permiso para esta operación.";
    if (res.status === 404) msg = "Recurso no encontrado." + (dev ? localDevHint(true) : "");
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
