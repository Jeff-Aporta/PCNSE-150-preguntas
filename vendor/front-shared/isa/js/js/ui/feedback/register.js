import { createToastApi, requestConfirm } from "./toast-bus.js";
import { createProcessApi } from "./process-bus.js";
import { createFeedbackUI } from "./create-ui.js";

/**
 * Registra Feedback (toasts MUI + procesos + confirm) en window[ns].
 * Requiere React + MaterialUI (stack.mjs).
 */
export function registerFeedback(ns, React, MUI) {
  if (!ns) throw new Error("registerFeedback: ns requerido");
  const toast = createToastApi();
  const process = createProcessApi(toast);
  const ui = createFeedbackUI(React, MUI);

  const api = {
    toast,
    process,
    confirm: requestConfirm,
    runProcess: (opts) => process.createRunner(opts),
  };

  window[ns] = window[ns] || {};
  window[ns].Feedback = api;
  window[ns].UI = window[ns].UI || {};
  window[ns].UI.FeedbackProvider = ui.FeedbackProvider;
  window[ns].UI.ProcessPanel = ui.ProcessPanel;

  /** Compat legacy */
  window[ns].Toast = {
    show: (opts) => toast.show({
      message: opts?.message,
      severity: opts?.severity,
      durationMs: opts?.durationMs,
      title: opts?.title,
    }),
  };

  return api;
}

/** API global en ISAFront (apps sin registerApp completo, p. ej. isa-patyia). */
export function registerFeedbackGlobal(React, MUI) {
  if (window.ISAFront?.__feedbackApi) return window.ISAFront.__feedbackApi;
  const toast = createToastApi();
  const process = createProcessApi(toast);
  const ui = createFeedbackUI(React, MUI);
  const api = {
    toast,
    process,
    confirm: requestConfirm,
    runProcess: (opts) => process.createRunner(opts),
    UI: ui,
  };
  window.ISAFront = window.ISAFront || {};
  window.ISAFront.__feedbackApi = api;
  window.ISAFront.Feedback = api;
  window.ISAFront.FeedbackProvider = ui.FeedbackProvider;
  return api;
}

export { createToastApi, createProcessApi, createFeedbackUI };
