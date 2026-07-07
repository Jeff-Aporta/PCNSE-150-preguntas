/** CodeMirror 5 — panel reutilizable con botón copiar (ISAFront). */
import { ensureCodeMirrorLoaded, ensureCodeMirrorStyles } from "../core/util/lazy-assets.js";
import { attachFoldGutterIcons } from "./code-mirror-fold-gutter.js";

export function ensureCodeMirrorCss() {
  if (typeof document === "undefined") return;
  ensureCodeMirrorStyles().catch(() => { /* ignore */ });
}

function getUiColorScheme() {
  if (typeof document === "undefined") return "dark";
  const scheme = document.documentElement.getAttribute("data-mui-color-scheme");
  if (scheme === "light" || scheme === "dark") return scheme;
  return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
}

/** Tema CodeMirror según MUI light/dark (dracula solo en oscuro). */
export function resolveCodeMirrorTheme(scheme = getUiColorScheme()) {
  return scheme === "light" ? "default" : "dracula";
}

function resolveMode(opts = {}) {
  if (opts.json) return { name: "javascript", json: true };
  if (opts.mode === "sql") return "text/x-sql";
  return opts.mode || "javascript";
}

function jsonFoldAvailable() {
  const CM = window.CodeMirror;
  return !!(CM?.fold?.brace && typeof CM.prototype?.foldCode === "function");
}

function registerJsonFoldHelper() {
  const CM = window.CodeMirror;
  if (!CM?.registerHelper || !CM?.fold?.brace) return;
  const foldFn = CM.fold.auto || CM.fold.brace;
  try {
    CM.registerHelper("fold", "javascript", foldFn);
  } catch {
    /* ya registrado */
  }
}

function applyJsonFoldOptions(opts, extraKeys = {}) {
  if (!jsonFoldAvailable()) return opts;
  const CM = window.CodeMirror;
  registerJsonFoldHelper();
  opts.gutters = ["CodeMirror-linenumbers", "CodeMirror-foldgutter"];
  opts.foldGutter = { rangeFinder: CM.fold.brace };
  opts.extraKeys = {
    ...extraKeys,
    "Ctrl-Q": (cm) => cm.foldCode(cm.getCursor()),
    "Ctrl-Shift-Q": (cm) => {
      if (typeof cm.unfoldAll === "function") cm.unfoldAll();
      else window.CodeMirror?.commands?.unfoldAll?.(cm);
    },
  };
  return opts;
}

function toastCopied() {
  const fb = window.ISAFront?.Feedback?.toast;
  if (fb?.success) {
    fb.success("Copiado al portapapeles");
    return;
  }
  if (typeof window.ISAFront?.showToast === "function") {
    window.ISAFront.showToast({ message: "Copiado al portapapeles", severity: "success" });
  }
}

async function copyText(text) {
  const s = String(text ?? "");
  if (!s) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      toastCopied();
      return;
    }
  } catch {
    /* fallback */
  }
  const ta = document.createElement("textarea");
  ta.value = s;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    toastCopied();
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta);
}

/**
 * Monta CodeMirror 5 en un contenedor DOM.
 * @returns {import("codemirror").Editor | null}
 */
export function mountCodeMirror(host, opts = {}) {
  ensureCodeMirrorCss();
  const CM = window.CodeMirror;
  if (!CM || !host) return null;

  const readOnly = !!opts.readOnly;
  const selectAllKeys = {
    "Ctrl-A": (cm) => cm.execCommand("selectAll"),
    "Cmd-A": (cm) => cm.execCommand("selectAll"),
  };
  const extraKeys = readOnly
    ? { ...selectAllKeys, ...(opts.extraKeys || {}) }
    : {
        Tab: (editor) => editor.replaceSelection("  ", "end"),
        ...selectAllKeys,
        ...(opts.extraKeys || {}),
      };

  const cmOpts = {
    value: opts.value ?? "",
    mode: resolveMode(opts),
    theme: opts.theme ?? resolveCodeMirrorTheme(),
    lineNumbers: opts.lineNumbers !== false,
    lineWrapping: !!opts.lineWrapping,
    readOnly,
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    viewportMargin: opts.viewportMargin ?? (readOnly ? Infinity : 10),
    extraKeys,
  };

  if (opts.json) applyJsonFoldOptions(cmOpts, cmOpts.extraKeys);

  const cm = CM(host, cmOpts);

  if (opts.json && jsonFoldAvailable()) attachFoldGutterIcons(cm);

  if (typeof opts.onChange === "function") {
    cm.on("change", () => opts.onChange(cm.getValue(), cm));
  }

  return cm;
}

function parseCssLength(value, fallback = 160) {
  if (value == null || value === "") return fallback;
  const s = String(value).trim();
  if (s.endsWith("rem")) return parseFloat(s) * 16;
  if (s.endsWith("px")) return parseFloat(s);
  if (s.endsWith("dvh") || s.endsWith("vh")) return (parseFloat(s) / 100) * window.innerHeight;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

function syncCmFillSize(cm, host) {
  if (!cm || !host) return;
  const h = host.clientHeight;
  if (h > 0) {
    cm.setSize(null, h);
    cm.refresh();
  }
}

function syncCmBoundedSize(cm, maxHeight, host, minHeight) {
  if (!cm || !maxHeight) return;
  const minH = parseCssLength(minHeight ?? "0", 0);
  const maxH = parseCssLength(maxHeight, 160);
  const wrap = cm.getOption?.("lineWrapping") === true;

  cm.refresh();
  const contentH = cm.getScrollInfo?.().height || minH;
  const pad = 4;
  const h = Math.min(Math.max(contentH + pad, minH), maxH);

  const chain = [
    host?.closest?.(".isa-cm-panel--bounded"),
    host?.closest?.(".isa-cm-editor-surface--bounded"),
    host,
  ].filter(Boolean);

for (const el of chain) {
        el.style.height = `${h}px`;
        el.style.maxHeight = String(maxHeight);
        if (minHeight) el.style.minHeight = String(minHeight);
        el.style.overflowX = "auto";
        el.style.overflowY = "hidden";
    }

  const wrapper = cm.getWrapperElement?.();
  if (wrapper) {
    wrapper.style.height = `${h}px`;
    wrapper.style.maxHeight = `${h}px`;
    wrapper.style.overflow = "hidden";
  }

  const scroller = cm.getScrollerElement?.();
  if (scroller) {
    scroller.style.height = `${h}px`;
    scroller.style.maxHeight = `${h}px`;
    scroller.style.overflowY = "auto";
    scroller.style.overflowX = wrap ? "hidden" : "auto";
  }

  cm.setSize(null, h);
  cm.refresh();
}

export function destroyCodeMirror(cm) {
  if (!cm) return;
  const wrapper = cm.getWrapperElement?.();
  wrapper?.parentNode?.removeChild(wrapper);
}

export function createCodeMirrorPanel(React, MUI) {
  const { useRef, useEffect, useState } = React;

  function cmNeedsSql(json, mode) {
    if (json) return false;
    return mode === "sql" || mode === "text/x-sql";
  }

  const WRAP_STORAGE_KEY = "isa:cm:wrap";
  function readWrapDefault() {
    try {
      const v = window.localStorage?.getItem?.(WRAP_STORAGE_KEY);
      return v == null ? false : v === "1" || v === "true";
    } catch {
      return false;
    }
  }
  function writeWrapDefault(v) {
    try {
      window.localStorage?.setItem?.(WRAP_STORAGE_KEY, v ? "1" : "0");
    } catch { /* ignore */ }
  }

  function CodeMirrorPanel({
    value = "",
    onChange,
    readOnly = false,
    json = false,
    mode,
    minHeight = "8rem",
    maxHeight,
    fill = false,
    className = "",
    copyTitle = "Copiar",
    fullPageTitle = "Editor",
    enableFullPage = false,
    placeholder = "",
    lineWrapping = false,
    lineNumbers = true,
    toolbarExtra = null,
    enableWrapToggle = true,
  }) {
    const hostRef = useRef(null);
    const cmRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const syncingRef = useRef(false);
    const wrapControlled = lineWrapping !== false && lineWrapping != null;
    const [wrap, setWrap] = useState(() => (wrapControlled ? !!lineWrapping : readWrapDefault()));
    const [fullOpen, setFullOpen] = useState(false);
    const [cmReady, setCmReady] = useState(() => typeof window.CodeMirror !== "undefined");

    function toggleWrap() {
      const next = !wrap;
      setWrap(next);
      writeWrapDefault(next);
      const cm = cmRef.current;
      if (cm?.setOption) cm.setOption("lineWrapping", next);
    }

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      if (cmReady) return undefined;
      let cancelled = false;
      ensureCodeMirrorLoaded({ sql: cmNeedsSql(json, mode) })
        .then(() => { if (!cancelled) setCmReady(true); })
        .catch((err) => console.warn("CodeMirror lazy load:", err));
      return () => { cancelled = true; };
    }, [cmReady, json, mode]);

    useEffect(() => {
      const host = hostRef.current;
      if (!host || !cmReady) return undefined;

      if (typeof window.CodeMirror === "undefined") return undefined;

      const cm = mountCodeMirror(host, {
        value: value || "",
        json,
        mode,
        readOnly,
        lineWrapping: wrapControlled ? !!lineWrapping : wrap,
        lineNumbers,
        viewportMargin: readOnly && !(maxHeight && !fill) ? Infinity : 10,
        onChange: readOnly
          ? undefined
          : (next) => {
            if (syncingRef.current) return;
            onChangeRef.current?.(next);
          },
      });
      cmRef.current = cm;

      const onResize = () => {
        if (fill) syncCmFillSize(cm, host);
        else if (maxHeight) syncCmBoundedSize(cm, maxHeight, host, minHeight);
        else cm?.refresh?.();
      };
      window.addEventListener("resize", onResize);
      let ro = null;
      if (fill && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => onResize());
        ro.observe(host);
      }
      const t = setTimeout(onResize, 0);
      const t2 = setTimeout(onResize, 120);

      return () => {
        ro?.disconnect();
        clearTimeout(t);
        clearTimeout(t2);
        window.removeEventListener("resize", onResize);
        destroyCodeMirror(cm);
        cmRef.current = null;
      };
    }, [cmReady, json, mode, readOnly, lineWrapping, lineNumbers, fill, maxHeight, minHeight]);

    useEffect(() => {
      const cm = cmRef.current;
      if (!cm) return;
      const cur = cm.getValue();
      const next = value ?? "";
      if (cur === next) return;
      syncingRef.current = true;
      const scroll = cm.getScrollInfo();
      const cursor = cm.getCursor();
      cm.setValue(next);
      cm.scrollTo(scroll.left, scroll.top);
      if (next && !readOnly) cm.setCursor(cursor);
      syncingRef.current = false;
      if (maxHeight && !fill) syncCmBoundedSize(cm, maxHeight, hostRef.current, minHeight);
    }, [value, readOnly, maxHeight, fill, minHeight]);

    useEffect(() => {
      const cm = cmRef.current;
      const host = hostRef.current;
      if (!cm || !host) return;
      const sync = () => {
        if (fill) syncCmFillSize(cm, host);
        else if (maxHeight) syncCmBoundedSize(cm, maxHeight, host, minHeight);
        else cm.refresh();
      };
      sync();
      const t = setTimeout(sync, 0);
      const t2 = setTimeout(sync, 150);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }, [minHeight, maxHeight, fill]);

    useEffect(() => {
      if (!cmReady) return undefined;
      function applyTheme() {
        const cm = cmRef.current;
        if (!cm?.setOption) return;
        const next = resolveCodeMirrorTheme();
        if (cm.getOption("theme") !== next) {
          cm.setOption("theme", next);
          cm.refresh();
        }
      }
      applyTheme();
      const obs = new MutationObserver(applyTheme);
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-mui-color-scheme"],
      });
      return () => obs.disconnect();
    }, [cmReady]);

    const panelClass = [
      "isa-cm-panel",
      fill ? "isa-cm-panel--fill" : "",
      maxHeight ? "isa-cm-panel--bounded" : "",
      (enableFullPage || toolbarExtra) ? "isa-cm-panel--toolbar" : "",
      className,
    ].filter(Boolean).join(" ");

const hostStyle = { minHeight };
    if (maxHeight) {
        hostStyle.maxHeight = maxHeight;
        hostStyle.overflowX = "auto";
        hostStyle.overflowY = "hidden";
    }
    const panelStyle = fill
      ? { minHeight: 0, height: "100%", flex: "1 1 auto" }
      : { minHeight, ...(maxHeight ? { maxHeight } : {}) };

    function renderToolbar(getValue) {
      return React.createElement(
        "div",
        { className: "isa-cm-panel__toolbar", "aria-label": "Acciones del editor" },
        toolbarExtra,
        enableWrapToggle && !wrapControlled && React.createElement(
          MUI.Tooltip,
          { title: wrap ? "Quitar ajuste de línea" : "Ajustar línea (word wrap)" },
          React.createElement(
            MUI.IconButton,
            {
              size: "small",
              className: "isa-cm-panel__fab isa-cm-panel__wrap",
              "aria-label": wrap ? "Quitar word wrap" : "Activar word wrap",
              "aria-pressed": wrap,
              onClick: toggleWrap,
            },
            React.createElement("iconify-icon", {
              icon: wrap ? "mdi:wrap-disabled" : "mdi:wrap",
              width: "14",
              height: "14",
            }),
          ),
        ),
        enableFullPage && React.createElement(
          MUI.Tooltip,
          { title: "Ver a pantalla completa" },
          React.createElement(
            MUI.IconButton,
            {
              size: "small",
              className: "isa-cm-panel__fab",
              "aria-label": "Pantalla completa",
              onClick: () => setFullOpen(true),
            },
            React.createElement("iconify-icon", { icon: "mdi:fullscreen", width: "14", height: "14" }),
          ),
        ),
        React.createElement(
          MUI.Tooltip,
          { title: copyTitle },
          React.createElement(
            MUI.IconButton,
            {
              size: "small",
              className: "isa-cm-panel__fab isa-cm-panel__copy",
              "aria-label": copyTitle,
              onClick: () => copyText(getValue()),
            },
            React.createElement("iconify-icon", { icon: "mdi:content-copy", width: "14", height: "14" }),
          ),
        ),
      );
    }

    function renderFullPageDialog() {
      if (!enableFullPage) return null;
      return React.createElement(
        MUI.Dialog,
        { open: fullOpen, onClose: () => setFullOpen(false), fullScreen: true, scroll: "paper" },
        React.createElement(
          MUI.DialogTitle,
          { sx: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: 1, px: 2 } },
          React.createElement(MUI.Box, { component: "span", sx: { fontWeight: 600, fontSize: "1rem" } }, fullPageTitle),
          React.createElement(
            MUI.Box,
            { sx: { display: "flex", gap: 0.5 } },
            React.createElement(
              MUI.Tooltip,
              { title: copyTitle },
              React.createElement(
                MUI.IconButton,
                { size: "small", "aria-label": copyTitle, onClick: () => copyText(cmRef.current?.getValue?.() ?? value) },
                React.createElement("iconify-icon", { icon: "mdi:content-copy", width: "14", height: "14" }),
              ),
            ),
            React.createElement(
              MUI.Tooltip,
              { title: "Cerrar" },
              React.createElement(
                MUI.IconButton,
                { size: "small", "aria-label": "Cerrar", onClick: () => setFullOpen(false) },
                React.createElement("iconify-icon", { icon: "mdi:close", width: "14", height: "14" }),
              ),
            ),
          ),
        ),
        React.createElement(
          MUI.DialogContent,
          { dividers: true, sx: { p: 1, display: "flex", flexDirection: "column", minHeight: 0, flex: 1 } },
          React.createElement(CodeMirrorPanel, {
            value,
            onChange,
            json,
            mode,
            readOnly,
            fill: true,
            lineWrapping,
            lineNumbers,
            copyTitle,
            placeholder,
            toolbarExtra,
            className: "isa-cm-panel--dialog",
          }),
        ),
      );
    }

    if (!cmReady || typeof window.CodeMirror === "undefined") {
      if (cmReady) {
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "div",
            { className: panelClass, style: panelStyle },
            renderToolbar(() => value),
            readOnly
              ? React.createElement("pre", {
                className: "isa-cm-fallback",
                style: { ...hostStyle, overflow: "auto", margin: 0, flex: 1, minHeight: 0 },
              }, value || placeholder)
              : React.createElement("textarea", {
                className: "isa-cm-fallback json-cm-fallback",
                style: { ...hostStyle, overflow: "auto", flex: 1, minHeight: 0, width: "100%" },
                value,
                placeholder,
                spellCheck: false,
                onChange: (e) => onChange?.(e.target.value),
              }),
          ),
          renderFullPageDialog(),
        );
      }
      return React.createElement("div", { className: panelClass, style: panelStyle, "aria-hidden": true });
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        { className: panelClass, style: panelStyle },
        renderToolbar(() => cmRef.current?.getValue?.() ?? value),
        React.createElement("div", { className: "isa-cm-host", ref: hostRef, style: hostStyle }),
      ),
      renderFullPageDialog(),
    );
  }

  return { CodeMirrorPanel };
}

export function registerCodeMirror(React, MUI) {
  ensureCodeMirrorCss();
  const api = createCodeMirrorPanel(React, MUI);
  window.ISAFront = window.ISAFront || {};
  window.ISAFront.CodeMirrorPanel = api.CodeMirrorPanel;
  window.ISAFront.mountCodeMirror = mountCodeMirror;
  window.ISAFront.destroyCodeMirror = destroyCodeMirror;
  window.ISAFront.ensureCodeMirrorCss = ensureCodeMirrorCss;
  window.ISAFront.resolveCodeMirrorTheme = resolveCodeMirrorTheme;
  return api;
}
