/**
 * Toasts — delega al bus MUI (feedback/toast-bus.js).
 * Fallback DOM solo si no hay FeedbackProvider montado aún.
 */
import {
  toastShow,
  createToastApi,
  FEEDBACK_TOAST_EVENT,
} from "./feedback/toast-bus.js";

const COLORS = {
  info: { bg: "#1565c0", fg: "#fff" },
  success: { bg: "#2e7d32", fg: "#fff" },
  warning: { bg: "#ed6c02", fg: "#fff" },
  error: { bg: "#c62828", fg: "#fff" },
};

function ensureDomContainer() {
  let el = document.getElementById("isa-toast-root");
  if (el) return el;
  el = document.createElement("div");
  el.id = "isa-toast-root";
  el.setAttribute("aria-live", "polite");
  el.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:10000;display:flex;flex-direction:column;gap:8px;max-width:min(360px,calc(100vw - 32px));pointer-events:none;font-family:IBM Plex Sans,system-ui,sans-serif;";
  document.body.appendChild(el);
  return el;
}

function showDomFallback(opts) {
  const message = opts && opts.message ? String(opts.message) : "";
  if (!message) return;
  const severity = (opts && opts.severity) || "info";
  const durationMs = (opts && opts.durationMs) || 4500;
  const palette = COLORS[severity] || COLORS.info;
  const root = ensureDomContainer();
  const item = document.createElement("div");
  item.textContent = message;
  item.style.cssText =
    "pointer-events:auto;padding:10px 14px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.25);font-size:14px;line-height:1.4;opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;background:" +
    palette.bg + ";color:" + palette.fg + ";";
  root.appendChild(item);
  requestAnimationFrame(() => {
    item.style.opacity = "1";
    item.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transform = "translateY(8px)";
    setTimeout(() => item.remove(), 220);
  }, durationMs);
}

export function showToast(opts) {
  const id = toastShow({
    message: opts?.message,
    severity: opts?.severity,
    durationMs: opts?.durationMs,
    title: opts?.title,
  });
  if (!id && opts?.message) showDomFallback(opts);
  return id;
}

export function registerToast(ns) {
  const toast = createToastApi();
  window[ns] = window[ns] || {};
  window[ns].Toast = {
    show: (opts) => toast.show({
      message: opts?.message,
      severity: opts?.severity,
      durationMs: opts?.durationMs,
      title: opts?.title,
    }),
  };
}

export { FEEDBACK_TOAST_EVENT as TOAST_EVENT };
