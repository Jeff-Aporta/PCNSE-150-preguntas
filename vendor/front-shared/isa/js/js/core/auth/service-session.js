import { sanitizeUserMessage } from "../util/sanitize-user-message.js";
import { buildCapEndpointMap } from "../caps/cap-endpoints.js";

/**
 * Tokens de servicio por capacidad vía POST /api/auth/service-token.
 * Endpoints: catálogo de system-login + overrides por app (capEndpoints).
 * @param {object} opts Session, Config, capEndpoints, capApiPrefix, ns, notifyAuth
 */
export function createServiceSession(opts = {}) {
  const {
    Session,
    Config,
    capEndpoints = {},
    capApiPrefix = "/api",
    ns = "",
    notifyAuth = null,
    registerAppSession = false,
  } = opts;
  const serviceTokens = new Map();

  function clearServiceTokens() {
    serviceTokens.clear();
  }

  function sanitizeApiError(raw, fallback = "No se pudo completar la operación") {
    return sanitizeUserMessage(raw, fallback);
  }

  function resolveCapEndpoint(capId) {
    const cap = String(capId || "").trim();
    if (!cap) return null;
    if (capEndpoints[cap]) return capEndpoints[cap];
    const catalog = typeof Session.capabilityCatalog === "function" ? Session.capabilityCatalog() : [];
    const fromCatalog = buildCapEndpointMap(catalog, capApiPrefix);
    return fromCatalog[cap] || null;
  }

  async function serviceAuthHeaders(capId) {
    const cap = String(capId || "").trim();
    const ep = resolveCapEndpoint(cap);
    if (!ep) throw new Error("Capacidad desconocida: " + cap);
    const cacheKey = `${cap}:${ep.method}:${ep.path}`;
    const cached = serviceTokens.get(cacheKey);
    if (cached && cached.expMs > Date.now() + 60_000) {
      return { Authorization: "Bearer " + cached.token };
    }
    const res = await fetch(Config.apiUrl("/api/auth/service-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...Session.authHeader(), ...Session.appHeader() },
      body: JSON.stringify({ method: ep.method, path: ep.path }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) {
      const err = new Error(String(data.error ?? "Permiso denegado"));
      err.code = "FORBIDDEN";
      err.status = 403;
      throw err;
    }
    if (!res.ok || !data.token) {
      throw new Error(sanitizeApiError(data.error ?? data.hint, "Token de servicio no disponible"));
    }
    const token = String(data.token);
    const expMs = data.expiresAt ? new Date(String(data.expiresAt)).getTime() : Date.now() + 3_600_000;
    serviceTokens.set(cacheKey, { token, expMs });
    return { Authorization: "Bearer " + token };
  }

  function invalidateServiceTokens() {
    clearServiceTokens();
  }

  function clearSession() {
    clearServiceTokens();
    Session.logout();
    if (notifyAuth) notifyAuth();
  }

  async function login(username, password, opts = {}) {
    clearServiceTokens();
    const session = await Session.login(username, password, opts);
    if (notifyAuth) notifyAuth();
    return session;
  }

  const AppSession = {
    current: () => Session.current(),
    isLoggedIn: () => Session.isLoggedIn(),
    username: () => Session.username(),
    capabilities: () => Session.capabilities(),
    capabilityCatalog: () => Session.capabilityCatalog(),
    can: (cap) => Session.can(cap),
    blockReason: (cap) => Session.blockReason(cap),
    login,
    logout: clearSession,
    refreshProfile: () => Session.refreshProfile(),
    serviceAuthHeaders,
    resolveCapEndpoint,
    invalidateServiceTokens,
    clearSession,
  };

  if (registerAppSession && ns) {
    const root = window[ns] || (window[ns] = {});
    root.AppSession = AppSession;
  }

  return {
    AppSession,
    serviceAuthHeaders,
    resolveCapEndpoint,
    clearServiceTokens,
    invalidateServiceTokens,
    clearSession,
    login,
  };
}
