/** Acceso al stack React/MUI cargado por stack.mjs (sin build). */
export function getReact() {
  const r = globalThis.React;
  if (!r?.useState) throw new Error("React no cargado — ejecutar stack.mjs primero");
  return r;
}

export function getReactDOM() {
  const r = globalThis.ReactDOM;
  if (!r?.createRoot) throw new Error("ReactDOM no cargado — ejecutar stack.mjs primero");
  return r;
}

export function getMaterialUI() {
  const m = globalThis.MaterialUI;
  if (!m?.ThemeProvider) throw new Error("MaterialUI no cargado — ejecutar stack.mjs primero");
  return m;
}
