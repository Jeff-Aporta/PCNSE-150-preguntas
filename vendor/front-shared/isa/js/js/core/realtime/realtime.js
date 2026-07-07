/** Evento global: `window.addEventListener("isa:realtime", (e) => e.detail)` */
export const REALTIME_EVENT = "isa:realtime";

/** Cambios de estado del socket: `{ ns, status }` en detail. */
export const REALTIME_STATUS_EVENT = "isa:realtime:status";

/** Capacidad BD_AUTH para notificaciones WebSocket (legacy id `signalr`). */
export const REALTIME_CAP = "signalr";

/** Tipos de mensaje realtime del orquestador (Jeff-Aporta). */
export const REALTIME = {
  CHECKS_UPDATED: "checks.updated",
};

/** Sesión iniciada + capacidad `signalr` (opt-in por rol en BD_AUTH). */
export function defaultRealtimeEnabled(ns) {
  const session = window[ns]?.Session;
  if (!session?.isLoggedIn?.()) return false;
  if (typeof session.can === "function") return session.can(REALTIME_CAP);
  return false;
}

function wireRealtimeSession(ns, rt, enabled) {
  const evt = window[ns]?.Session?.EVENT;
  if (!evt) return;
  function sync() {
    if (enabled()) {
      if (rt.getStatus() !== "connected" && rt.getStatus() !== "connecting") rt.start();
    } else {
      rt.disconnect();
    }
  }
  window.addEventListener(evt, sync);
  sync();
}

export function realtimeStatusTip(state, lastErr) {
  switch (state) {
    case "connected":
      return "Notificaciones en tiempo real activas";
    case "connecting":
      return "Conectando notificaciones…";
    case "reconnecting":
      return "Reconectando notificaciones…";
    case "error":
      return lastErr ? String(lastErr) : "Error de conexión realtime";
    default:
      return "Notificaciones desconectadas";
  }
}

export function realtimeDotTone(state) {
  switch (state) {
    case "connected":
      return "green";
    case "error":
      return "red";
    default:
      return "gray";
  }
}

function emitStatus(ns, status) {
  try {
    window.dispatchEvent(new CustomEvent(REALTIME_STATUS_EVENT, { detail: { ns, status } }));
  } catch {
    /* ignore */
  }
}

/** http(s)://host → wss://host/api/ws */
export function wsUrlFromHttpBase(httpBase) {
  const base = String(httpBase || "").replace(/\/$/, "");
  if (!base) return "";
  if (base.startsWith("https://")) return "wss://" + base.slice(8) + "/api/ws";
  if (base.startsWith("http://")) return "ws://" + base.slice(7) + "/api/ws";
  if (base.startsWith("wss://") || base.startsWith("ws://")) {
    return base.includes("/api/ws") ? base : base.replace(/\/?$/, "") + "/api/ws";
  }
  return "wss://" + base + "/api/ws";
}

/**
 * Cliente WebSocket con reconexión exponencial.
 * @param {{ getUrl: () => string, onMessage?: (data: unknown) => void, onStatus?: (status: string) => void, enabled?: () => boolean, ns?: string }} opts
 */
export function createRealtime(opts = {}) {
  const getUrl = opts.getUrl || (() => "");
  const onMessage = opts.onMessage;
  const onStatus = opts.onStatus;
  const enabled = opts.enabled || (() => false);
  const ns = opts.ns || "";

  /** @type {WebSocket | null} */
  let socket = null;
  let stopped = false;
  let attempt = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  let connectionStatus = "disconnected";

  function setStatus(status) {
    connectionStatus = status;
    if (onStatus) onStatus(status);
    emitStatus(ns, status);
  }

  function scheduleReconnect() {
    if (stopped || !enabled()) return;
    const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
    attempt += 1;
    setStatus("reconnecting");
    timer = setTimeout(connect, delay);
  }

  function connect() {
    if (stopped || !enabled()) {
      setStatus("disconnected");
      return;
    }
    const url = getUrl();
    if (!url) {
      setStatus("disconnected");
      return;
    }
    try {
      setStatus("connecting");
      socket = new WebSocket(url);
    } catch {
      setStatus("error");
      scheduleReconnect();
      return;
    }

    socket.addEventListener("open", () => {
      attempt = 0;
      setStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      let data = event.data;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        /* texto plano */
      }
      if (onMessage) onMessage(data);
      try {
        window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: data }));
      } catch {
        /* ignore */
      }
    });

    socket.addEventListener("close", () => {
      socket = null;
      if (!stopped) scheduleReconnect();
      else setStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setStatus("error");
    });
  }

  function disconnect() {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
    if (socket) {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      socket = null;
    }
    setStatus("disconnected");
  }

  function start() {
    stopped = false;
    attempt = 0;
    connect();
  }

  function ping() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));
    }
  }

  function getStatus() {
    if (socket && socket.readyState === WebSocket.OPEN) return "connected";
    return connectionStatus;
  }

  return {
    start,
    disconnect,
    ping,
    getStatus,
    getConnectionStatus: getStatus,
  };
}

export function registerRealtime(ns, opts = {}) {
  const getBase = opts.getBase || (() => {
    const cfg = window[ns] && window[ns].Config;
    return cfg && cfg.base ? cfg.base() : "";
  });
  const enabled = typeof opts.enabled === "function" ? opts.enabled : () => defaultRealtimeEnabled(ns);
  const rt = createRealtime({
    ns,
    getUrl: () => wsUrlFromHttpBase(getBase()),
    enabled,
    onMessage: opts.onMessage,
    onStatus: opts.onStatus,
  });

  rt.isConfigured = true;
  window[ns].Realtime = rt;

  wireRealtimeSession(ns, rt, enabled);

  if (opts.autoStart === true && enabled()) rt.start();
  return rt;
}
