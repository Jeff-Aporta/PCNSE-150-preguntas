/**
 * Bus de toasts — API imperativa compartida (sin React).
 * El FeedbackProvider MUI escucha y renderiza con tema.
 */
const DEFAULT_TIMEOUT = 4500;

/** @type {Set<(item: object) => void>} */
const toastListeners = new Set();

let confirmResolver = null;

export const FEEDBACK_TOAST_EVENT = "isa:feedback:toast";
export const FEEDBACK_CONFIRM_EVENT = "isa:feedback:confirm";

function emitToast(item) {
  const toast = {
    ...item,
    id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: item.type || item.severity || "info",
    text: item.text ?? item.message ?? "",
    timeout: item.timeout ?? item.durationMs ?? DEFAULT_TIMEOUT,
  };
  toastListeners.forEach((fn) => fn(toast));
  window.dispatchEvent(new CustomEvent(FEEDBACK_TOAST_EVENT, { detail: toast }));
  return toast.id;
}

export function subscribeToasts(fn) {
  toastListeners.add(fn);
  return () => toastListeners.delete(fn);
}

export function toastShow(opts = {}) {
  const text = opts.text ?? opts.message ?? "";
  if (!text) return null;
  return emitToast({
    type: opts.type ?? opts.severity ?? "info",
    text: String(text),
    title: opts.title,
    timeout: opts.timeout ?? opts.durationMs,
  });
}

export function toastSuccess(text, timeout) {
  return emitToast({ type: "success", text: String(text), timeout });
}

export function toastError(text, timeout) {
  emitToast({ type: "error", text: String(text), timeout: timeout ?? 6000 });
  if (typeof console !== "undefined") console.error("[ISA Feedback]", text);
}

export function toastInfo(text, timeout) {
  return emitToast({ type: "info", text: String(text), timeout });
}

export function toastWarning(text, timeout) {
  return emitToast({ type: "warning", text: String(text), timeout });
}

export function requestConfirm(opts = {}) {
  return new Promise((resolve) => {
    confirmResolver = resolve;
    window.dispatchEvent(new CustomEvent(FEEDBACK_CONFIRM_EVENT, {
      detail: {
        title: opts.title ?? "Confirmar",
        message: opts.message ?? "",
        confirmLabel: opts.confirmLabel ?? "Continuar",
        cancelLabel: opts.cancelLabel ?? "Cancelar",
      },
    }));
  });
}

export function resolveConfirm(ok) {
  if (confirmResolver) {
    confirmResolver(!!ok);
    confirmResolver = null;
  }
}

/** Mapea payload SignalR / lab:notify → toast */
export function toastFromPayload(payload) {
  if (!payload || typeof payload !== "object") {
    toastInfo(typeof payload === "string" ? payload : JSON.stringify(payload ?? {}));
    return;
  }
  const type = String(payload.type ?? payload.kind ?? "info").toLowerCase();
  const text = payload.message ?? payload.text ?? payload.title ?? JSON.stringify(payload);
  const title = payload.title && payload.message ? payload.title : undefined;
  if (/error|fail|denied/.test(type)) emitToast({ type: "error", text, title, timeout: 6000 });
  else if (/warn|warning/.test(type)) emitToast({ type: "warning", text, title });
  else if (/success|done|complete|ok/.test(type)) emitToast({ type: "success", text, title });
  else emitToast({ type: "info", text, title });
}

export function createToastApi() {
  return {
    show: toastShow,
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
    warning: toastWarning,
    fromPayload: toastFromPayload,
  };
}
