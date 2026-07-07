import { AUTH_DEFAULTS as D, MAIN_ORCHESTRATOR_LS_KEY } from "../config/constants.js";
import { wrapPassword } from "./caesar.js";
import { createTokenStore, isTokenValid } from "./token-store.js";
import { normalizeContapymeLoginId } from "../util/format.js";

/** Auth consumer — login contra system-login (sesión por app). */
export function createAuth(opts = {}) {
  const appId = String(opts.appId || opts.app || "").trim();
  if (!appId) throw new Error("createAuth: appId requerido");
  const sessionKey = opts.sessionKey || `${D.sessionKey}:${appId}`;
  const authEvt = opts.authEvent || D.authEvent;
  const authLocalKey = opts.authLocalKey || D.authLocalKey;
  const authLocal = opts.authLocal || D.authLocal;
  const authOnline = opts.authOnline || D.authOnline;
  const loginUrl = opts.loginUrl || D.loginUrl;
  const store = createTokenStore(sessionKey);

  function read() {
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

  function authBase() {
    try {
      if (localStorage.getItem(MAIN_ORCHESTRATOR_LS_KEY) === "1") return authLocal;
    } catch (e) {
      /* ignore */
    }
    return authOnline;
  }

  function isLoggedIn() {
    return isTokenValid(read());
  }

  function username() {
    return read()?.username ?? null;
  }

  function appHeader() {
    return { "X-App-Id": appId };
  }

  function authHeader() {
    const s = read();
    return s?.token ? { Authorization: "Bearer " + s.token, ...appHeader() } : {};
  }

  async function login(user, pass, opts = {}) {
    const loginId = normalizeContapymeLoginId(user);
    if (!loginId || !pass) throw new Error("Usuario y contraseña requeridos");
    const body = { semail: loginId, password: wrapPassword(pass), app: appId };
    const itercero = String(opts.itercero ?? "").trim();
    if (itercero) body.itercero = itercero;
    const res = await fetch(authBase().replace(/\/$/, "") + "/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...appHeader() },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      if (data?.code === "MULTI_EMPRESA" && Array.isArray(data.terceros) && data.terceros.length) {
        const e = new Error(String(data.error || "Elija la empresa para continuar."));
        e.code = "MULTI_EMPRESA";
        e.terceros = data.terceros;
        throw e;
      }
      throw new Error(data.error || "Login fallido");
    }
    if (data.app && data.app !== appId) throw new Error("Token emitido para otra aplicación");
    store.save({
      username: data.username || loginId,
      token: data.token,
      expiresAt: data.expiresAt ?? null,
      app: appId,
    });
    window.dispatchEvent(new Event(authEvt));
  }

  function logout() {
    store.clear();
    window.dispatchEvent(new Event(authEvt));
  }

  const auth = {
    isLoggedIn,
    username,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    LOGIN_URL: loginUrl,
    EVENT: authEvt,
    AUTH_ONLINE: authOnline,
  };

  if (isLoggedIn()) {
    window.dispatchEvent(new Event(authEvt));
  }

  return auth;
}

export function registerAuth(ns, opts) {
  window[ns] = window[ns] || {};
  window[ns].Auth = createAuth(opts);
  window[ns].APP_ID = String(opts?.appId || opts?.app || "").trim();
}
