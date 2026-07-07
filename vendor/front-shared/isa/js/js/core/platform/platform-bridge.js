/**
 * Puente tipado app → window[ns] (ISAFront). Una copia por micro-frontend.
 * @param {string} ns p.ej. "ISA", "ISAJ"
 * @param {object} [opts]
 * @param {boolean} [opts.sessionFromAuth] fallback Session → Auth (jagudeloe legacy)
 */
export function createPlatformBridge(ns, opts = {}) {
  function bag() {
    const b = window[ns];
    if (!b?.UI) throw new Error(`${ns} no registrado — ejecutar isa-setup antes que platform`);
    return b;
  }

  function sessionApi() {
    const j = bag();
    if (j.Session) return j.Session;
    if (!opts.sessionFromAuth) return j.Session;
    const auth = j.Auth;
    if (!auth) throw new Error(`${ns} Session/Auth no disponible`);
    return {
      current() {
        if (!auth.isLoggedIn()) return null;
        return { username: auth.username(), expiresAt: null, role: null, token: null };
      },
      isLoggedIn: () => auth.isLoggedIn(),
      username: () => auth.username(),
      authHeader: () => auth.authHeader(),
      appHeader: () => auth.appHeader?.() ?? {},
      appId: () => auth.appId?.() ?? j.APP_ID ?? null,
      login: (u, p, opts) => auth.login(u, p, opts),
      logout: () => auth.logout(),
      refreshProfile: () => auth.refreshProfile?.(),
      capabilities: () => auth.capabilities?.() ?? [],
      capabilityCatalog: () => auth.capabilityCatalog?.() ?? [],
      can: (cap) => auth.can?.(cap) ?? false,
      blockReason: (cap) => auth.blockReason?.(cap) ?? "Inicia sesión para usar este servicio",
      get EVENT() { return auth.EVENT; },
    };
  }

  const UI = {
    get Icon() { return bag().UI.Icon; },
    get TargetSwitch() { return bag().UI.TargetSwitch; },
    get ThemeSwitch() { return bag().UI.ThemeSwitch; },
    get useRealtimeStatus() { return bag().UI.useRealtimeStatus; },
    get RealtimeStatusDot() { return bag().UI.RealtimeStatusDot; },
    get Loading() { return bag().UI.Loading; },
    get ErrorBox() { return bag().UI.ErrorBox; },
    get LoginGate() { return bag().UI.LoginGate; },
    get LoginButton() { return bag().UI.LoginButton; },
    get FeedbackProvider() { return bag().UI.FeedbackProvider; },
    get ProcessPanel() { return bag().UI.ProcessPanel; },
    get RunButton() { return bag().UI.RunButton; },
    get SqlViewer() { return bag().UI.SqlViewer; },
    get SqlExecCard() { return bag().UI.SqlExecCard; },
    get SqlBlock() { return bag().UI.SqlBlock; },
  };

  const Session = {
    current: () => sessionApi().current(),
    isLoggedIn: () => sessionApi().isLoggedIn(),
    username: () => sessionApi().username(),
    displayName: () => sessionApi().displayName?.() ?? null,
    realUsername: () => sessionApi().realUsername?.() ?? sessionApi().username(),
    viewAsUsername: () => sessionApi().viewAsUsername?.() ?? null,
    suplantadoUsername: () => sessionApi().suplantadoUsername?.() ?? sessionApi().viewAsUsername?.() ?? null,
    isViewingAs: () => sessionApi().isViewingAs?.() ?? false,
    isSuplantando: () => sessionApi().isSuplantando?.() ?? sessionApi().isViewingAs?.() ?? false,
    auditAuthor: () => sessionApi().auditAuthor?.()
      ?? String(sessionApi().username?.() || "").trim().toUpperCase(),
    authHeader: () => sessionApi().authHeader(),
    appHeader: () => sessionApi().appHeader(),
    appId: () => sessionApi().appId(),
    login: (u, p, opts) => sessionApi().login(u, p, opts),
    logout: () => sessionApi().logout(),
    refreshProfile: () => sessionApi().refreshProfile?.(),
    fetchViewAsCatalog: () => sessionApi().fetchViewAsCatalog?.(),
    fetchSuplantacionCatalog: () => sessionApi().fetchSuplantacionCatalog?.() ?? sessionApi().fetchViewAsCatalog?.(),
    searchViewAsUsers: (q, limit) => sessionApi().searchViewAsUsers?.(q, limit),
    searchSuplantacionUsers: (q, limit) => sessionApi().searchSuplantacionUsers?.(q, limit) ?? sessionApi().searchViewAsUsers?.(q, limit),
    setViewAs: (u) => sessionApi().setViewAs?.(u),
    setSuplantacion: (u) => sessionApi().setSuplantacion?.(u) ?? sessionApi().setViewAs?.(u),
    clearViewAs: () => sessionApi().clearViewAs?.(),
    clearSuplantacion: () => sessionApi().clearSuplantacion?.() ?? sessionApi().clearViewAs?.(),
    capabilities: () => sessionApi().capabilities?.() ?? [],
    adminCapabilities: () => sessionApi().adminCapabilities?.() ?? sessionApi().capabilities?.() ?? [],
    capabilityCatalog: () => sessionApi().capabilityCatalog?.() ?? [],
    can: (cap) => sessionApi().can?.(cap) ?? false,
    blockReason: (cap) => sessionApi().blockReason?.(cap) ?? "Inicia sesión para usar este servicio",
    get EVENT() { return sessionApi().EVENT; },
  };

  const Config = {
    base: () => bag().Config.base(),
    apiUrl: (path) => bag().Config.apiUrl(path),
    isLocal: () => bag().Config.isLocal?.() ?? false,
    setLocal: (v) => bag().Config.setLocal?.(v),
    label: () => bag().Config.label?.(),
    get EVENT() { return bag().Config.EVENT; },
  };

  const Toast = {
    show: (o) =>
      bag().Toast?.show?.(o)
      ?? bag().Feedback?.toast?.show?.({
        message: o?.message,
        severity: o?.severity,
        durationMs: o?.durationMs,
        title: o?.title,
      }),
  };

  const Feedback = {
    get toast() { return bag().Feedback?.toast; },
    get process() { return bag().Feedback?.process; },
    runProcess: (o) => bag().Feedback?.runProcess?.(o),
    confirm: (o) => bag().Feedback?.confirm?.(o),
  };

  const Realtime = {
    getStatus: () => bag().Realtime?.getConnectionStatus?.() ?? bag().Realtime?.getStatus?.(),
  };

  return { UI, Session, Config, Toast, Feedback, Realtime };
}
