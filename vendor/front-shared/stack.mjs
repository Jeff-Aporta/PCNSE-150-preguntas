/**
 * Una sola instancia React (ESM import map) + MUI 9 — obligatorio para hooks/ThemeProvider.
 * GH Pages: https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/stack.mjs
 *
 * No cargar React UMD en index.html (duplica React → useMemo null en MUI).
 */
const w = globalThis;

export const stackReady = (async () => {
  const [ReactMod, clientMod, domMod, MUIMod, jsxMod] = await Promise.all([
    import("react"),
    import("react-dom/client"),
    import("react-dom"),
    import("@mui/material"),
    import("react/jsx-runtime"),
  ]);
  const React = ReactMod.default ?? ReactMod;
  const jsxRuntime = jsxMod.default ?? jsxMod;
  const createRoot = clientMod.createRoot ?? clientMod.default?.createRoot;
  const ReactDOMFull = domMod.default ?? domMod;
  if (!createRoot) throw new Error("react-dom/client: createRoot no disponible");
  if (typeof ReactDOMFull.createPortal !== "function") {
    throw new Error("react-dom: createPortal no disponible");
  }

  // bare-to-window shims mapean react/jsx-runtime → window.React; exponer jsx/jsxs.
  let ReactExport = React;
  if (typeof jsxRuntime.jsx === "function") {
    try {
      React.jsx = jsxRuntime.jsx;
      React.jsxs = jsxRuntime.jsxs;
    } catch {
      ReactExport = { ...React, jsx: jsxRuntime.jsx, jsxs: jsxRuntime.jsxs };
    }
  }
  w.React = ReactExport;
  w.__jsxRuntime = jsxRuntime;
  w.ReactDOM = { createRoot, createPortal: ReactDOMFull.createPortal.bind(ReactDOMFull) };
  w.MaterialUI = MUIMod;
})();

w.__stackReady = stackReady;
