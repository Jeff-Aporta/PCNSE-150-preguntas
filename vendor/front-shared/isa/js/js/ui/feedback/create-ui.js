/**
 * UI MUI — toasts, confirm y panel de pasos de proceso (respeta ThemeProvider).
 */
import {
  subscribeToasts,
  requestConfirm,
  resolveConfirm,
  FEEDBACK_CONFIRM_EVENT,
} from "./toast-bus.js";
import { subscribeProcesses } from "./process-bus.js";

const STEP_ICON = {
  pending: "mdi:circle-outline",
  running: "mdi:loading",
  done: "mdi:check-circle-outline",
  error: "mdi:alert-circle-outline",
};

export function createFeedbackUI(React, MUI) {
  const { useState, useEffect, useCallback } = React;
  const {
    Snackbar, Alert, AlertTitle, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Stack, Typography, LinearProgress, Paper, Collapse,
  } = MUI;

  function ToastStack({ items, onClose }) {
    return React.createElement(
      "div",
      { className: "isa-toast-stack", "aria-live": "polite", "aria-relevant": "additions" },
      items.map((t, i) =>
        React.createElement(
          Snackbar,
          {
            key: t.id,
            open: true,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            sx: { position: "relative", mb: 0, mt: 0, bottom: "auto", right: "auto" },
            style: { transform: `translateY(-${i * 6}px)` },
          },
          React.createElement(
            Alert,
            {
              severity: t.type,
              variant: "filled",
              onClose: () => onClose(t.id),
              sx: { width: "100%", maxWidth: 420, boxShadow: 3 },
            },
            t.title && React.createElement(AlertTitle, { sx: { py: 0 } }, t.title),
            t.text,
          ),
        ),
      ),
    );
  }

  function ProcessStepRow({ step }) {
    const color =
      step.status === "done" ? "success.main"
        : step.status === "error" ? "error.main"
          : step.status === "running" ? "primary.main"
            : "text.disabled";
    return React.createElement(
      Stack,
      { direction: "row", spacing: 1, alignItems: "flex-start", className: "isa-process-step" },
      React.createElement("iconify-icon", {
        icon: STEP_ICON[step.status] || STEP_ICON.pending,
        style: { color: "var(--isa-step-color)", fontSize: 18, marginTop: 2, flexShrink: 0 },
        class: step.status === "running" ? "isa-spin" : "",
      }),
      React.createElement(
        Box,
        { sx: { flex: 1, minWidth: 0, "--isa-step-color": color } },
        React.createElement(Typography, { variant: "body2", sx: { color } }, step.label),
        step.detail && React.createElement(
          Typography,
          { variant: "caption", color: "text.secondary", display: "block" },
          step.detail,
        ),
      ),
    );
  }

  function ProcessPanel({ processes }) {
    const active = processes?.active || [];
    if (!active.length) return null;
    return React.createElement(
      Box,
      { className: "isa-process-panel-wrap" },
      active.map((p) =>
        React.createElement(
          Paper,
          {
            key: p.id,
            className: "isa-process-panel",
            elevation: 3,
            sx: { p: 1.5, mb: 1 },
          },
          React.createElement(
            Stack,
            { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 1 } },
            React.createElement(Typography, { variant: "subtitle2", sx: { flex: 1 } }, p.title),
            p.status === "running" && React.createElement(LinearProgress, { sx: { width: 80 } }),
          ),
          p.message && React.createElement(
            Typography,
            { variant: "caption", color: "text.secondary", display: "block", sx: { mb: 1 } },
            p.message,
          ),
          React.createElement(
            Stack,
            { spacing: 0.75 },
            ...(p.steps || []).map((s) => React.createElement(ProcessStepRow, { key: s.id, step: s })),
          ),
          p.error && React.createElement(
            Alert,
            { severity: "error", sx: { mt: 1, py: 0 } },
            p.error,
          ),
        ),
      ),
    );
  }

  function ConfirmDialog({ state, onAnswer }) {
    if (!state?.open) return null;
    return React.createElement(
      Dialog,
      { open: true, onClose: () => onAnswer(false), maxWidth: "xs", fullWidth: true },
      React.createElement(DialogTitle, null, state.title),
      React.createElement(
        DialogContent,
        { dividers: true },
        React.createElement(Typography, { component: "div", className: "isa-confirm-message", sx: { whiteSpace: "pre-wrap" } }, state.message),
      ),
      React.createElement(
        DialogActions,
        { sx: { gap: 1, px: 2, pb: 2 } },
        React.createElement(Button, { onClick: () => onAnswer(false) }, state.cancelLabel),
        React.createElement(Button, { variant: "contained", onClick: () => onAnswer(true) }, state.confirmLabel),
      ),
    );
  }

  function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [processes, setProcesses] = useState({ active: [], recent: [] });
    const [confirmState, setConfirmState] = useState(null);

    const removeToast = useCallback((id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((toast) => {
      setToasts((prev) => [...prev.slice(-5), toast]);
      const ms = toast.timeout ?? 4500;
      if (ms > 0) setTimeout(() => removeToast(toast.id), ms);
    }, [removeToast]);

    useEffect(() => subscribeToasts(addToast), [addToast]);
    useEffect(() => subscribeProcesses(setProcesses), []);

    useEffect(() => {
      function onConfirm(e) {
        setConfirmState({ open: true, ...e.detail });
      }
      window.addEventListener(FEEDBACK_CONFIRM_EVENT, onConfirm);
      return () => window.removeEventListener(FEEDBACK_CONFIRM_EVENT, onConfirm);
    }, []);

    function answerConfirm(ok) {
      setConfirmState(null);
      resolveConfirm(ok);
    }

    return React.createElement(
      React.Fragment,
      null,
      children,
      React.createElement(ToastStack, { items: toasts, onClose: removeToast }),
      React.createElement(
        Box,
        { className: "isa-process-anchor" },
        React.createElement(ProcessPanel, { processes }),
      ),
      React.createElement(ConfirmDialog, { state: confirmState, onAnswer: answerConfirm }),
    );
  }

  return { FeedbackProvider, ToastStack, ProcessPanel, ProcessStepRow, ConfirmDialog };
}
