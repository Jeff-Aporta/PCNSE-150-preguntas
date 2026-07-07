/**
 * Componentes compartidos de ejecución SQL (JAGUDELOE + isa-patyia).
 * El front solo deshabilita botones; la autorización la valida el backend.
 */
import { createCodeMirrorPanel } from "./code-mirror.js";

export function createSqlExec(React, MUI) {
  const { useState, useEffect, useRef } = React;
  const { CodeMirrorPanel } = createCodeMirrorPanel(React, MUI);
  const {
    Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, Tooltip, Button, Alert, Box, Chip, IconButton, CircularProgress,
  } = MUI;

  function feedbackApi() {
    return globalThis.ISAFront?.Feedback
      || (typeof window !== "undefined" && window.ISAJ?.Feedback)
      || null;
  }

  function uiIcon() {
    return globalThis.ISAFront?.UI?.Icon
      || (typeof window !== "undefined" && window.ISAJ?.UI?.Icon)
      || null;
  }

  function ExecIconButton({ tip, disabled, busy, onClick, color = "primary" }) {
    const Icon = uiIcon();
    return React.createElement(
      Tooltip,
      { title: tip },
      React.createElement(
        "span",
        null,
        React.createElement(IconButton, {
          size: "small",
          color,
          disabled: disabled || busy,
          onClick,
          "aria-label": tip,
          sx: { bgcolor: color === "success" ? "success.main" : "primary.main", color: "#fff", "&:hover": { opacity: 0.92 }, "&.Mui-disabled": { bgcolor: "action.disabledBackground" } },
        }, busy
          ? React.createElement(CircularProgress, { size: 18, color: "inherit" })
          : Icon
            ? React.createElement(Icon, { icon: "mdi:play-circle-outline", size: 22 })
            : "▶"),
      ),
    );
  }

  const PROGRESS_STEPS = [
    { at: 0, msg: "Enviando SQL al servidor…" },
    { at: 1500, msg: "Conectando con SQL Server…" },
    { at: 4000, msg: "Compilando y ejecutando consulta…" },
    { at: 10000, msg: "Ejecutando (puede tardar con muchas filas)…" },
    { at: 25000, msg: "Aún en ejecución, procesando datos…" },
    { at: 60000, msg: "Operación pesada en curso, no cierres la pestaña…" },
  ];

  function fmtElapsed(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r.toString().padStart(2, "0")}s` : `${r}s`;
  }

  function RunButton({
    unlocked,
    onToggle,
    onRun,
    busy = false,
    disabled = false,
    runTitle = "Ejecutar",
    lockTitle = "Desbloquear ejecución (candado de seguridad)",
    unlockTitle = "Bloquear ejecución",
    lockDisabled = false,
  }) {
    return React.createElement(
      "div",
      { className: "run-group" },
      React.createElement(
        Tooltip,
        { title: unlocked ? unlockTitle : lockTitle },
        React.createElement(
          "span",
          null,
          React.createElement(Button, {
            size: "small",
            variant: "outlined",
            disabled: lockDisabled || disabled,
            onClick: () => onToggle(!unlocked),
            "aria-label": unlocked ? unlockTitle : lockTitle,
          }, unlocked ? "🔓" : "🔒"),
        ),
      ),
      React.createElement(
        Tooltip,
        { title: runTitle },
        React.createElement(
          "span",
          null,
          React.createElement(ExecIconButton, {
            tip: runTitle,
            busy,
            disabled: !unlocked || disabled,
            onClick: () => { if (unlocked && !busy && !disabled) onRun?.(); },
            color: "success",
          }),
        ),
      ),
    );
  }

  function SqlViewer({ value, height = "240px" }) {
    return React.createElement(CodeMirrorPanel, {
      value: value || "-- SQL vacío",
      readOnly: true,
      mode: "sql",
      minHeight: height,
      maxHeight: height,
      className: "sql-viewer custom-scrollbar",
    });
  }

  function SqlExecCard({
    title,
    sql,
    desc = "",
    height = "240px",
    confirmMessage = "",
    executeSql,
    allowRun = true,
    disabled = false,
    runTitle = "Ejecutar",
    lockTitle,
    unlockTitle,
    requireLock = true,
  }) {
    const [approved, setApproved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [elapsedMs, setElapsedMs] = useState(0);
    const [progressMsg, setProgressMsg] = useState("");
    const tickRef = useRef(null);
    const t0Ref = useRef(0);

    useEffect(() => () => {
      if (tickRef.current) clearInterval(tickRef.current);
    }, []);

    function startTicker() {
      t0Ref.current = Date.now();
      setElapsedMs(0);
      setProgressMsg(PROGRESS_STEPS[0].msg);
      tickRef.current = setInterval(() => {
        const ms = Date.now() - t0Ref.current;
        setElapsedMs(ms);
        let cur = PROGRESS_STEPS[0].msg;
        for (const step of PROGRESS_STEPS) if (ms >= step.at) cur = step.msg;
        setProgressMsg(cur);
      }, 250);
    }

    function stopTicker() {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }

    async function doRun() {
      if (!executeSql || !sql?.trim()) return;
      setBusy(true);
      setErr("");
      setMsg("");
      const fb = feedbackApi();
      const runner = fb?.runProcess?.({
        title: title || "Ejecución SQL",
        steps: [
          { id: "send", label: "Enviar SQL al servidor" },
          { id: "exec", label: "Conectar y ejecutar en SQL Server" },
          { id: "result", label: "Procesar resultado" },
        ],
      });
      runner?.stepRunning("send");
      startTicker();
      try {
        runner?.stepDone("send");
        runner?.stepRunning("exec", PROGRESS_STEPS[0].msg);
        const res = await executeSql(sql);
        runner?.stepDone("exec");
        runner?.stepRunning("result");
        if (res.ok !== false) {
          const aff = res.rowsAffected ?? res.rowCount ?? res.rows?.length
            ?? res.rowsAffectedPerStmt?.reduce?.((a, b) => a + b, 0);
          const detail = aff != null
            ? ` · ${aff} fila${aff === 1 ? "" : "s"} afectada${aff === 1 ? "" : "s"}`
            : (res.output ? ` · ${res.output}` : "");
          const okMsg = `${title}${detail} (${fmtElapsed(Date.now() - t0Ref.current)})`;
          setMsg(okMsg);
          runner?.stepDone("result");
          runner?.succeed(okMsg);
        } else {
          const errMsg = res.error ?? res.output ?? "Error desconocido";
          setErr(errMsg);
          runner?.stepError("result", errMsg);
          runner?.fail(errMsg);
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        setErr(errMsg);
        runner?.stepError("exec", errMsg);
        runner?.fail(errMsg);
      } finally {
        stopTicker();
        setBusy(false);
        setConfirmOpen(false);
      }
    }

    function onRunClick() {
      if (requireLock && !approved) {
        setErr("Desbloquea con el candado antes de ejecutar");
        return;
      }
      if (!executeSql) {
        setErr("Ejecutor SQL no disponible");
        return;
      }
      setConfirmOpen(true);
    }

    const lockDisabled = disabled || !allowRun;
    const Icon = uiIcon();

    async function copySql() {
      if (!sql?.trim()) return;
      try {
        await navigator.clipboard.writeText(sql);
        setMsg("SQL copiado");
        feedbackApi()?.toast?.info?.("SQL copiado al portapapeles");
        setTimeout(() => setMsg(""), 1600);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        setErr(errMsg);
        feedbackApi()?.toast?.error?.(errMsg);
      }
    }

    function toolbarIcon(icon, tip, onClick, extra = {}) {
      return React.createElement(
        Tooltip,
        { title: tip },
        React.createElement(
          "span",
          null,
          React.createElement(IconButton, {
            size: "small",
            disabled: extra.disabled,
            onClick,
            "aria-label": tip,
          }, Icon
            ? React.createElement(Icon, { icon, size: 18 })
            : extra.label || "…"),
        ),
      );
    }

    return React.createElement(
      Paper,
      { className: "sql-exec-card", elevation: 0 },
      React.createElement(
        "div",
        { className: "sql-exec-head" },
        React.createElement(Typography, { variant: "subtitle2", fontWeight: 600 }, title),
        React.createElement(
          Stack,
          { direction: "row", spacing: 0.25, alignItems: "center" },
          toolbarIcon("mdi:content-copy", "Copiar SQL", copySql, { disabled: !sql?.trim() }),
          toolbarIcon("mdi:eye-outline", "Abrir SQL", () => setModalOpen(true), { disabled: !sql?.trim(), label: "Ver" }),
          allowRun && executeSql && React.createElement(RunButton, {
            unlocked: approved,
            onToggle: setApproved,
            onRun: onRunClick,
            busy,
            disabled: disabled || !sql?.trim(),
            runTitle,
            lockTitle: lockTitle || runTitle,
            unlockTitle,
            lockDisabled,
          }),
        ),
      ),
      desc && React.createElement(
        Typography,
        { variant: "caption", color: "text.secondary", display: "block", sx: { mb: 0.5 } },
        desc,
      ),
      busy && React.createElement(
        "div",
        { className: "exec-progress" },
        React.createElement("span", { className: "dot" }),
        React.createElement("span", { className: "msg" }, progressMsg),
        React.createElement("span", { className: "elapsed" }, fmtElapsed(elapsedMs)),
      ),
      msg && !busy && React.createElement(Typography, { variant: "caption", color: "success.main" }, msg),
      err && React.createElement(Typography, { variant: "caption", color: "error.main", display: "block" }, err),
      React.createElement(SqlViewer, { value: sql, height }),
      React.createElement(
        Dialog,
        { open: modalOpen, onClose: () => setModalOpen(false), maxWidth: "md", fullWidth: true },
        React.createElement(DialogTitle, null, title),
        React.createElement(DialogContent, { dividers: true }, React.createElement(SqlViewer, { value: sql, height: "60vh" })),
      ),
      React.createElement(
        Dialog,
        { open: confirmOpen, onClose: () => !busy && setConfirmOpen(false) },
        React.createElement(DialogTitle, null, "Confirmar ejecución"),
        React.createElement(
          DialogContent,
          null,
          React.createElement("p", null, confirmMessage || `Vas a ejecutar:\n\n${title}\n\n¿Continuar?`),
        ),
        React.createElement(
          DialogActions,
          { sx: { gap: 1, px: 2, pb: 2 } },
          React.createElement(Button, { onClick: () => setConfirmOpen(false), disabled: busy }, "Cancelar"),
          React.createElement(Button, { variant: "contained", onClick: doRun, disabled: busy }, busy ? "Ejecutando…" : "Ejecutar"),
        ),
      ),
    );
  }

  /**
   * Bloque SQL de bitácora (CodeMirror + ejecutar + opcional revisado).
   * capId: capacidad de servicio (p. ej. sql.exec.isa).
   */
  function SqlBlock({
    title,
    sql,
    dbTarget,
    project,
    capId = "sql.exec.isa",
    canRun,
    blockReason,
    onExecute,
    extraToolbar,
    Icon,
  }) {
    const [exec, setExec] = useState(false);
    const [res, setRes] = useState(null);
    const [err, setErr] = useState(null);
    const db = dbTarget || (project === "clientesis" ? "clientesis" : "paty");
    const allowed = typeof canRun === "function" ? canRun(capId) : !!canRun;
    const tip = allowed
      ? `Ejecutar en BD ${db} (servicio autorizado)`
      : (typeof blockReason === "function" ? blockReason(capId) : String(blockReason || "Sin permiso de ejecución SQL"));

    function run() {
      if (!allowed || !onExecute) return;
      setExec(true);
      setErr(null);
      setRes(null);
      const fb = feedbackApi();
      const runner = fb?.runProcess?.({
        title: title || "Consulta SQL",
        steps: [
          { id: "run", label: `Ejecutar en BD ${db}` },
        ],
      });
      runner?.stepRunning("run");
      Promise.resolve(onExecute({ sql, dbTarget: db, project }))
        .then((d) => {
          const rowCount = d && (d.rowCount ?? (d.rows ? d.rows.length : undefined));
          setRes({ rows: d && d.rows, rowCount });
          const okMsg = "Ejecución correcta" + (rowCount != null ? ` — ${rowCount} fila(s)` : "");
          runner?.stepDone("run", okMsg);
          runner?.succeed(okMsg);
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          setErr(msg);
          runner?.stepError("run", msg);
          runner?.fail(msg);
        })
        .finally(() => setExec(false));
    }

    return React.createElement(
      Box,
      { sx: { my: 1.5, border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" } },
      React.createElement(
        Stack,
        {
          direction: "row",
          spacing: 1,
          alignItems: "center",
          flexWrap: "wrap",
          sx: { p: 1, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" },
        },
        Icon && React.createElement(Icon, { icon: "mdi:database-search-outline" }),
        React.createElement(
          Typography,
          { variant: "subtitle2", sx: { flex: 1, minWidth: 120 } },
          title || "Consulta SQL",
        ),
        React.createElement(Chip, {
          size: "small",
          color: db === "clientesis" ? "secondary" : "primary",
          variant: "outlined",
          label: "BD: " + db,
        }),
        extraToolbar,
        React.createElement(ExecIconButton, {
          tip,
          busy: exec,
          disabled: !allowed || !onExecute,
          onClick: run,
        }),
      ),
      React.createElement(CodeMirrorPanel, {
        value: sql,
        readOnly: true,
        mode: "sql",
        minHeight: "6rem",
        className: "sql-cm sql-cm-scroll",
      }),
      res && React.createElement(
        Alert,
        { severity: "success", sx: { m: 1 } },
        "Ejecución correcta" + (res.rowCount != null ? " — " + res.rowCount + " fila(s)" : ""),
      ),
      err && React.createElement(Alert, { severity: "error", sx: { m: 1 } }, err),
    );
  }

  return { RunButton, SqlViewer, SqlExecCard, SqlBlock };
}

export function registerSqlExec(ns, React, MUI) {
  const api = createSqlExec(React, MUI);
  window[ns] = window[ns] || {};
  window[ns].UI = window[ns].UI || {};
  Object.assign(window[ns].UI, api);
  return api;
}
