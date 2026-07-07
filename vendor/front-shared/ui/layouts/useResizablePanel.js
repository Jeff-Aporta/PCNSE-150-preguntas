/**
 * Hook: ancho redimensionable + colapso para panel lateral (IsaSplitView).
 * Persiste ancho en localStorage cuando storageKey está definido.
 */
(function (global) {
  "use strict";
  const React = global.React;
  if (!React) return;

  const DEFAULT_W = global.ISA_SPLIT_PANEL_DEFAULT_WIDTH || 380;
  const MIN_W = global.ISA_SPLIT_PANEL_MIN_WIDTH || 220;
  const MAX_W = global.ISA_SPLIT_PANEL_MAX_WIDTH || 720;

  function clampWidth(w, minW, maxW) {
    return Math.min(maxW, Math.max(minW, Math.round(w)));
  }

  function readStoredWidth(storageKey, fallback, minW, maxW, readPersisted) {
    if (typeof readPersisted === "function") {
      const n = readPersisted();
      if (Number.isFinite(n) && n > 0) return clampWidth(n, minW, maxW);
      return fallback;
    }
    if (!storageKey) return fallback;
    try {
      const n = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(n)) return clampWidth(n, minW, maxW);
    } catch (_) { /* ignore */ }
    return fallback;
  }

  function persistWidth(storageKey, w, writePersisted) {
    if (typeof writePersisted === "function") {
      writePersisted(w);
      return;
    }
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, String(w));
    } catch (_) { /* ignore */ }
  }

  function useResizablePanel(opts) {
    opts = opts || {};
    const minW = opts.minWidth != null ? opts.minWidth : MIN_W;
    const maxW = opts.maxWidth != null ? opts.maxWidth : MAX_W;
    const defaultW = opts.defaultWidth != null ? opts.defaultWidth : DEFAULT_W;
    const storageKey = opts.storageKey || "";
    const readPersisted = opts.readPersistedWidth;
    const writePersisted = opts.writePersistedWidth;

    const [width, setWidth] = React.useState(function () {
      return readStoredWidth(storageKey, defaultW, minW, maxW, readPersisted);
    });
    const [collapsed, setCollapsed] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);
    const dragRef = React.useRef({ startX: 0, startW: defaultW });
    const widthBeforeCollapseRef = React.useRef(width);

    const toggleCollapsed = React.useCallback(function () {
      if (collapsed) {
        setCollapsed(false);
        setWidth(clampWidth(widthBeforeCollapseRef.current || defaultW, minW, maxW));
        return;
      }
      widthBeforeCollapseRef.current = width;
      setCollapsed(true);
    }, [collapsed, width, defaultW, minW, maxW]);

    const onResizeStart = React.useCallback(function (e) {
      if (e.button !== 0 || collapsed) return;
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startW: width };
      setDragging(true);
    }, [width, collapsed]);

    React.useEffect(function () {
      if (!dragging) return undefined;
      global.document.body.classList.add("isa-split-resize-active");

      function onMove(ev) {
        const dx = ev.clientX - dragRef.current.startX;
        setWidth(clampWidth(dragRef.current.startW + dx, minW, maxW));
      }

      function onUp() {
        setDragging(false);
        setWidth(function (w) {
          const next = clampWidth(w, minW, maxW);
          persistWidth(storageKey, next, writePersisted);
          return next;
        });
      }

      global.addEventListener("mousemove", onMove);
      global.addEventListener("mouseup", onUp);
      return function () {
        global.document.body.classList.remove("isa-split-resize-active");
        global.removeEventListener("mousemove", onMove);
        global.removeEventListener("mouseup", onUp);
      };
    }, [dragging, minW, maxW, storageKey, writePersisted]);

    return {
      width: width,
      collapsed: collapsed,
      dragging: dragging,
      setCollapsed: setCollapsed,
      toggleCollapsed: toggleCollapsed,
      onResizeStart: onResizeStart,
    };
  }

  global.ISAFront = global.ISAFront || {};
  global.ISAFront.Layout = global.ISAFront.Layout || {};
  global.ISAFront.Layout.useResizablePanel = useResizablePanel;
})(typeof globalThis !== "undefined" ? globalThis : window);
