import { AUTH_DEFAULTS as D } from "../config/constants.js";
import { wrapPassword } from "./caesar.js";
import { createTokenStore, isTokenValid } from "./token-store.js";
import { blockReasonFor, resolveCapId } from "../caps/capabilities.js";
import { sanitizeUserMessage } from "../util/sanitize-user-message.js";
import { normalizeContapymeLoginId } from "../util/format.js";
import { fetchRaw, wrapFetchError, localDevHint, isDevHost } from "../http/api-http.js";

const ADMIN_PERSISTENT_CAPS = new Set([
  "session.view_as",
  "patyia.jwt.admin",
  "infra.target.switch",
]);

/** Sesión JWT por aplicación + capacidades de servicio (resueltas en system-login). */
export function registerSession(ns, opts = {}) {
  const appId = String(opts.appId || opts.app || "").trim();
  if (!appId) throw new Error("registerSession: appId requerido");
  const sessionKey = opts.sessionKey || `${D.sessionKey}:${appId}`;
  const authEvt = opts.authEvent || D.authEvent;
  const authLocalKey = opts.authLocalKey || D.authLocalKey;
  const authLocal = opts.authLocal || D.authLocal;
  const authOnline = opts.authOnline || D.authOnline;
  const store = createTokenStore(sessionKey);

  function authBase() {
    return authOnline;
  }

  function authUrl(path) {
    return authBase().replace(/\/$/, "") + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function readSession() {
    const data = store.read();
    if (!data) return null;
    if (data.app && data.app !== appId) {
      store.clear();
      return null;
    }
    if (!isTokenValid(data)) {
      store.clear();
      return null;
    }
    return data;
  }

  function saveSession(data) {
    const caps = Array.isArray(data.capabilities) ? data.capabilities : [];
    const adminCaps = Array.isArray(data.adminCapabilities) ? data.adminCapabilities : caps;
    store.save({
      username: data.username,
      displayName: data.displayName ?? null,
      viewAsUsername: data.viewAsUsername ?? null,
      role: data.role ?? null,
      token: data.token,
      expiresAt: data.expiresAt ?? null,
      app: appId,
      capabilities: caps,
      adminCapabilities: adminCaps,
      capabilityCatalog: Array.isArray(data.capabilityCatalog) ? data.capabilityCatalog : [],
    });
    window.dispatchEvent(new Event(authEvt));
  }

  function clearSession() {
    store.clear();
    window.dispatchEvent(new Event(authEvt));
  }

  let session = readSession();
  let refreshPromise = null;

  function current() {
    session = readSession();
    return session;
  }

  function isLoggedIn() {
    session = readSession();
    return isTokenValid(session);
  }

  function username() {
    const s = current();
    if (!s) return null;
    return s.viewAsUsername || s.username || null;
  }

  function displayName() {
    const s = current();
    if (!s) return null;
    const dn = String(s.displayName ?? "").trim();
    return dn || null;
  }

  function realUsername() {
    return current()?.username ?? null;
  }

  function viewAsUsername() {
    return current()?.viewAsUsername ?? null;
  }

  function isViewingAs() {
    return Boolean(viewAsUsername());
  }

  function auditAuthor() {
    const real = String(realUsername() || username() || "").trim().toUpperCase();
    const va = String(viewAsUsername() || "").trim().toUpperCase();
    if (va && real && va !== real) return `${real} -> ${va}`;
    return real || va || "";
  }

  function adminCapabilities() {
    const s = current();
    const caps = s?.adminCapabilities;
    return Array.isArray(caps) && caps.length ? caps : capabilities();
  }

  function capabilities() {
    const s = current();
    return Array.isArray(s?.capabilities) ? s.capabilities : [];
  }

  function capabilityCatalog() {
    const s = current();
    return Array.isArray(s?.capabilityCatalog) ? s.capabilityCatalog : [];
  }

  function isAdminRole() {
    const role = String(current()?.role || "").trim().toLowerCase();
    return role === "admin";
  }

  function can(capOrLegacy) {
    const capId = resolveCapId(capOrLegacy);
    if (!isLoggedIn()) return false;
    const pool = ADMIN_PERSISTENT_CAPS.has(capId) ? adminCapabilities() : capabilities();
    if (pool.includes(capId)) return true;
    if (ADMIN_PERSISTENT_CAPS.has(capId) && isAdminRole()) return true;
    return false;
  }

  function blockReason(capOrLegacy) {
    const capId = resolveCapId(capOrLegacy);
    return blockReasonFor(capId, {
      loggedIn: isLoggedIn(),
      username: username(),
    });
  }

  function parseSuplantacionFromSession(data) {
    const supl = data?.suplantacion || data?.impersonation;
    if (!supl?.active) return { active: false, suplantadoUsername: null };
    const suplantadoUsername = supl.suplantadoUsername ?? supl.viewAsUsername ?? null;
    return { active: true, suplantadoUsername };
  }

  function appHeader() {
    return { "X-App-Id": appId };
  }

  function authHeader() {
    const hdr = isLoggedIn() ? { Authorization: "Bearer " + session.token, ...appHeader() } : {};
    const va = viewAsUsername();
    if (va) hdr["X-View-As-User"] = va;
    return hdr;
  }

  async function refreshProfile() {
    if (!isLoggedIn()) return null;
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const res = await fetchRaw(authUrl("/api/session"), {
          headers: { Accept: "application/json", ...authHeader() },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) return null;
        const s = current();
        if (!s) return null;
        const caps = Array.isArray(data.capabilities) ? data.capabilities : [];
        const { active: suplantando, suplantadoUsername } = parseSuplantacionFromSession(data);
        const next = {
          ...s,
          displayName: data.user?.displayName ?? s.displayName ?? null,
          viewAsUsername: suplantando ? suplantadoUsername : null,
          role: data.user?.role ?? s.role,
          capabilities: caps,
          adminCapabilities: suplantando
            ? (s.adminCapabilities?.length ? s.adminCapabilities : s.capabilities)
            : caps,
        };
        session = next;
        saveSession(next);
        return next;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function fetchViewAsCatalog() {
    const s = current();
    if (!s) throw new Error("Sin sesión");
    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + s.token,
      ...appHeader(),
    };
    const res = await fetch(authUrl("/api/auth/suplantacion/catalog"), { headers });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && Array.isArray(data.users)) {
      return data.users;
    }
    if (!res.ok) {
      const msg = data.error;
      if (res.status === 404) {
        throw new Error("Ruta de suplantación no encontrada (404). Despliega main-orchestrator y system-login.");
      }
      if (res.status === 403) {
        throw new Error(msg || "Sin permiso de suplantación (solo administradores).");
      }
      throw new Error(msg || "No se pudo cargar el catálogo de suplantación (HTTP " + res.status + ").");
    }
    if (data.ok === false) {
      throw new Error(data.error || "No se pudo cargar el catálogo de suplantación.");
    }
    const params = new URLSearchParams({ limit: "5" });
    const res2 = await fetch(authUrl("/api/auth/suplantacion/search?" + params.toString()), { headers });
    const data2 = await res2.json().catch(() => ({}));
    if (res2.ok && data2.ok && Array.isArray(data2.users)) {
      return data2.users;
    }
    if (res2.ok && data2.ok === false) {
      throw new Error(data2.error || "No se pudo buscar usuarios para suplantación.");
    }
    const status = res2.status || res.status;
    throw new Error(data2.error || data.error || "Respuesta inválida del catálogo de suplantación (HTTP " + status + ").");
  }

  const fetchSuplantacionCatalog = fetchViewAsCatalog;

  async function searchSuplantacionUsers(query, limit) {
    const s = current();
    if (!s) throw new Error("Sin sesión");
    const q = String(query ?? "").trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (limit != null) params.set("limit", String(limit));
    const res = await fetch(authUrl("/api/auth/suplantacion/search?" + params.toString()), {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + s.token,
        ...appHeader(),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "No se pudo buscar usuarios");
    }
    return Array.isArray(data.users) ? data.users : [];
  }

  const searchViewAsUsers = searchSuplantacionUsers;

  function reloadAfterSuplantacionChange() {
    try {
      const url = new URL(location.href);
      if (url.searchParams.has("s")) {
        url.searchParams.delete("s");
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    } catch { /* ignore */ }
    try {
      sessionStorage.removeItem("isa-patyia:paty-jwt");
    } catch { /* ignore */ }
    window.location.reload();
  }

  async function setViewAs(targetUsername) {
    const target = String(targetUsername || "").trim().toUpperCase();
    if (!target) return clearViewAs();
    const s = current();
    if (!s) throw new Error("Sin sesión");
    if (!can("session.view_as")) {
      throw new Error("Sin permiso de suplantación (solo administradores)");
    }
    const res = await fetch(authUrl("/api/session"), {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + s.token,
        ...appHeader(),
        "X-View-As-User": target,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "No se pudo activar la suplantación");
    }
    const caps = Array.isArray(data.capabilities) ? data.capabilities : [];
    const adminCaps = s.adminCapabilities?.length ? s.adminCapabilities : s.capabilities;
    const next = {
      ...s,
      viewAsUsername: target,
      role: data.user?.role ?? s.role,
      capabilities: caps,
      adminCapabilities: adminCaps,
    };
    session = next;
    saveSession(next);
    window.dispatchEvent(new Event(authEvt));
    reloadAfterSuplantacionChange();
    return next;
  }

  async function clearViewAs() {
    const s = current();
    if (!s?.viewAsUsername) return s;
    const next = { ...s, viewAsUsername: null };
    session = next;
    saveSession(next);
    window.dispatchEvent(new Event(authEvt));
    await refreshProfile().catch(() => null);
    reloadAfterSuplantacionChange();
    return session;
  }

  function loginErrorMessage(res, data) {
    if (data?.code === "MULTI_EMPRESA" && Array.isArray(data.terceros) && data.terceros.length) {
      const e = new Error(String(data.error || "Elija la empresa para continuar."));
      e.code = "MULTI_EMPRESA";
      e.terceros = data.terceros;
      return e;
    }
    const apiErr = String(data?.error || "").trim();
    if (apiErr && !/^HTTP \d{3}$/.test(apiErr)) {
      return sanitizeUserMessage(apiErr, "No se pudo iniciar sesión");
    }
    if (res.status === 403) {
      if (data?.app) return `No tiene acceso a la aplicación (${data.app}). Solicite permiso al administrador.`;
      return "No tiene acceso a esta aplicación.";
    }
    if (res.status === 401) return "Usuario o contraseña incorrectos.";
    if (res.status >= 500) return "El servicio de acceso no está disponible. Intente más tarde.";
    return "No se pudo iniciar sesión";
  }

  async function login(user, pass, opts = {}) {
    const loginId = normalizeContapymeLoginId(user);
    if (!loginId) {
      throw new Error("Usuario y contraseña requeridos");
    }
    const credBody = {
      password: wrapPassword(pass),
      app: appId,
      semail: loginId,
    };
    const itercero = String(opts.itercero ?? "").trim();
    if (itercero) credBody.itercero = itercero;
    const isLocal = authBase() === authLocal;
    const hint = localDevHint(isLocal && isDevHost());
    let res;
    try {
      res = await fetchRaw(authUrl("/api/auth/token"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...appHeader() },
        body: JSON.stringify(credBody),
      });
    } catch (e) {
      throw wrapFetchError(e, hint);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      const err = loginErrorMessage(res, data);
      if (err instanceof Error && err.code === "MULTI_EMPRESA") throw err;
      throw new Error(typeof err === "string" ? err : "No se pudo iniciar sesión");
    }
    if (data.app && data.app !== appId) {
      throw new Error("Token emitido para otra aplicación");
    }
    session = {
      username: data.username || user,
      displayName: data.displayName || null,
      viewAsUsername: null,
      role: data.role || null,
      token: data.token,
      expiresAt: data.expiresAt || null,
      app: appId,
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      adminCapabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      capabilityCatalog: Array.isArray(data.capabilityCatalog) ? data.capabilityCatalog : [],
    };
    saveSession(session);
    if (!session.capabilities.length) {
      refreshProfile().catch(() => null);
    }
    return session;
  }

  function logout() {
    session = null;
    clearSession();
  }

  const setSuplantacion = setViewAs;
  const clearSuplantacion = clearViewAs;
  const isSuplantando = isViewingAs;
  const suplantadoUsername = viewAsUsername;

  const sessionApi = {
    current,
    isLoggedIn,
    username,
    displayName,
    realUsername,
    viewAsUsername,
    suplantadoUsername,
    isViewingAs,
    isSuplantando,
    auditAuthor,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    refreshProfile,
    fetchViewAsCatalog,
    fetchSuplantacionCatalog,
    searchViewAsUsers,
    searchSuplantacionUsers,
    setViewAs,
    setSuplantacion,
    clearViewAs,
    clearSuplantacion,
    capabilities,
    adminCapabilities,
    capabilityCatalog,
    can,
    blockReason,
    EVENT: authEvt,
  };

  const bag = window[ns] || {};
  bag.APP_ID = appId;
  bag.AuthApi = {
    AUTH_LOCAL: authLocal,
    AUTH_ONLINE: authOnline,
    SESSION_KEY: sessionKey,
    SESSION_EVT: authEvt,
    APP_ID: appId,
    authBase,
    authUrl,
    saveSession,
    readSession,
    isLoggedIn,
    authHeader,
    appHeader,
  };
  bag.Session = sessionApi;
  bag.Auth = {
    isLoggedIn,
    username,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    refreshProfile,
    capabilities,
    capabilityCatalog,
    can,
    blockReason,
    EVENT: authEvt,
    LOGIN_URL: opts.loginUrl || D.loginUrl,
    AUTH_ONLINE: authOnline,
  };
  window[ns] = bag;

  if (isLoggedIn()) {
    const s = current();
    const adminCaps = adminCapabilities();
    const needsRefresh = !Array.isArray(s?.capabilities) || !s.capabilities.length
      || !String(s?.displayName ?? "").trim()
      || (isAdminRole() && ADMIN_PERSISTENT_CAPS.has("session.view_as")
        && !adminCaps.includes("session.view_as"));
    if (needsRefresh) {
      refreshProfile().catch(() => {});
    }
    window.dispatchEvent(new Event(authEvt));
  }
}
